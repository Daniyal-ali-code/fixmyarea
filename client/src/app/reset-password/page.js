"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(
    token ? "" : "This reset link is invalid or incomplete. Request a new one from the forgot password page."
  );
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
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
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Try again.");
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

  return (
    <>
      <main className="min-h-screen bg-amber-50 dark:bg-stone-900 flex items-center justify-center px-4 py-12">
        <div className="bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-sm p-8 max-w-md w-full">
          <div className="mb-8">
            <p className="font-serif italic text-xs uppercase tracking-[0.3em] text-stone-600 dark:text-stone-400 mb-2 border-b-2 border-amber-600 pb-1 inline-block">
              Reset Password
            </p>
            <h1 className="font-serif text-3xl font-bold text-stone-900 dark:text-stone-50 mt-3">
              Choose a new password
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

              <form onSubmit={handleSubmit} className="space-y-5">
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
                  disabled={submitting || !token}
                  className="w-full px-6 py-3 text-xs font-semibold uppercase tracking-wider text-stone-900 bg-amber-600 rounded-sm hover:bg-amber-500 shadow-md shadow-amber-600/30 hover:shadow-lg hover:shadow-amber-600/40 transition-all border border-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Resetting..." : "Reset Password"}
                </button>
              </form>
            </>
          )}

          <div className="mt-6 pt-6 border-t border-stone-300 dark:border-stone-700 text-center">
            <p className="font-serif italic text-sm text-stone-600 dark:text-stone-400">
              Link expired?{" "}
              <Link
                href="/forgot-password"
                className="text-slate-800 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-500 underline underline-offset-2 decoration-amber-600/40 hover:decoration-amber-600 transition"
              >
                Request a new one
              </Link>
            </p>
          </div>
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
