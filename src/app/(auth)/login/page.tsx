'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Eye, EyeOff, Loader2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') ?? '/dashboard';

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const supabase = createClient();

  async function handleGoogleSignIn() {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirectTo=${redirectTo}`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        setMessage('Account created! Check your email to confirm, or sign in directly if email confirmation is disabled.');
      }
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      {/* Background gradient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #a78bfa 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #60a5fa 0%, transparent 70%)' }}
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-surface border border-border mb-4">
            <Zap className="w-7 h-7 text-accent-purple" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">CoachAI</h1>
          <p className="text-text-secondary mt-1 text-sm">
            Your AI-powered marathon coach
          </p>
        </div>

        {/* Form card */}
        <div className="card">
          {/* Mode toggle */}
          <div className="flex rounded-lg bg-background border border-border p-1 mb-6">
            <button
              type="button"
              onClick={() => { setMode('signin'); setError(null); setMessage(null); }}
              className={cn(
                'flex-1 py-2 text-sm font-medium rounded-md transition-colors',
                mode === 'signin'
                  ? 'bg-surface text-text-primary shadow-sm'
                  : 'text-text-muted hover:text-text-secondary'
              )}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(null); setMessage(null); }}
              className={cn(
                'flex-1 py-2 text-sm font-medium rounded-md transition-colors',
                mode === 'signup'
                  ? 'bg-surface text-text-primary shadow-sm'
                  : 'text-text-muted hover:text-text-secondary'
              )}
            >
              Create account
            </button>
          </div>

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg border border-border bg-surface hover:bg-surface/80 text-text-primary text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs text-text-muted">
              <span className="bg-surface px-2">or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="input"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  className="input pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {mode === 'signup' && (
                <p className="text-xs text-text-muted mt-1">Minimum 6 characters</p>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                <span className="flex-shrink-0 mt-0.5">⚠</span>
                <span>{error}</span>
              </div>
            )}

            {message && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-green-400">
                <span className="flex-shrink-0 mt-0.5">✓</span>
                <span>{message}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className={cn(
                'btn btn-primary w-full',
                (loading || !email || !password) && 'opacity-50 cursor-not-allowed'
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {mode === 'signup' ? 'Creating account...' : 'Signing in...'}
                </>
              ) : (
                mode === 'signup' ? 'Create account' : 'Sign in'
              )}
            </button>
          </form>
        </div>

        {/* Feature highlights */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { icon: '🏃', label: 'Garmin Sync' },
            { icon: '🤖', label: 'AI Coaching' },
            { icon: '📊', label: 'Analytics' },
          ].map((feature) => (
            <div key={feature.label} className="text-center p-3 rounded-xl bg-surface border border-border">
              <div className="text-xl mb-1">{feature.icon}</div>
              <div className="text-xs text-text-muted font-medium">{feature.label}</div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-text-muted mt-6">
          Personal running coach powered by Claude AI + Garmin data
        </p>
      </div>
    </div>
  );
}
