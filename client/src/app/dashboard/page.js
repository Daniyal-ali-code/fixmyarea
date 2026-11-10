"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import ReportCard from "@/components/ReportCard";
import { useAuth } from "@/components/AuthProvider";

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.role === "admin") {
      router.push("/admin");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!token || !user || user.role === "admin") return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/reports?mine=true", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load your reports");
        const data = await res.json();
        if (!cancelled) setReports(data.reports || []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, user]);

  if (authLoading || (!user && !error)) {
    return (
      <main className="min-h-screen bg-amber-50 dark:bg-stone-900">
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-20 text-center">
          <p className="font-serif italic text-stone-600 dark:text-stone-400">
            Loading…
          </p>
        </div>
      </main>
    );
  }

  if (!user || user.role === "admin") return null;

  const resolved = reports.filter((r) => r.status === "resolved").length;
  const inProgress = reports.filter((r) => r.status === "in_progress").length;
  const open = reports.filter((r) => r.status === "reported" || r.status === "under_review").length;

  return (
    <main className="min-h-screen bg-amber-50 dark:bg-stone-900">
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-baseline justify-between mb-8 pb-2 border-b-2 border-amber-600">
          <div>
            <h1 className="font-serif text-4xl font-bold text-stone-900 dark:text-stone-50">
              My Reports
            </h1>
            <p className="font-serif italic text-sm text-stone-600 dark:text-stone-400 mt-1">
              {user.name} · {user.email}
            </p>
          </div>
          <Link
            href="/reports/new"
            className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-stone-900 bg-amber-600 rounded-sm hover:bg-amber-500 transition border border-amber-700"
          >
            + Report an Issue
          </Link>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-800 rounded-sm p-4 text-red-800 dark:text-red-200 font-serif">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total" value={reports.length} />
          <StatCard label="Open" value={open} />
          <StatCard label="In Progress" value={inProgress} />
          <StatCard label="Resolved" value={resolved} />
        </div>

        {loading ? (
          <p className="font-serif italic text-stone-600 dark:text-stone-400">
            Loading your reports…
          </p>
        ) : reports.length === 0 ? (
          <div className="bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-sm p-12 text-center">
            <p className="font-serif italic text-stone-600 dark:text-stone-400 mb-4">
              You haven&apos;t reported any issues yet.
            </p>
            <Link
              href="/reports/new"
              className="inline-block px-6 py-3 text-xs font-semibold uppercase tracking-wider text-stone-900 bg-amber-600 rounded-sm hover:bg-amber-500 transition border border-amber-700"
            >
              Report your first issue
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((r) => (
              <ReportCard key={r.id} report={r} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-sm p-5">
      <p className="font-sans text-xs uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
        {label}
      </p>
      <p className="font-serif text-3xl font-bold text-stone-900 dark:text-stone-50">
        {value}
      </p>
    </div>
  );
}
