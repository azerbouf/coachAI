'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, CheckCircle, AlertCircle, Settings, Zap, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type AuthStep = 'credentials' | 'mfa' | 'connected';

export default function SettingsPage() {
  const [garminEmail, setGarminEmail] = useState('');
  const [garminPassword, setGarminPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [step, setStep] = useState<AuthStep>('credentials');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [profileEmail, setProfileEmail] = useState('');

  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setProfileEmail(user.email ?? '');

      const { data: profile } = await supabase
        .from('profiles')
        .select('garmin_email, garmin_oauth2_token_encrypted')
        .eq('id', user.id)
        .single();

      if (profile?.garmin_email) {
        setGarminEmail(profile.garmin_email);
        if (profile.garmin_oauth2_token_encrypted) {
          setStep('connected');
        }
      }
    }
    loadProfile();
  }, []);

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    const res = await fetch('/api/garmin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: garminEmail, password: garminPassword }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setStatus({ type: 'error', message: data.error ?? 'Connection failed' });
      return;
    }

    if (data.needsMFA) {
      setSessionId(data.sessionId);
      setStep('mfa');
      setStatus({ type: 'success', message: 'Check your email — Garmin sent you a verification code.' });
    } else {
      setStep('connected');
      setStatus({ type: 'success', message: data.message ?? 'Garmin connected!' });
      setGarminPassword('');
    }
  }

  async function handleMFASubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    const res = await fetch('/api/garmin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mfaCode, sessionId }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setStatus({ type: 'error', message: data.error ?? 'Invalid code' });
    } else {
      setStep('connected');
      setSessionId(null);
      setMfaCode('');
      setGarminPassword('');
      setStatus({ type: 'success', message: '✓ Garmin connected! Future syncs will be automatic.' });
    }
  }

  async function handleTestSync() {
    setLoading(true);
    setStatus(null);

    const res = await fetch('/api/garmin/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullSync: false }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setStatus({ type: 'error', message: data.error ?? 'Sync failed' });
    } else {
      setStatus({
        type: 'success',
        message: `Sync successful! ${data.activitiesSynced} activities synced.`,
      });
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center">
          <Settings className="w-5 h-5 text-text-secondary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Settings</h1>
          <p className="text-sm text-text-muted">Manage your account and integrations</p>
        </div>
      </div>

      {/* Account info */}
      <div className="card mb-6">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Account</h2>
        <p className="text-text-primary text-sm">{profileEmail}</p>
      </div>

      {/* Garmin connection */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className={cn(
            'w-9 h-9 rounded-lg flex items-center justify-center',
            step === 'connected'
              ? 'bg-green-500/10 border border-green-500/20'
              : 'bg-blue-500/10 border border-blue-500/20'
          )}>
            {step === 'connected'
              ? <ShieldCheck className="w-4 h-4 text-green-400" />
              : <Zap className="w-4 h-4 text-blue-400" />
            }
          </div>
          <div>
            <h2 className="text-base font-semibold text-text-primary">Garmin Connect</h2>
            <p className="text-xs text-text-muted">
              {step === 'connected'
                ? <span className="text-green-400 flex items-center gap-1"><CheckCircle className="w-3 h-3 inline" /> Connected — {garminEmail}</span>
                : step === 'mfa'
                ? 'Enter the verification code from your email'
                : 'Enter your Garmin Connect credentials'
              }
            </p>
          </div>
        </div>

        {/* Step: Credentials */}
        {step === 'credentials' && (
          <form onSubmit={handleConnect} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Garmin Email</label>
              <Input type="email" value={garminEmail} onChange={e => setGarminEmail(e.target.value)}
                placeholder="your@garmin.com" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Garmin Password</label>
              <Input type="password" value={garminPassword} onChange={e => setGarminPassword(e.target.value)}
                placeholder="••••••••" required />
            </div>
            {status && <StatusMessage status={status} />}
            <Button
              type="submit"
              disabled={loading || !garminEmail || !garminPassword}
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Connecting...</> : 'Connect Garmin'}
            </Button>
          </form>
        )}

        {/* Step: MFA code */}
        {step === 'mfa' && (
          <form onSubmit={handleMFASubmit} className="space-y-4">
            {status && <StatusMessage status={status} />}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Verification Code
              </label>
              <Input
                type="text"
                value={mfaCode}
                onChange={e => setMfaCode(e.target.value)}
                placeholder="Enter 6-digit code"
                required
                maxLength={8}
                autoFocus
                className="text-center text-2xl tracking-[0.5em] font-mono"
              />
              <p className="text-xs text-text-muted mt-1">
                Check the email address associated with your Garmin account.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={loading || mfaCode.length < 4}
                >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</> : 'Verify & Connect'}
              </Button>
              <Button type="button" variant="outline" onClick={() => { setStep('credentials'); setStatus(null); }}>
                Back
              </Button>
            </div>
          </form>
        )}

        {/* Step: Connected */}
        {step === 'connected' && (
          <div className="space-y-4">
            {status && <StatusMessage status={status} />}
            <p className="text-sm text-text-secondary">
              Your Garmin account is connected. OAuth tokens are stored securely — no password needed for future syncs.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={handleTestSync}
                disabled={loading}
                >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Syncing...</> : 'Sync Now'}
              </Button>
              <Button variant="outline" onClick={() => { setStep('credentials'); setStatus(null); setGarminPassword(''); }}>
                Reconnect
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusMessage({ status }: { status: { type: 'success' | 'error'; message: string } }) {
  return (
    <div className={cn(
      'flex items-start gap-2 p-3 rounded-lg text-sm',
      status.type === 'success'
        ? 'bg-green-500/10 border border-green-500/20 text-green-400'
        : 'bg-red-500/10 border border-red-500/20 text-red-400'
    )}>
      {status.type === 'success'
        ? <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
      <span>{status.message}</span>
    </div>
  );
}
