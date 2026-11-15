"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

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
      <main className="min-h-screen bg-amber-50 dark:bg-stone-900 flex items-center justify-center px-4 py-12">
        <div className="bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-sm p-8 max-w-md w-full">
          <div className="mb-8">
            <p className="font-serif italic text-xs uppercase tracking-[0.3em] text-stone-600 dark:text-stone-400 mb-2 border-b-2 border-amber-600 pb-1 inline-block">
              Reset Password
            </p>
            <h1 className="font-serif text-3xl font-bold text-stone-900 dark:text-stone-50 mt-3">
              {done
                ? "Password reset"
                : step === 1
                  ? "Enter your code"
                  : "Choose a new password"}
            </h1>
          </div>

          {done ? (
            <div className="bg-green-50 dark:bg-green-950 border border-green-300 dark:border-green-800 text-green-800 dark:text-green-200 text-sm p-3 rounded-sm">
              Your password has been reset.{" "}
              <Link
                href="/login"
                className="underline underline-offset-2 hover:text-amber-600 transition"
              >
                Sign in with your new password
              </Link>
              .
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-200 text-sm p-3 rounded-sm mb-4">
                  {error}
                </div>
              )}
              {resendMessage && (
                <div className="bg-green-50 dark:bg-green-950 border border-green-300 dark:border-green-800 text-green-800 dark:text-green-200 text-sm p-3 rounded-sm mb-4">
                  {resendMessage}
                </div>
              )}

              {step === 1 ? (
                <>
                  <p className="text-sm text-stone-600 dark:text-stone-400 mb-5">
                    Enter the 6-digit code we emailed you. The code works
                    for 10 minutes.
                  </p>

                  <form onSubmit={handleVerifyCode} className="space-y-5">
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-2"
                      >
                        Email
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        className="w-full px-4 py-3 text-base bg-amber-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-600 rounded-sm text-stone-900 dark:text-stone-50 focus:outline-none focus:border-slate-800 dark:focus:border-slate-500 transition"
                        placeholder="you@example.com"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="otp"
                        className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-2"
                      >
                        6-Digit Code
                      </label>
                      <input
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
                        className="w-full px-4 py-3 text-base tracking-[0.5em] bg-amber-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-600 rounded-sm text-stone-900 dark:text-stone-50 focus:outline-none focus:border-slate-800 dark:focus:border-slate-500 transition"
                        placeholder="123456"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full px-6 py-3 text-xs font-semibold uppercase tracking-wider text-stone-900 bg-amber-600 rounded-sm hover:bg-amber-500 shadow-md shadow-amber-600/30 hover:shadow-lg hover:shadow-amber-600/40 transition-all border border-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? "Verifying..." : "Verify Code"}
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <div className="bg-green-50 dark:bg-green-950 border border-green-300 dark:border-green-800 text-green-800 dark:text-green-200 text-sm p-3 rounded-sm mb-5">
                    Code verified ✓ — now choose a new password for{" "}
                    <span className="font-semibold">{email}</span>.
                  </div>

                  <form onSubmit={handleResetPassword} className="space-y-5">
                    <div>
                      <label
                        htmlFor="password"
                        className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-2"
                      >
                        New Password
                      </label>
                      <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        minLength={8}
                        className="w-full px-4 py-3 text-base bg-amber-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-600 rounded-sm text-stone-900 dark:text-stone-50 focus:outline-none focus:border-slate-800 dark:focus:border-slate-500 transition"
                        placeholder="At least 8 characters"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="confirm"
                        className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-2"
                      >
                        Confirm New Password
                      </label>
                      <input
                        id="confirm"
                        type="password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        required
                        autoComplete="new-password"
                        minLength={8}
                        className="w-full px-4 py-3 text-base bg-amber-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-600 rounded-sm text-stone-900 dark:text-stone-50 focus:outline-none focus:border-slate-800 dark:focus:border-slate-500 transition"
                        placeholder="Repeat your new password"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full px-6 py-3 text-xs font-semibold uppercase tracking-wider text-stone-900 bg-amber-600 rounded-sm hover:bg-amber-500 shadow-md shadow-amber-600/30 hover:shadow-lg hover:shadow-amber-600/40 transition-all border border-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? "Resetting..." : "Reset Password"}
                    </button>
                  </form>

                  <p className="mt-4 text-center">
                    <button
                      type="button"
                      onClick={handleBackToCode}
                      className="font-serif italic text-sm text-stone-600 dark:text-stone-400 hover:text-amber-600 dark:hover:text-amber-500 underline underline-offset-2 decoration-amber-600/40 hover:decoration-amber-600 transition"
                    >
                      ← Back to code
                    </button>
                  </p>
                </>
              )}
            </>
          )}

          {step === 1 && !done && (
            <div className="mt-6 pt-6 border-t border-stone-300 dark:border-stone-700 text-center">
              <p className="font-serif italic text-sm text-stone-600 dark:text-stone-400">
                Didn&apos;t get a code?{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="text-slate-800 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-500 underline underline-offset-2 decoration-amber-600/40 hover:decoration-amber-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
