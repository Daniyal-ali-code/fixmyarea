"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";

// Inline SVG icons — no icon library, stroke inherits the tab color.
function Icon({ d, className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

const ICONS = {
  home: "M3 11.5 12 3l9 8.5M5.5 10.5V21h13v-10.5",
  reports: "M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01",
  plus: "M12 5v14M5 12h14",
  user: "M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM5 21a7 7 0 0 1 14 0",
  login: "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3",
  shield: "M12 3l7 3v5c0 4.6-3 7.6-7 9-4-1.4-7-4.4-7-9V6l7-3zM9 12l2 2 4-4",
};

function Tab({ href, label, icon, active }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex flex-col items-center justify-center gap-1 py-2 min-h-[52px] text-xs leading-none transition active:scale-95 ${
        active
          ? "text-[var(--accent)] font-semibold"
          : "text-[var(--foreground-muted)] hover:text-[var(--foreground)] dark:hover:text-[var(--foreground)]"
      }`}
    >
      <Icon d={ICONS[icon]} className="w-6 h-6" />
      <span>{label}</span>
      {/* Active-tab indicator: a small amber dot, always the same size
          so switching tabs never shifts the layout. */}
      <span
        aria-hidden="true"
        className={`h-1 w-1 rounded-full bg-[var(--accent)] transition-all duration-200 ${
          active ? "opacity-100 scale-100" : "opacity-0 scale-50"
        }`}
      />
    </Link>
  );
}

// Raised center action — the primary action for the signed-in role.
function CenterAction({ href, label, icon, active }) {
  return (
    <div className="relative flex flex-col items-center justify-center">
      <Link
        href={href}
        aria-label={label}
        aria-current={active ? "page" : undefined}
        className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center justify-center w-14 h-14 rounded-full bg-[var(--accent)] text-white shadow-lg ring-4 ring-[var(--surface)] hover:bg-[var(--accent)] active:scale-95 transition"
      >
        <Icon d={ICONS[icon]} className="w-7 h-7" />
      </Link>
      <span
        className={`mt-7 text-xs leading-none transition ${
          active
            ? "text-[var(--accent)] font-semibold"
            : "text-[var(--foreground-muted)]"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

export default function BottomNav() {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  const isHome = pathname === "/";
  const isReports =
    pathname === "/reports" || pathname.startsWith("/reports/");
  const isNewReport = pathname === "/reports/new";
  const isDashboard = pathname === "/dashboard";
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin");
  const isLogin = pathname === "/login";

  // While auth is still resolving, render the bar shell at full height
  // with no tabs — otherwise the guest bar flashes, then swaps to the
  // signed-in bar on every signed-in load.
  if (loading) {
    return (
      <nav
        aria-label="Primary"
        className="fixed bottom-0 inset-x-0 z-50 bg-[var(--background)] border-t border-[var(--border)] shadow-[0_-2px_12px_rgba(0,0,0,0.08)] pb-[env(safe-area-inset-bottom)]"
      >
        <div className="mx-auto max-w-3xl min-h-[56px]" />
      </nav>
    );
  }

  // Signed out: the guest tabs.
  if (!user) {
    return (
      <nav
        aria-label="Primary"
        className="fixed bottom-0 inset-x-0 z-50 bg-[var(--background)] border-t border-[var(--border)] shadow-[0_-2px_12px_rgba(0,0,0,0.08)] pb-[env(safe-area-inset-bottom)]"
      >
        {/* Deliberate phone-width tab bar (max-w-3xl) while the header
            and content span max-w-6xl — the bar is a phone UI, centred. */}
        <div className="mx-auto max-w-3xl grid grid-cols-3 min-h-[56px]">
          <Tab href="/" label="Home" icon="home" active={isHome} />
          <Tab
            href="/reports"
            label="Reports"
            icon="reports"
            active={isReports}
          />
          <Tab href="/login" label="Login" icon="login" active={isLogin} />
        </div>
      </nav>
    );
  }

  // Signed in: 4 slots, the center one is the role's primary action.
  const center =
    user.role === "admin"
      ? { href: "/admin", label: "Admin", icon: "shield", active: isAdmin }
      : {
          href: "/reports/new",
          label: "Report",
          icon: "plus",
          active: isNewReport,
        };

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 inset-x-0 z-50 bg-[var(--background)] border-t border-[var(--border)] shadow-[0_-2px_12px_rgba(0,0,0,0.08)] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto max-w-3xl grid grid-cols-4 min-h-[56px]">
        <Tab href="/" label="Home" icon="home" active={isHome} />
        <Tab
          href="/reports"
          label="Reports"
          icon="reports"
          active={isReports && !isNewReport}
        />
        <CenterAction {...center} />
        <Tab
          href="/dashboard"
          label="My Reports"
          icon="user"
          active={isDashboard}
        />
      </div>
    </nav>
  );
}
