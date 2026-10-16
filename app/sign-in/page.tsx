'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { insforge } from '@/lib/insforge';
import { useAuth } from '@/lib/auth-context';
import { ThemeToggle } from '@/components/theme-toggle';
import { Eye, EyeOff, Mail, Lock, Loader2, Sparkles } from 'lucide-react';


// X/Twitter SVG icon
function XIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, refreshUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Handle OAuth callback + email verification redirects
  useEffect(() => {
    const status = searchParams.get('insforge_status');
    const type = searchParams.get('insforge_type');
    const errMsg = searchParams.get('insforge_error');

    if (status === 'success' && type === 'verify_email') {
      setSuccessMessage('Email verified! Please sign in.');
    } else if (status === 'error' && errMsg) {
      setError(errMsg);
    }
  }, [searchParams]);

  // Redirect if already signed in
  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError('');

    const { data, error: err } = await insforge.auth.signInWithPassword({ email, password });

    if (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
      setLoading(false);
      return;
    }

    if (data) {
      await refreshUser();
      router.replace('/dashboard');
    }
    setLoading(false);
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    setOauthLoading(provider);
    setError('');
    const redirectTo = `${window.location.origin}/dashboard`;
    const { error: err } = await insforge.auth.signInWithOAuth(provider, {
      redirectTo,
      additionalParams: provider === 'google' ? { prompt: 'select_account' } : {},
    });
    if (err) {
      setError(err.message || `Failed to sign in with ${provider}.`);
      setOauthLoading(null);
    }
    // If no error, browser redirects automatically
  };

  if (authLoading) {
    return (
      <div className="min-h-dvh auth-bg flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh auth-bg flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center shadow-sm">
            <Sparkles size={15} className="text-white" />
          </div>
          <span className="text-base font-bold tracking-tight text-foreground">Nuvra AI Studio</span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[420px] animate-slide-up">
          <div className="card-premium p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-foreground mb-2">Welcome back</h1>
              <p className="text-sm text-muted-foreground">
                Sign in to your Nuvra AI Studio account
              </p>
            </div>

            {/* Success message */}
            {successMessage && (
              <div
                id="success-message"
                className="mb-5 p-3.5 rounded-lg bg-success/10 border border-success/20 text-success text-sm text-center"
              >
                {successMessage}
              </div>
            )}

            {/* Error message */}
            {error && (
              <div
                id="sign-in-error"
                className="mb-5 p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center"
              >
                {error}
              </div>
            )}

            {/* OAuth Buttons */}
            <div className="space-y-3 mb-6">
              <button
                id="google-sign-in"
                onClick={() => handleOAuth('google')}
                disabled={!!oauthLoading || loading}
                className="btn-outline w-full h-11 relative"
              >
                {oauthLoading === 'google' ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                Continue with Google
              </button>

              <button
                id="github-sign-in"
                onClick={() => handleOAuth('github')}
                disabled={!!oauthLoading || loading}
                className="btn-outline w-full h-11"
              >
                {oauthLoading === 'github' ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-foreground">
                    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                )}
                Continue with GitHub
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-3 text-muted-foreground">or continue with email</span>
              </div>
            </div>

            {/* Email/Password form */}
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="sign-in-email" className="text-sm font-medium text-foreground">
                  Email address
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    id="sign-in-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="input-base pl-10"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="sign-in-password" className="text-sm font-medium text-foreground">
                    Password
                  </label>
                  <Link
                    href="/reset-password"
                    className="text-xs text-primary hover:underline"
                    id="forgot-password-link"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    id="sign-in-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="input-base pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                id="sign-in-submit"
                type="submit"
                disabled={loading || !!oauthLoading}
                className="btn-primary w-full h-11 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Signing in…
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            {/* Footer */}
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link
                href="/sign-up"
                id="go-to-sign-up"
                className="font-medium text-primary hover:underline"
              >
                Create one
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh auth-bg flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}

