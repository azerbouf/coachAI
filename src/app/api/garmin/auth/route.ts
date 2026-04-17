import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { startGarminLogin, completeGarminMFA } from '@/lib/garmin/mfa-auth';
import { encryptGarminPassword } from '@/lib/garmin/sync';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();

    // Phase 2: MFA code + sessionId
    if (body.mfaCode && body.sessionId) {
      const { oauth1Token, oauth2Token } = await completeGarminMFA(body.sessionId, body.mfaCode);

      const [enc1, enc2] = await Promise.all([
        encryptGarminPassword(JSON.stringify(oauth1Token)),
        encryptGarminPassword(JSON.stringify(oauth2Token)),
      ]);

      const expiresAt = typeof oauth2Token.expires_at === 'number'
        ? new Date(oauth2Token.expires_at * 1000).toISOString()
        : null;

      await supabase.from('profiles').update({
        garmin_oauth1_token_encrypted: enc1,
        garmin_oauth2_token_encrypted: enc2,
        garmin_token_expires_at: expiresAt,
        garmin_sync_enabled: true,
      }).eq('id', user.id);

      return NextResponse.json({ success: true, message: 'Garmin connected!' });
    }

    // Phase 1: start login
    const { email, password } = body;
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const result = await startGarminLogin(email, password);

    if (!result.needsMFA) {
      const [enc1, enc2] = await Promise.all([
        encryptGarminPassword(JSON.stringify(result.oauth1Token)),
        encryptGarminPassword(JSON.stringify(result.oauth2Token)),
      ]);
      const expiresAt = typeof result.oauth2Token.expires_at === 'number'
        ? new Date(result.oauth2Token.expires_at * 1000).toISOString()
        : null;

      await supabase.from('profiles').update({
        garmin_email: email,
        garmin_credentials_encrypted: await encryptGarminPassword(password),
        garmin_oauth1_token_encrypted: enc1,
        garmin_oauth2_token_encrypted: enc2,
        garmin_token_expires_at: expiresAt,
        garmin_sync_enabled: true,
      }).eq('id', user.id);

      return NextResponse.json({ success: true, message: 'Garmin connected!' });
    }

    await supabase.from('profiles').update({ garmin_email: email }).eq('id', user.id);
    return NextResponse.json({ needsMFA: true, sessionId: result.sessionId });

  } catch (error) {
    console.error('Garmin auth error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Authentication failed' },
      { status: 500 }
    );
  }
}
