"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { Button, Input, Alert, labelClass, inputClass, eyebrowClass } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
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
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      login(data.user);

      // Role-based landing
      if (data.user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch (err) {
      console.error("Login error:", err);
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
              Welcome Back
            </p>
            <h1 className="text-3xl font-bold text-[var(--foreground)] mt-3">
              Sign in
            </h1>
          </div>

          {error && <Alert className="mb-4">{error}</Alert>}

          <form onSubmit={handleSubmit} className="space-y-5">
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
                htmlFor="password"
                className={labelClass}
              >
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className={inputClass}
                placeholder="••••••••"
              />
            </div>

            <div className="text-right">
              <Link
                href="/forgot-password"
                className="inline-flex items-center min-h-11 py-1 px-1 -mx-1 text-sm text-[var(--foreground-muted)] hover:text-[var(--accent)] dark:hover:text-[var(--foreground-muted)] underline underline-offset-2 decoration-[var(--accent)]/40 hover:decoration-[var(--accent)] transition"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full"
            >
              {submitting ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-[var(--border)] text-center">
            <p className="text-sm text-[var(--foreground-muted)]">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="inline-flex items-center min-h-11 py-1 px-1 -mx-1 text-[var(--foreground)] dark:text-[var(--foreground-muted)] hover:text-[var(--accent)] dark:hover:text-[var(--foreground-muted)] underline underline-offset-2 decoration-[var(--accent)]/40 hover:decoration-[var(--accent)] transition"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
