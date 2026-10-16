'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { insforge } from '@/lib/insforge';
import { ThemeToggle } from '@/components/theme-toggle';
import { Mail, Lock, Eye, EyeOff, Loader2, Sparkles, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Query parameters from magic link redirect
  const tokenParam = searchParams.get('token');
  const statusParam = searchParams.get('insforge_status');
  const typeParam = searchParams.get('insforge_type');
  const errorParam = searchParams.get('insforge_error');

  // Flow states
  const isLinkReady = statusParam === 'ready' && typeParam === 'reset_password' && !!tokenParam;
  const isLinkError = statusParam === 'error' && typeParam === 'reset_password';

  // Request Reset form state
  const [email, setEmail] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  // New password state (for magic link or code flow)
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // Code method state
  const [code, setCode] = useState('');
  const [useCodeFlow, setUseCodeFlow] = useState(false);

  // Password strength
  const passwordStrength = (() => {
    if (!newPassword) return 0;
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;
    return score;
  })();
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][passwordStrength];
  const strengthColor = ['', 'bg-destructive', 'bg-warning', 'bg-success/70', 'bg-success'][passwordStrength];

  // Request reset email
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setRequestLoading(true);
    setRequestError('');

    const { error: err } = await insforge.auth.sendResetPasswordEmail({
      email: email.trim(),
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (err) {
      setRequestError(err.message || 'Failed to send reset email. Please try again.');
      setRequestLoading(false);
      return;
    }

    setRequestSent(true);
    setRequestLoading(false);
  };

  // Resend email
  const handleResend = async () => {
    if (!email.trim()) return;
    setResendStatus('Sending…');
    const { error: err } = await insforge.auth.sendResetPasswordEmail({
      email: email.trim(),
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (err) {
      setResendStatus(err.message || 'Failed to resend email');
    } else {
      setResendStatus('Reset email sent!');
      setTimeout(() => setResendStatus(null), 4000);
    }
  };

  // Reset password using magic link token
  const handleLinkReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenParam) return;
    if (newPassword.length < 6) {
      setResetError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match.');
      return;
    }

    setResetLoading(true);
    setResetError('');

    const { error: err } = await insforge.auth.resetPassword({
      newPassword,
      otp: tokenParam,
    });

    if (err) {
      setResetError(err.message || 'Failed to reset password. The link may have expired.');
      setResetLoading(false);
      return;
    }

    setResetSuccess(true);
    setResetLoading(false);
  };

  // Reset password using 6-digit code
  const handleCodeReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim();
    if (!cleanCode) {
      setResetError('Please enter the 6-digit verification code.');
      return;
    }
    if (newPassword.length < 6) {
      setResetError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match.');
      return;
    }

    setResetLoading(true);
    setResetError('');

    // Step 1: Exchange code for reset token
    const { data: exchangeData, error: exchangeErr } = await insforge.auth.exchangeResetPasswordToken({
      email: email.trim(),
      code: cleanCode,
    });

    if (exchangeErr || !exchangeData?.token) {
      setResetError(exchangeErr?.message || 'Invalid or expired reset code.');
      setResetLoading(false);
      return;
    }

    // Step 2: Reset password using exchanged token
    const { error: resetErr } = await insforge.auth.resetPassword({
      newPassword,
      otp: exchangeData.token,
    });

    if (resetErr) {
      setResetError(resetErr.message || 'Failed to set new password.');
      setResetLoading(false);
      return;
    }

    setResetSuccess(true);
    setResetLoading(false);
  };

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

      {/* Main card */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[420px] animate-slide-up">
          <div className="card-premium p-8">

            {/* Case 1: Password reset was successful */}
            {resetSuccess ? (
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-5">
                  <CheckCircle2 size={32} className="text-success" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">Password reset!</h1>
                <p className="text-sm text-muted-foreground mb-6">
                  Your password has been successfully updated. You can now sign in with your new credentials.
                </p>
                <Link
                  href="/sign-in"
                  id="go-to-sign-in"
                  className="btn-primary w-full h-11"
                >
                  Sign in
                </Link>
              </div>

            /* Case 2: Link error */
            ) : isLinkError ? (
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-5">
                  <AlertCircle size={32} className="text-destructive" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">Invalid or expired link</h1>
                <p className="text-sm text-muted-foreground mb-6">
                  {errorParam || 'This password reset link is invalid or has expired. Please request a new one.'}
                </p>
                <button
                  onClick={() => router.replace('/reset-password')}
                  className="btn-primary w-full h-11"
                >
                  Request new reset link
                </button>
                <div className="mt-4">
                  <Link href="/sign-in" className="text-xs text-muted-foreground hover:text-foreground">
                    Back to sign in
                  </Link>
                </div>
              </div>

            /* Case 3: Link is ready to reset (Magic link flow) */
            ) : isLinkReady ? (
              <div>
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold text-foreground mb-2">Set new password</h1>
                  <p className="text-sm text-muted-foreground">Enter a secure new password for your account</p>
                </div>

                {resetError && (
                  <div className="mb-6 p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-destructive flex-shrink-0" />
                    <span>{resetError}</span>
                  </div>
                )}

                <form onSubmit={handleLinkReset} className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="new-password" className="text-sm font-medium text-foreground">
                      New password
                    </label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      <input
                        id="new-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        className="input-base pl-10 pr-10"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>

                    {/* Strength meter */}
                    {newPassword && (
                      <div className="pt-1.5 space-y-1">
                        <div className="flex gap-1 h-1">
                          {[1, 2, 3, 4].map((level) => (
                            <div
                              key={level}
                              className={`flex-1 rounded-full transition-all duration-300 ${
                                level <= passwordStrength ? strengthColor : 'bg-muted'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">{strengthLabel} password</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="confirm-password" className="text-sm font-medium text-foreground">
                      Confirm new password
                    </label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      <input
                        id="confirm-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="input-base pl-10 pr-10"
                      />
                    </div>
                  </div>

                  <button
                    id="set-new-password-btn"
                    type="submit"
                    disabled={resetLoading || !newPassword || !confirmPassword}
                    className="btn-primary w-full h-11 mt-2"
                  >
                    {resetLoading ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        Updating password…
                      </>
                    ) : (
                      'Update password'
                    )}
                  </button>
                </form>
              </div>

            /* Case 4: Reset request has been sent */
            ) : requestSent ? (
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
                  <Mail size={30} className="text-primary" />
                </div>
                <h1 className="text-xl font-bold text-foreground mb-2">Check your email</h1>
                <p className="text-sm text-muted-foreground mb-1">
                  We sent password reset instructions to
                </p>
                <p className="text-sm font-semibold text-foreground mb-6 break-all">{email}</p>

                {/* If code flow is selected */}
                {useCodeFlow ? (
                  <form onSubmit={handleCodeReset} className="space-y-4 text-left mb-6">
                    <div className="space-y-1.5">
                      <label htmlFor="reset-code" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        6-Digit Reset Code
                      </label>
                      <input
                        id="reset-code"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        placeholder="123456"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="input-base text-center tracking-widest text-xl font-mono h-11"
                        autoFocus
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="code-new-password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        New Password
                      </label>
                      <input
                        id="code-new-password"
                        type="password"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        className="input-base"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="code-confirm-password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Confirm New Password
                      </label>
                      <input
                        id="code-confirm-password"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="input-base"
                      />
                    </div>

                    {resetError && (
                      <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                        {resetError}
                      </div>
                    )}

                    <button
                      id="submit-code-reset"
                      type="submit"
                      disabled={resetLoading || code.length < 6 || !newPassword}
                      className="btn-primary w-full h-11"
                    >
                      {resetLoading ? (
                        <>
                          <Loader2 size={15} className="animate-spin" />
                          Verifying & Updating…
                        </>
                      ) : (
                        'Reset Password'
                      )}
                    </button>
                  </form>
                ) : (
                  <div className="mb-6">
                    <p className="text-xs text-muted-foreground mb-4">
                      Click the link in the email to set a new password.
                    </p>
                    <button
                      type="button"
                      onClick={() => setUseCodeFlow(true)}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Have a 6-digit code instead? Enter code →
                    </button>
                  </div>
                )}

                {/* Resend and back links */}
                <div className="pt-4 border-t border-border flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={handleResend}
                    className="text-primary hover:underline font-medium"
                  >
                    {resendStatus || 'Resend email'}
                  </button>
                  <Link href="/sign-in" className="text-muted-foreground hover:text-foreground">
                    Back to sign in
                  </Link>
                </div>
              </div>

            /* Case 5: Standard request reset form */
            ) : (
              <div>
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold text-foreground mb-2">Reset password</h1>
                  <p className="text-sm text-muted-foreground">
                    Enter your email address and we&apos;ll send you instructions to reset your password.
                  </p>
                </div>

                {requestError && (
                  <div className="mb-6 p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-destructive flex-shrink-0" />
                    <span>{requestError}</span>
                  </div>
                )}

                <form onSubmit={handleRequestReset} className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="reset-email" className="text-sm font-medium text-foreground">
                      Email address
                    </label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      <input
                        id="reset-email"
                        type="email"
                        autoComplete="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="input-base pl-10"
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    id="send-reset-btn"
                    type="submit"
                    disabled={requestLoading || !email}
                    className="btn-primary w-full h-11 mt-2"
                  >
                    {requestLoading ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        Sending instructions…
                      </>
                    ) : (
                      'Send reset instructions'
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <Link
                    href="/sign-in"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft size={14} />
                    Back to sign in
                  </Link>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh auth-bg flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
