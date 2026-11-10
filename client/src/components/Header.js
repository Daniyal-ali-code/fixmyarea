"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "./AuthProvider";

function NavLink({ href, children, emphasize }) {
  return (
    <Link
      href={href}
      className={
        emphasize
          ? "px-4 py-2 text-xs font-semibold uppercase tracking-wider text-stone-900 bg-amber-600 rounded-sm hover:bg-amber-500 transition border border-amber-700"
          : "font-serif italic text-sm text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:underline hover:decoration-amber-600 hover:decoration-2 hover:underline-offset-4 transition"
      }
    >
      {children}
    </Link>
  );
}

export default function Header() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <header className="bg-amber-50 dark:bg-stone-900 border-b border-stone-400 dark:border-stone-700">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-50 tracking-tight flex-shrink-0"
        >
          FixMyArea
        </Link>

        <nav className="flex items-center gap-3 flex-wrap justify-end">
          <ThemeToggle />

          {loading ? (
            <div className="h-9 w-24 bg-stone-200 dark:bg-stone-700 rounded-sm animate-pulse" />
          ) : user ? (
            <>
              {/* Role-specific links */}
              {user.role === "admin" ? (
                <>
                  <NavLink href="/admin" emphasize>
                    Admin
                  </NavLink>
                  <NavLink href="/reports">All Reports</NavLink>
                </>
              ) : (
                <>
                  <NavLink href="/reports/new" emphasize>
                    Report an Issue
                  </NavLink>
                  <NavLink href="/reports">Reports</NavLink>
                  <NavLink href="/dashboard">My Reports</NavLink>
                </>
              )}

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
          ) : (
            <>
              <Link
                href="/login"
                className="font-serif italic text-sm text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:underline hover:decoration-amber-600 hover:decoration-2 hover:underline-offset-4 transition"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-amber-50 bg-slate-800 dark:bg-slate-700 rounded-sm hover:bg-slate-900 dark:hover:bg-slate-600 transition border border-slate-900 dark:border-slate-500"
              >
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
