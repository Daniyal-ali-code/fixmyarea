"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.push(user.role === "admin" ? "/admin" : "/");
    }
  }, [loading, user, router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

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

      setSent(true);
    } catch (err) {
      console.error("Forgot password error:", err);
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
              Forgot password?
            </h1>
          </div>

          {sent ? (
            <div className="bg-green-50 dark:bg-green-950 border border-green-300 dark:border-green-800 text-green-800 dark:text-green-200 text-sm p-3 rounded-sm">
              If an account exists for that email, a 6-digit code has
              been sent. The code works for 10 minutes.{" "}
              <Link
                href={`/reset-password?email=${encodeURIComponent(email)}`}
                className="underline underline-offset-2 hover:text-amber-600 transition"
              >
                Enter your code
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

              <p className="text-sm text-stone-600 dark:text-stone-400 mb-5">
                Enter the email you signed up with and we will send you a
                6-digit code to reset your password.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
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

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full px-6 py-3 text-xs font-semibold uppercase tracking-wider text-stone-900 bg-amber-600 rounded-sm hover:bg-amber-500 shadow-md shadow-amber-600/30 hover:shadow-lg hover:shadow-amber-600/40 transition-all border border-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Sending..." : "Send Reset Code"}
                </button>
              </form>
            </>
          )}

          <div className="mt-6 pt-6 border-t border-stone-300 dark:border-stone-700 text-center">
            <p className="font-serif italic text-sm text-stone-600 dark:text-stone-400">
              Remembered your password?{" "}
              <Link
                href="/login"
                className="text-slate-800 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-500 underline underline-offset-2 decoration-amber-600/40 hover:decoration-amber-600 transition"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
