"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { Button, Input, Alert, labelClass, inputClass, eyebrowClass } from "@/components/ui";

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
            <p className={eyebrowClass}>
              Reset Password
            </p>
            <h1 className="font-serif text-3xl font-bold text-stone-900 dark:text-stone-50 mt-3">
              Forgot password?
            </h1>
          </div>

          {sent ? (
            <Alert tone="success">
              If an account exists for that email, a 6-digit code has
              been sent. The code works for 10 minutes.{" "}
              <Link
                href={`/reset-password?email=${encodeURIComponent(email)}`}
                className="underline underline-offset-2 hover:text-amber-600 transition"
              >
                Enter your code
              </Link>
              .
            </Alert>
          ) : (
            <>
              {error && <Alert className="mb-4">{error}</Alert>}

              <p className="text-sm text-stone-600 dark:text-stone-400 mb-5">
                Enter the email you signed up with and we will send you a
                6-digit code to reset your password.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className={labelClass}
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
                    className={inputClass}
                    placeholder="you@example.com"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full"
                >
                  {submitting ? "Sending..." : "Send Reset Code"}
                </Button>
              </form>
            </>
          )}

          <div className="mt-6 pt-6 border-t border-stone-300 dark:border-stone-700 text-center">
            <p className="font-serif italic text-sm text-stone-600 dark:text-stone-400">
              Remembered your password?{" "}
              <Link
                href="/login"
                className="text-stone-800 dark:text-stone-300 hover:text-amber-600 dark:hover:text-amber-500 underline underline-offset-2 decoration-amber-600/40 hover:decoration-amber-600 transition"
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
