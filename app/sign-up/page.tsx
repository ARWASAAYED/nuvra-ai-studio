'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { insforge } from '@/lib/insforge';
import { useAuth } from '@/lib/auth-context';
import { ThemeToggle } from '@/components/theme-toggle';
import { Eye, EyeOff, Mail, Lock, User, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';

export default function SignUpPage() {
  const router = useRouter();
  const { user, loading: authLoading, refreshUser } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  // OTP state for email verification
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  // Redirect if already signed in
  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, authLoading, router]);

  // Password strength
  const passwordStrength = (() => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  })();

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][passwordStrength];
  const strengthColor = ['', 'bg-destructive', 'bg-warning', 'bg-success/70', 'bg-success'][passwordStrength];

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setError('');

    const { data, error: err } = await insforge.auth.signUp({
      email,
      password,
      name: name || undefined,
      redirectTo: `${window.location.origin}/sign-in`,
    });

    if (err) {
      setError(err.message || 'Failed to create account. Please try again.');
      setLoading(false);
      return;
    }

    if (data?.requireEmailVerification) {
      setEmailSent(true);
    } else if (data) {
      router.replace('/dashboard');
    }
    setLoading(false);
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    setOauthLoading(provider);
    setError('');
    const { error: err } = await insforge.auth.signInWithOAuth(provider, {
      redirectTo: `${window.location.origin}/dashboard`,
      additionalParams: provider === 'google' ? { prompt: 'select_account' } : {},
    });
    if (err) {
      setError(err.message || `Failed to sign up with ${provider}.`);
      setOauthLoading(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-dvh auth-bg flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // Email verification sent state
  if (emailSent) {
    const handleVerifyOtp = async (e: React.FormEvent) => {
      e.preventDefault();
      const code = otp.trim();
      if (!code) return;
      setOtpLoading(true);
      setOtpError('');
      const { data, error: err } = await insforge.auth.verifyEmail({
        email,
        otp: code,
      });

      if (err) {
        setOtpError(err.message || 'Invalid or expired verification code. Please try again.');
        setOtpLoading(false);
        return;
      }

      if (data) {
        await refreshUser();
        router.replace('/dashboard');
      }
      setOtpLoading(false);
    };

    const handleResend = async () => {
      setResendStatus('Sending…');
      const { error: err } = await insforge.auth.resendVerificationEmail({
        email,
        redirectTo: `${window.location.origin}/sign-in`,
      });
      if (err) {
        setResendStatus(err.message || 'Failed to resend email');
      } else {
        setResendStatus('Verification email sent!');
        setTimeout(() => setResendStatus(null), 4000);
      }
    };

    return (
      <div className="min-h-dvh auth-bg flex flex-col">
        <header className="flex items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center shadow-sm">
              <Sparkles size={15} className="text-white" />
            </div>
            <span className="text-base font-bold tracking-tight text-foreground">Nuvra AI Studio</span>
          </Link>
          <ThemeToggle />
        </header>
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-[420px] animate-slide-up">
            <div className="card-premium p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
                <Mail size={30} className="text-primary" />
              </div>
              <h1 className="text-xl font-bold text-foreground mb-2">Verify your email</h1>
              <p className="text-sm text-muted-foreground mb-1">
                We sent a 6-digit code and verification link to
              </p>
              <p className="text-sm font-semibold text-foreground mb-6 break-all">{email}</p>

              {/* OTP Form */}
              <form onSubmit={handleVerifyOtp} className="space-y-4 text-left">
                <div className="space-y-1.5">
                  <label htmlFor="otp-input" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Enter 6-digit Code
                  </label>
                  <input
                    id="otp-input"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="input-base text-center tracking-widest text-xl font-mono h-12"
                    autoFocus
                  />
                </div>

                {otpError && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-destructive flex-shrink-0" />
                    <span>{otpError}</span>
                  </div>
                )}

                <button
                  id="verify-otp-btn"
                  type="submit"
                  disabled={otpLoading || otp.length < 6}
                  className="btn-primary w-full h-11"
                >
                  {otpLoading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Verifying…
                    </>
                  ) : (
                    'Verify & Continue'
                  )}
                </button>
              </form>

              {/* Link note */}
              <p className="text-xs text-muted-foreground mt-5 leading-relaxed">
                Or if you received a link, click the link in your email to verify automatically.
              </p>

              {/* Status / Resend */}
              <div className="mt-5 pt-5 border-t border-border flex items-center justify-between text-xs">
                <button
                  id="resend-email-btn"
                  type="button"
                  onClick={handleResend}
                  className="text-primary hover:underline font-medium"
                >
                  {resendStatus || 'Resend verification email'}
                </button>
                <Link
                  href="/sign-in"
                  id="back-to-sign-in"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Back to sign in
                </Link>
              </div>
            </div>
          </div>
        </main>
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
              <h1 className="text-2xl font-bold text-foreground mb-2">Create your account</h1>
              <p className="text-sm text-muted-foreground">
                Start building with Nuvra AI Studio for free
              </p>
            </div>

            {/* Error */}
            {error && (
              <div
                id="sign-up-error"
                className="mb-5 p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center"
              >
                {error}
              </div>
            )}

            {/* OAuth Buttons */}
            <div className="space-y-3 mb-6">
              <button
                id="google-sign-up"
                onClick={() => handleOAuth('google')}
                disabled={!!oauthLoading || loading}
                className="btn-outline w-full h-11"
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
                id="github-sign-up"
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
                <span className="bg-card px-3 text-muted-foreground">or sign up with email</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleEmailSignUp} className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label htmlFor="sign-up-name" className="text-sm font-medium text-foreground">
                  Full name <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    id="sign-up-name"
                    type="text"
                    autoComplete="name"
                    placeholder="Jane Smith"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-base pl-10"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="sign-up-email" className="text-sm font-medium text-foreground">
                  Email address
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    id="sign-up-email"
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
                <label htmlFor="sign-up-password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    id="sign-up-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Min. 6 characters"
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

                {/* Password strength bar */}
                {password.length > 0 && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            i <= passwordStrength ? strengthColor : 'bg-muted'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Password strength:{' '}
                      <span className={passwordStrength >= 3 ? 'text-success' : passwordStrength === 2 ? 'text-warning' : 'text-destructive'}>
                        {strengthLabel}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {/* Submit */}
              <button
                id="sign-up-submit"
                type="submit"
                disabled={loading || !!oauthLoading}
                className="btn-primary w-full h-11 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Creating account…
                  </>
                ) : (
                  'Create account'
                )}
              </button>
            </form>

            {/* ToS */}
            <p className="mt-4 text-center text-xs text-muted-foreground">
              By creating an account, you agree to our{' '}
              <Link href="/terms" className="text-primary hover:underline">Terms</Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
            </p>

            {/* Footer */}
            <p className="mt-5 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link
                href="/sign-in"
                id="go-to-sign-in"
                className="font-medium text-primary hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
