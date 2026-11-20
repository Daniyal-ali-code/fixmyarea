"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "./AuthProvider";

// Slim top app bar — navigation lives in the bottom tab bar now.
export default function Header() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-40 isolate bg-[var(--background)] border-b border-[var(--border)] pt-[env(safe-area-inset-top)]">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="text-xl font-bold text-[var(--foreground)] tracking-tight flex-shrink-0 inline-flex items-center min-h-11"
        >
          FixMyArea
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          {loading ? (
            <div className="h-9 w-24 bg-[var(--border)] rounded-lg animate-pulse" />
          ) : user ? (
            <>
              <span className="text-sm text-[var(--foreground)] hidden sm:inline">
                {user.name}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 min-h-11 text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] bg-[var(--surface)] rounded-lg hover:bg-[var(--accent-soft)] dark:hover:bg-[var(--accent-soft)] transition border border-[var(--border)]"
              >
                Logout
              </button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
