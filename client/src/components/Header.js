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
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-300 dark:border-zinc-800 pt-[env(safe-area-inset-top)]">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="text-xl font-bold text-slate-900 dark:text-slate-50 tracking-tight flex-shrink-0 inline-flex items-center min-h-11"
        >
          FixMyArea
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          {loading ? (
            <div className="h-9 w-24 bg-slate-200 dark:bg-zinc-700 rounded-lg animate-pulse" />
          ) : user ? (
            <>
              <span className="text-sm text-slate-700 dark:text-slate-300 hidden sm:inline">
                {user.name}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 min-h-11 text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-100 bg-white dark:bg-zinc-900 rounded-lg hover:bg-indigo-50 dark:hover:bg-zinc-800 transition border border-slate-200 dark:border-zinc-700"
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
