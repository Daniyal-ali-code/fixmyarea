"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "./AuthProvider";

export default function Header() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [unread, setUnread] = useState(0);

  // Fetch unread count whenever the user changes and on mount.
  useEffect(() => {
    if (!user) {
      setUnread(0);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/notifications?limit=1", {
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setUnread(data.unreadCount || 0);
      } catch {
        // silent — badge just doesn't update
      }
    };
    load();
    // Poll every 60s so the badge stays fresh without a websocket.
    const interval = setInterval(load, 60_000);
    // Listen for manual refresh triggers from any page (e.g. after
    // marking a notification read on /notifications).
    const onRefresh = () => load();
    window.addEventListener('notifications:refresh', onRefresh);
    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener('notifications:refresh', onRefresh);
    };
  }, [user]);

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

        <div className="flex items-center gap-2 sm:gap-3">
          {loading ? (
            <div className="h-9 w-24 bg-[var(--border)] rounded-lg animate-pulse" />
          ) : user ? (
            <>
              <span className="text-sm text-[var(--foreground)] hidden sm:inline">
                {user.name}
              </span>

              <Link
                href="/notifications"
                aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ""}`}
                className="relative inline-flex items-center justify-center h-11 w-11 rounded-lg text-[var(--foreground)] hover:bg-[var(--accent-soft)] transition"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5"
                  aria-hidden="true"
                >
                  <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-[var(--coral)] text-white text-[10px] font-bold rounded-full badge-pulse">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>

              <ThemeToggle />

              <button
                onClick={handleLogout}
                className="px-4 py-2 min-h-11 text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] bg-[var(--surface)] rounded-lg hover:bg-[var(--accent-soft)] transition border border-[var(--border)]"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <ThemeToggle />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
