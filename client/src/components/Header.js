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
    <header className="sticky top-0 z-40 bg-amber-50 dark:bg-stone-900 border-b border-stone-400 dark:border-stone-700">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="font-serif text-xl font-bold text-stone-900 dark:text-stone-50 tracking-tight flex-shrink-0"
        >
          FixMyArea
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          {loading ? (
            <div className="h-9 w-24 bg-stone-200 dark:bg-stone-700 rounded-sm animate-pulse" />
          ) : user ? (
            <>
              <span className="font-serif italic text-sm text-stone-700 dark:text-stone-300 hidden sm:inline">
                {user.name}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-stone-900 dark:text-stone-100 bg-amber-50 dark:bg-stone-800 rounded-sm hover:bg-amber-100 dark:hover:bg-stone-700 transition border border-stone-400 dark:border-stone-600"
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
