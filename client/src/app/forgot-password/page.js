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
      <main className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4 py-12">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-8 max-w-md w-full">
          <div className="mb-8">
            <p className={eyebrowClass}>
              Reset Password
            </p>
            <h1 className="text-3xl font-bold text-[var(--foreground)] mt-3">
              Forgot password?
            </h1>
          </div>

          {sent ? (
            <Alert tone="success">
              If an account exists for that email, a 6-digit code has
              been sent. The code works for 10 minutes.{" "}
              <Link
                href={`/reset-password?email=${encodeURIComponent(email)}`}
                className="inline-flex items-center min-h-11 py-1 px-1 -mx-1 underline underline-offset-2 hover:text-[var(--accent)] transition"
              >
                Enter your code
              </Link>
              .
            </Alert>
          ) : (
            <>
              {error && <Alert className="mb-4">{error}</Alert>}

              <p className="text-sm text-[var(--foreground-muted)] mb-5">
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

          <div className="mt-6 pt-6 border-t border-[var(--border)] text-center">
            <p className="text-sm text-[var(--foreground-muted)]">
              Remembered your password?{" "}
              <Link
                href="/login"
                className="inline-flex items-center min-h-11 py-1 px-1 -mx-1 text-[var(--foreground)] dark:text-[var(--foreground-muted)] hover:text-[var(--accent)] dark:hover:text-[var(--foreground-muted)] underline underline-offset-2 decoration-[var(--accent)]/40 hover:decoration-[var(--accent)] transition"
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
