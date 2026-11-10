"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { useAuth } from "@/components/AuthProvider";

const STATUS_OPTIONS = ["reported", "under_review", "in_progress", "resolved"];

const STATUS_LABELS = {
  reported: "Reported",
  under_review: "Under Review",
  in_progress: "In Progress",
  resolved: "Resolved",
};

const STATUS_STYLES = {
  reported:
    "bg-blue-50 text-blue-900 border-blue-300 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800",
  under_review:
    "bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800",
  in_progress:
    "bg-orange-50 text-orange-900 border-orange-300 dark:bg-orange-950 dark:text-orange-200 dark:border-orange-800",
  resolved:
    "bg-slate-50 text-slate-900 border-slate-300 dark:bg-slate-950 dark:text-slate-200 dark:border-slate-700",
};

export default function AdminPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();

  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.role !== "admin") {
      router.push("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!token || user?.role !== "admin") return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const [r1, r2] = await Promise.all([
          fetch("/api/admin/reports", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/stats"),
        ]);

        if (!r1.ok) {
          const body = await r1.json().catch(() => ({}));
          throw new Error(body.error || "Failed to load reports");
        }
        if (!r2.ok) throw new Error("Failed to load stats");

        const reportsData = await r1.json();
        const statsData = await r2.json();

        if (!cancelled) {
          setReports(reportsData.reports || []);
          setStats(statsData);
        }
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

  async function changeStatus(id, status) {
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/reports/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Status update failed");
      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: data.new_status } : r))
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function deleteReport(id, title) {
    if (!confirm(`Delete report "${title}"? This cannot be undone.`)) return;
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/reports/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Delete failed");
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  if (authLoading) {
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

  if (!user || user.role !== "admin") return null;

  return (
    <main className="min-h-screen bg-amber-50 dark:bg-stone-900">
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Title bar */}
        <div className="flex items-baseline justify-between mb-8 pb-2 border-b-2 border-amber-600">
          <div>
            <h1 className="font-serif text-4xl font-bold text-stone-900 dark:text-stone-50">
              Admin Dashboard
            </h1>
            <p className="font-serif italic text-sm text-stone-600 dark:text-stone-400 mt-1">
              {user.name} · {user.email}
            </p>
          </div>
          <Link
            href="/"
            className="font-serif italic text-sm text-slate-800 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-500 transition"
          >
            ← Home
          </Link>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-800 rounded-sm p-4 text-red-800 dark:text-red-200 font-serif">
            {error}
          </div>
        )}

        {loading && !stats && (
          <p className="font-serif italic text-stone-600 dark:text-stone-400">
            Loading dashboard…
          </p>
        )}

        {stats && (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard
                label="Total Reports"
                value={stats.totals.total_reports}
              />
              <StatCard label="Resolved" value={stats.totals.resolved_reports} />
              <StatCard
                label="Resolution Rate"
                value={`${stats.totals.resolution_rate}%`}
              />
              <StatCard
                label="Pending"
                value={
                  stats.totals.total_reports - stats.totals.resolved_reports
                }
              />
            </div>

            {/* Category breakdown */}
            {stats.by_category?.length > 0 && (
              <div className="mb-8 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-sm p-5">
                <h2 className="font-serif text-xl font-bold text-stone-900 dark:text-stone-50 mb-3">
                  Reports by Category
                </h2>
                <div className="flex flex-wrap gap-2">
                  {stats.by_category.map((c) => (
                    <span
                      key={c.id}
                      className="font-sans text-xs uppercase tracking-wider bg-amber-50 dark:bg-stone-700 border border-stone-300 dark:border-stone-600 rounded-sm px-3 py-1 text-stone-800 dark:text-stone-200"
                    >
                      {c.name}: <strong>{c.count}</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Report table */}
        <div className="bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-300 dark:border-stone-700 bg-amber-50 dark:bg-stone-900">
                  <Th>ID</Th>
                  <Th>Title</Th>
                  <Th>Category</Th>
                  <Th>Reporter</Th>
                  <Th>Sev</Th>
                  <Th>Support</Th>
                  <Th>Priority</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {reports.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="p-12 text-center font-serif italic text-stone-600 dark:text-stone-400"
                    >
                      No reports yet.
                    </td>
                  </tr>
                )}
                {reports.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-stone-200 dark:border-stone-700 hover:bg-amber-50/50 dark:hover:bg-stone-900/50"
                  >
                    <Td>#{r.id}</Td>
                    <Td>
                      <Link
                        href={`/reports/${r.id}`}
                        className="font-serif font-semibold text-stone-900 dark:text-stone-50 hover:text-amber-600 dark:hover:text-amber-500"
                      >
                        {r.title}
                      </Link>
                    </Td>
                    <Td>{r.category_name}</Td>
                    <Td>{r.reporter_name}</Td>
                    <Td>{r.severity}/5</Td>
                    <Td>{r.support_count}</Td>
                    <Td>{Number(r.priority_score).toFixed(1)}</Td>
                    <Td>
                      <span
                        className={`inline-block px-2 py-1 rounded-sm text-xs font-sans border ${STATUS_STYLES[r.status]}`}
                      >
                        {STATUS_LABELS[r.status]}
                      </span>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <select
                          value={r.status}
                          onChange={(e) => changeStatus(r.id, e.target.value)}
                          disabled={busyId === r.id}
                          className="text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-600 rounded-sm px-2 py-1 text-stone-800 dark:text-stone-200 disabled:opacity-50"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {STATUS_LABELS[s]}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => deleteReport(r.id, r.title)}
                          disabled={busyId === r.id}
                          className="text-xs uppercase tracking-wider px-2 py-1 rounded-sm bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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

function Th({ children }) {
  return (
    <th className="text-left font-sans text-xs uppercase tracking-wider text-stone-700 dark:text-stone-300 px-3 py-3">
      {children}
    </th>
  );
}

function Td({ children }) {
  return (
    <td className="px-3 py-3 font-sans text-stone-800 dark:text-stone-200">
      {children}
    </td>
  );
}
