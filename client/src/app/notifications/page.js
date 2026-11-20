"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { Button, Card, LoadingNote, EmptyState } from "@/components/ui";

const TYPE_LABELS = {
  status_reported: "Reported",
  status_under_review: "Under Review",
  status_in_progress: "In Progress",
  status_resolved: "Resolved",
};

function timeAgo(dateString) {
  const date = new Date(dateString);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/notifications", { credentials: "include" });
        if (!res.ok) throw new Error("Failed to load notifications");
        const data = await res.json();
        if (!cancelled) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [user, authLoading, router]);

  async function handleMarkAllRead() {
    try {
      await fetch("/api/notifications/read-all", {
        method: "POST",
        credentials: "include",
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // silent
    }
  }

  async function handleMarkRead(id) {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: "POST",
        credentials: "include",
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // silent
    }
  }

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-[var(--background)]">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <LoadingNote>Loading notifications…</LoadingNote>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="flex items-baseline justify-between mb-8 pb-2 border-b-2 border-[var(--accent)]">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-[var(--foreground)]">
              Notifications
            </h1>
            <p className="text-sm text-[var(--foreground-muted)] mt-1">
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="secondary" onClick={handleMarkAllRead}>
              Mark all read
            </Button>
          )}
        </div>

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-sm p-3 rounded-lg">
            {error}
          </div>
        )}

        {notifications.length === 0 ? (
          <EmptyState
            action={
              <Link href="/reports">
                <Button variant="secondary">Browse reports</Button>
              </Link>
            }
          >
            You don&apos;t have any notifications yet. When an admin updates one of your reports, you&apos;ll see it here.
          </EmptyState>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <Card
                key={n.id}
                className={`p-5 transition ${
                  n.is_read
                    ? "opacity-70"
                    : "ring-1 ring-[var(--accent)]/20"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                        {TYPE_LABELS[n.type] || n.type}
                      </span>
                      <span className="text-xs text-[var(--foreground-muted)]">
                        {timeAgo(n.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--foreground)] mb-1">
                      {n.message}
                    </p>
                    {n.report_id && n.report_title && (
                      <Link
                        href={`/reports/${n.report_id}`}
                        className="text-xs text-[var(--accent)] hover:underline"
                      >
                        View report: {n.report_title}
                      </Link>
                    )}
                  </div>
                  {!n.is_read && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="text-xs text-[var(--foreground-muted)] hover:text-[var(--accent)] whitespace-nowrap"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
