import axios, { AxiosInstance } from 'axios';
import qs from 'qs';
import OAuth from 'oauth-1.0a';
import crypto from 'crypto';

const GARMIN_BASE_URL = 'https://connect.garmin.com';
const GARMIN_SSO_ORIGIN = 'https://sso.garmin.com';
const GARMIN_SSO_EMBED = 'https://sso.garmin.com/sso/embed';
const SIGNIN_URL = 'https://sso.garmin.com/sso/signin';
const OAUTH_CONSUMER_URL = 'https://thegarth.s3.amazonaws.com/oauth_consumer.json';
const OAUTH_URL = 'https://connectapi.garmin.com/oauth-service/oauth';

const CSRF_RE = /name="_csrf"\s+value="(.+?)"/;
const TICKET_RE = /ticket=([^"]+)"/;
const MFA_FORM_ACTION_RE = /<form[^>]*action="([^"]+)"/i;

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36';
const USER_AGENT_MOBILE = 'com.garmin.android.apps.connectmobile';

// Keep axios session alive between start and verify requests
// (module-level — persists across API calls in same process)
interface PendingSession {
  client: AxiosInstance;
  formAction: string;
  csrfToken: string;
  mfaFieldName: string;
  createdAt: number;
}
const pendingSessions = new Map<string, PendingSession>();

// Clean up expired sessions (> 5 min old)
function cleanSessions() {
  const now = Date.now();
  for (const [id, s] of pendingSessions) {
    if (now - s.createdAt > 5 * 60 * 1000) pendingSessions.delete(id);
  }
}

function createAxiosClient(): AxiosInstance {
  const cookieStore: Record<string, string> = {};

  const client = axios.create({ maxRedirects: 5, validateStatus: () => true });

  client.interceptors.response.use((response) => {
    const raw = response.headers['set-cookie'];
    const cookies = raw ? (Array.isArray(raw) ? raw : [raw]) : [];
    for (const c of cookies) {
      const [pair] = c.split(';');
      const eq = pair.indexOf('=');
      if (eq > 0) {
        cookieStore[pair.slice(0, eq).trim()] = pair.slice(eq + 1).trim();
      }
    }
    return response;
  });

  client.interceptors.request.use((config) => {
    const str = Object.entries(cookieStore).map(([k, v]) => `${k}=${v}`).join('; ');
    if (str) config.headers['Cookie'] = str;
    return config;
  });

  return client;
}

export interface LoginResult {
  needsMFA: false;
  oauth1Token: Record<string, unknown>;
  oauth2Token: Record<string, unknown>;
}

export interface MFARequired {
  needsMFA: true;
  sessionId: string;
}

export async function startGarminLogin(email: string, password: string): Promise<LoginResult | MFARequired> {
  cleanSessions();
  const client = createAxiosClient();
  const headers = { 'User-Agent': USER_AGENT };

  // Step 1: init SSO
  await client.get(`${GARMIN_SSO_EMBED}?${qs.stringify({ clientId: 'GarminConnect', locale: 'en', service: GARMIN_BASE_URL })}`, { headers });

  // Step 2: get signin page + CSRF
  const step2 = await client.get(
    `${SIGNIN_URL}?${qs.stringify({ id: 'gauth-widget', embedWidget: true, locale: 'en', gauthHost: GARMIN_SSO_EMBED })}`,
    { headers, responseType: 'text', transformResponse: [(d) => d] }
  );
  const csrfMatch = CSRF_RE.exec(String(step2.data));
  if (!csrfMatch) throw new Error('Could not get CSRF token from Garmin');
  const csrf = csrfMatch[1];

  // Step 3: submit credentials
  const signinParams = qs.stringify({
    id: 'gauth-widget', embedWidget: true, clientId: 'GarminConnect',
    locale: 'en', gauthHost: GARMIN_SSO_EMBED, service: GARMIN_SSO_EMBED,
    source: GARMIN_SSO_EMBED, redirectAfterAccountLoginUrl: GARMIN_SSO_EMBED,
    redirectAfterAccountCreationUrl: GARMIN_SSO_EMBED,
  });
  const step3 = await client.post(
    `${SIGNIN_URL}?${signinParams}`,
    qs.stringify({ username: email, password, embed: 'true', _csrf: csrf }),
    {
      headers: { ...headers, 'Content-Type': 'application/x-www-form-urlencoded', 'Origin': GARMIN_SSO_ORIGIN, 'Referer': SIGNIN_URL },
      responseType: 'text',
      transformResponse: [(data) => data], // prevent axios JSON auto-parse
    }
  );

  const html: string = String(step3.data);
  console.log('[Garmin] step3 status:', step3.status);
  console.log('[Garmin] step3 html snippet:', html.slice(0, 600));

  // Success — no MFA
  const ticketMatch = TICKET_RE.exec(html);
  if (ticketMatch) {
    return { needsMFA: false, ...(await completeOAuth(client, ticketMatch[1])) };
  }

  // MFA required — store the live client in memory
  const formActionMatch = MFA_FORM_ACTION_RE.exec(html);
  const mfaCsrfMatch = CSRF_RE.exec(html);
  const inputNameMatch = /name="([^"]*(?:mfa|otp|code|verif|token)[^"]*)"/i.exec(html);

  const rawAction = formActionMatch?.[1] ?? `${SIGNIN_URL}?${signinParams}`;
  const formAction = rawAction.startsWith('http') ? rawAction : `${GARMIN_SSO_ORIGIN}${rawAction}`;
  const mfaFieldName = inputNameMatch?.[1] ?? 'mfaCode';

  console.log('[Garmin] MFA needed. formAction:', formAction, 'fieldName:', mfaFieldName);

  const sessionId = crypto.randomUUID();
  pendingSessions.set(sessionId, {
    client,
    formAction,
    csrfToken: mfaCsrfMatch?.[1] ?? csrf,
    mfaFieldName,
    createdAt: Date.now(),
  });

  return { needsMFA: true, sessionId };
}

export async function completeGarminMFA(
  sessionId: string,
  mfaCode: string
): Promise<{ oauth1Token: Record<string, unknown>; oauth2Token: Record<string, unknown> }> {
  const session = pendingSessions.get(sessionId);
  if (!session) throw new Error('Session expired. Please start the login again.');

  const { client, formAction, csrfToken, mfaFieldName } = session;

  console.log('[MFA] submitting to:', formAction, 'field:', mfaFieldName, 'code:', mfaCode);

  const res = await client.post(
    formAction,
    qs.stringify({ [mfaFieldName]: mfaCode.trim(), _csrf: csrfToken, embed: 'true' }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Origin': GARMIN_SSO_ORIGIN,
        'Referer': SIGNIN_URL,
        'User-Agent': USER_AGENT,
      },
      responseType: 'text',
      transformResponse: [(d) => d],
    }
  );

  console.log('[MFA] response status:', res.status);
  console.log('[MFA] response snippet:', String(res.data).slice(0, 600));

  const ticketMatch = TICKET_RE.exec(res.data);
  if (!ticketMatch) {
    throw new Error(`MFA failed (HTTP ${res.status}). The code may be wrong or expired — please try again.`);
  }

  pendingSessions.delete(sessionId);
  return completeOAuth(client, ticketMatch[1]);
}

async function completeOAuth(
  client: AxiosInstance,
  ticket: string
): Promise<{ oauth1Token: Record<string, unknown>; oauth2Token: Record<string, unknown> }> {
  const consumerRes = await axios.get(OAUTH_CONSUMER_URL);
  const { consumer_key, consumer_secret } = consumerRes.data;

  const oauth = new OAuth({
    consumer: { key: consumer_key, secret: consumer_secret },
    signature_method: 'HMAC-SHA1',
    hash_function: (base: string, key: string) =>
      crypto.createHmac('sha1', key).update(base).digest('base64'),
  });

  // OAuth1
  const o1Url = `${OAUTH_URL}/request_token`;
  const o1Data = { url: `${o1Url}?ticket=${ticket}&accepts-mfa-tokens=true`, method: 'POST', data: null };
  const o1Header = oauth.toHeader(oauth.authorize(o1Data));
  const o1Res = await client.post(
    `${o1Url}?ticket=${ticket}&accepts-mfa-tokens=true`,
    null,
    { headers: { ...o1Header, 'User-Agent': USER_AGENT_MOBILE } }
  );
  const o1 = qs.parse(o1Res.data);
  const oauth1Token = { oauth_token: o1.oauth_token as string, oauth_token_secret: o1.oauth_token_secret as string };

  // OAuth2
  const exUrl = `${OAUTH_URL}/exchange/user/2.0`;
  const exData = { url: exUrl, method: 'POST', data: null };
  const exParams = oauth.authorize(exData, { key: oauth1Token.oauth_token, secret: oauth1Token.oauth_token_secret });
  const exHeader = oauth.toHeader(exParams);
  const o2Res = await client.post(
    `${exUrl}?${qs.stringify(exParams)}`,
    null,
    { headers: { ...exHeader, 'User-Agent': USER_AGENT_MOBILE, 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  const now = Math.floor(Date.now() / 1000);
  return {
    oauth1Token: oauth1Token as Record<string, unknown>,
    oauth2Token: {
      ...o2Res.data,
      expires_at: now + (o2Res.data.expires_in ?? 3600),
      refresh_token_expires_at: now + (o2Res.data.refresh_token_expires_in ?? 7776000),
    },
  };
}
