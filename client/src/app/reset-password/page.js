"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, Input, Alert, CheckIcon, labelClass, inputClass, eyebrowClass } from "@/components/ui";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [otp, setOtp] = useState("");
  // Step 1: verify the code. Step 2: choose a new password. The
  // password fields are not shown (or submitted) until the code is
  // verified — that is the point of the two-step flow.
  const [step, setStep] = useState(1);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resending, setResending] = useState(false);

  async function handleVerifyCode(e) {
    e.preventDefault();
    setError("");
    setResendMessage("");

    if (!/^\d{6}$/.test(otp.trim())) {
      setError("Enter the 6-digit code from your email.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/verify-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otp.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Try again.");
        return;
      }

      // The code is verified but NOT consumed — the reset endpoint
      // verifies it again and marks it used with the password
      // change, so the security invariant does not change.
      setStep(2);
    } catch (err) {
      console.error("Verify code error:", err);
      setError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8 || password.length > 72) {
      setError("Password must be between 8 and 72 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otp.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Try again.");
        // A rejected code (expired, or used up by then) sends the
        // user back to step 1 to enter a fresh code.
        if (data.error === "Invalid or expired code") {
          setStep(1);
        }
        return;
      }

      setDone(true);
    } catch (err) {
      console.error("Reset password error:", err);
      setError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    setError("");
    setResendMessage("");
    if (!email.trim()) {
      setError("Enter your email first, then request a new code.");
      return;
    }
    setResending(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Try again.");
        return;
      }
      setResendMessage(
        "If an account exists for that email, a new 6-digit code has been sent."
      );
    } catch (err) {
      console.error("Resend code error:", err);
      setError("Something went wrong. Try again.");
    } finally {
      setResending(false);
    }
  }

  function handleBackToCode() {
    setError("");
    setPassword("");
    setConfirm("");
    setStep(1);
  }

  return (
    <>
      <main className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4 py-12">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-8 max-w-md w-full">
          <div className="mb-8">
            <p className={eyebrowClass}>
              Reset Password
            </p>
            <h1 className="text-3xl font-bold text-[var(--foreground)] mt-3">
              {done
                ? "Password reset"
                : step === 1
                  ? "Enter your code"
                  : "Choose a new password"}
            </h1>
            {!done && (
              <p className="text-sm text-[var(--foreground-muted)] mt-2">
                Step {step} of 2
              </p>
            )}
          </div>

          {done ? (
            <Alert tone="success">
              Your password has been reset.{" "}
              <Link
                href="/login"
                className="inline-flex items-center min-h-11 py-1 px-1 -mx-1 underline underline-offset-2 hover:text-[var(--accent)] transition"
              >
                Sign in with your new password
              </Link>
              .
            </Alert>
          ) : (
            <>
              {error && <Alert className="mb-4">{error}</Alert>}
              {resendMessage && (
                <Alert tone="success" className="mb-4">
                  {resendMessage}
                </Alert>
              )}

              {step === 1 ? (
                <>
                  <p className="text-sm text-[var(--foreground-muted)] mb-5">
                    Enter the 6-digit code we emailed you. The code works
                    for 10 minutes.
                  </p>

                  <form onSubmit={handleVerifyCode} className="space-y-5">
                    <div>
                      <label
                        htmlFor="email"
                        className={labelClass}
                      >
                        Email
                      </label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        className={inputClass}
                        placeholder="you@example.com"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="otp"
                        className={labelClass}
                      >
                        6-Digit Code
                      </label>
                      <Input
                        id="otp"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        value={otp}
                        onChange={(e) =>
                          setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                        }
                        required
                        minLength={6}
                        maxLength={6}
                        className={`${inputClass} tracking-[0.5em]`}
                        placeholder="123456"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={submitting}
                      className="w-full"
                    >
                      {submitting ? "Verifying..." : "Verify Code"}
                    </Button>
                  </form>
                </>
              ) : (
                <>
                  <Alert tone="success" className="mb-5 flex items-start gap-2">
                    <CheckIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                      Code verified — now choose a new password for{" "}
                      <span className="font-semibold">{email}</span>.
                    </span>
                  </Alert>

                  <form onSubmit={handleResetPassword} className="space-y-5">
                    <div>
                      <label
                        htmlFor="password"
                        className={labelClass}
                      >
                        New Password
                      </label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        minLength={8}
                        className={inputClass}
                        placeholder="At least 8 characters"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="confirm"
                        className={labelClass}
                      >
                        Confirm New Password
                      </label>
                      <Input
                        id="confirm"
                        type="password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        required
                        autoComplete="new-password"
                        minLength={8}
                        className={inputClass}
                        placeholder="Repeat your new password"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={submitting}
                      className="w-full"
                    >
                      {submitting ? "Resetting..." : "Reset Password"}
                    </Button>
                  </form>

                  <p className="mt-4 text-center">
                    <button
                      type="button"
                      onClick={handleBackToCode}
                      className="inline-flex items-center min-h-11 py-1 px-1 -mx-1 text-sm text-[var(--foreground-muted)] hover:text-[var(--accent)] dark:hover:text-[var(--foreground-muted)] underline underline-offset-2 decoration-[var(--accent)]/40 hover:decoration-[var(--accent)] transition"
                    >
                      ← Back to code
                    </button>
                  </p>
                </>
              )}
            </>
          )}

          {step === 1 && !done && (
            <div className="mt-6 pt-6 border-t border-[var(--border)] text-center">
              <p className="text-sm text-[var(--foreground-muted)]">
                Didn&apos;t get a code?{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="inline-flex items-center min-h-11 py-1 px-1 -mx-1 text-[var(--foreground)] dark:text-[var(--foreground-muted)] hover:text-[var(--accent)] dark:hover:text-[var(--foreground-muted)] underline underline-offset-2 decoration-[var(--accent)]/40 hover:decoration-[var(--accent)] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resending ? "Sending..." : "Resend code"}
                </button>
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
