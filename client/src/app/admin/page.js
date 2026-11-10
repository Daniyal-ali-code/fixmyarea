"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

const SORT_COLUMNS = [
  { key: "id", label: "ID", get: (r) => r.id },
  { key: "created_at", label: "Time", get: (r) => new Date(r.created_at).getTime() },
  { key: "title", label: "Title", get: (r) => (r.title || "").toLowerCase() },
  { key: "category_name", label: "Category", get: (r) => (r.category_name || "").toLowerCase() },
  { key: "reporter_name", label: "Reporter", get: (r) => (r.reporter_name || "").toLowerCase() },
  { key: "severity", label: "Severity", get: (r) => r.severity },
  { key: "support_count", label: "Support", get: (r) => r.support_count },
  { key: "priority_score", label: "Priority", get: (r) => Number(r.priority_score) },
  { key: "status", label: "Status", get: (r) => STATUS_OPTIONS.indexOf(r.status) },
];

export default function AdminPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();

  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const [sortStack, setSortStack] = useState([{ key: "created_at", dir: "desc" }]);

  const [resolveTarget, setResolveTarget] = useState(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [resolutionImage, setResolutionImage] = useState(null);
  const [resolutionImagePreview, setResolutionImagePreview] = useState(null);
  const [resolutionSubmitting, setResolutionSubmitting] = useState(false);
  const [resolutionError, setResolutionError] = useState("");
  const previewRef = useRef(null);

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
    if (status === "resolved") {
      const target = reports.find((r) => r.id === id);
      openResolveModal(target);
      return;
    }

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

  function openResolveModal(report) {
    if (!report) return;
    setResolveTarget(report);
    setResolutionNote("");
    setResolutionImage(null);
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    }
    setResolutionImagePreview(null);
    setResolutionError("");
  }

  function closeResolveModal() {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    }
    setResolveTarget(null);
    setResolutionNote("");
    setResolutionImage(null);
    setResolutionImagePreview(null);
    setResolutionError("");
  }

  function handleResolutionImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setResolutionError("Image must be JPEG, PNG, or WEBP");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setResolutionError("Image must be 5 MB or smaller");
      return;
    }
    setResolutionError("");
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
    }
    const url = URL.createObjectURL(file);
    previewRef.current = url;
    setResolutionImage(file);
    setResolutionImagePreview(url);
  }

  async function submitResolution(e) {
    e.preventDefault();
    if (!resolveTarget) return;
    setResolutionError("");

    if (!resolutionNote.trim() || resolutionNote.trim().length < 5) {
      setResolutionError("Please write a note (at least 5 characters) describing the fix.");
      return;
    }
    if (!resolutionImage) {
      setResolutionError("Please upload a photo showing the fixed issue.");
      return;
    }

    setResolutionSubmitting(true);
    setBusyId(resolveTarget.id);

    try {
      const form = new FormData();
      form.append("status", "resolved");
      form.append("resolution_note", resolutionNote.trim());
      form.append("resolution_image", resolutionImage);

      const res = await fetch(`/api/admin/reports/${resolveTarget.id}/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to mark as resolved");

      setReports((prev) =>
        prev.map((r) =>
          r.id === resolveTarget.id ? { ...r, ...data.report } : r
        )
      );
      closeResolveModal();
    } catch (err) {
      setResolutionError(err.message);
    } finally {
      setResolutionSubmitting(false);
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

  function handleSort(key, shiftKey) {
    setSortStack((prev) => {
      const existingIdx = prev.findIndex((s) => s.key === key);

      if (existingIdx !== -1 && prev.length === 1) {
        const next = [...prev];
        next[0] = { key, dir: next[0].dir === "asc" ? "desc" : "asc" };
        return next;
      }

      const newEntry = { key, dir: "asc" };

      if (!shiftKey) {
        if (prev[0]?.key === key) {
          return [{ key, dir: prev[0].dir === "asc" ? "desc" : "asc" }];
        }
        return [newEntry];
      }

      const without = prev.filter((s) => s.key !== key);
      return [...without, newEntry];
    });
  }

  const sortedReports = useMemo(() => {
    if (sortStack.length === 0) return reports;
    const copy = [...reports];
    copy.sort((a, b) => {
      for (const { key, dir } of sortStack) {
        const col = SORT_COLUMNS.find((c) => c.key === key);
        if (!col) continue;
        const av = col.get(a);
        const bv = col.get(b);
        if (av === bv) continue;
        const cmp = av < bv ? -1 : 1;
        return dir === "asc" ? cmp : -cmp;
      }
      return 0;
    });
    return copy;
  }, [reports, sortStack]);

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
      <div className="max-w-7xl mx-auto px-4 py-12">
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard label="Total Reports" value={stats.totals.total_reports} />
              <StatCard label="Resolved" value={stats.totals.resolved_reports} />
              <StatCard label="Resolution Rate" value={`${stats.totals.resolution_rate}%`} />
              <StatCard label="Pending" value={stats.totals.total_reports - stats.totals.resolved_reports} />
            </div>

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

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="font-sans text-xs uppercase tracking-wider text-stone-600 dark:text-stone-400">
            Sort by:
          </span>
          {SORT_COLUMNS.map((col) => {
            const idx = sortStack.findIndex((s) => s.key === col.key);
            const active = idx !== -1;
            const sortEntry = active ? sortStack[idx] : null;
            return (
              <button
                key={col.key}
                onClick={(e) => handleSort(col.key, e.shiftKey)}
                className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-sm border transition ${
                  active
                    ? "bg-amber-600 text-stone-900 border-amber-700"
                    : "bg-amber-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-400 dark:border-stone-600 hover:border-amber-600"
                }`}
                title="Click to sort · Shift+click to add as secondary sort"
              >
                {col.label}
                {active && (
                  <span className="ml-1">
                    {sortEntry.dir === "asc" ? "↑" : "↓"}
                    {sortStack.length > 1 && (
                      <sup className="ml-0.5 text-[10px]">{idx + 1}</sup>
                    )}
                  </span>
                )}
              </button>
            );
          })}
          {sortStack.length > 1 && (
            <button
              onClick={() => setSortStack([{ key: "created_at", dir: "desc" }])}
              className="ml-2 text-xs font-serif italic text-stone-600 dark:text-stone-400 hover:text-amber-600 dark:hover:text-amber-500 underline underline-offset-2"
            >
              reset
            </button>
          )}
        </div>
        <p className="mb-4 text-xs font-serif italic text-stone-500 dark:text-stone-500">
          Click to sort by one column. Shift+click another column to add a secondary sort. Click the same column again to flip direction.
        </p>

        <div className="bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-300 dark:border-stone-700 bg-amber-50 dark:bg-stone-900">
                  <Th>ID</Th>
                  <Th>Title</Th>
                  <Th>Category</Th>
                  <Th>Address</Th>
                  <Th>Reporter</Th>
                  <Th>Sev</Th>
                  <Th>Support</Th>
                  <Th>Priority</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {sortedReports.length === 0 && (
                  <tr>
                    <td
                      colSpan={10}
                      className="p-12 text-center font-serif italic text-stone-600 dark:text-stone-400"
                    >
                      No reports yet.
                    </td>
                  </tr>
                )}
                {sortedReports.map((r) => (
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
                    <Td>
                      <span className="text-xs text-stone-600 dark:text-stone-400">
                        {r.address || "—"}
                      </span>
                    </Td>
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

      {resolveTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4 py-8 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeResolveModal();
          }}
        >
          <div className="bg-amber-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-sm max-w-lg w-full p-6 my-auto">
            <div className="flex items-start justify-between mb-4 pb-2 border-b-2 border-amber-600">
              <div>
                <h2 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-50">
                  Mark as Resolved
                </h2>
                <p className="font-serif italic text-sm text-stone-600 dark:text-stone-400 mt-1">
                  {resolveTarget.title}
                </p>
              </div>
              <button
                onClick={closeResolveModal}
                className="text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 text-2xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <p className="font-serif italic text-sm text-stone-700 dark:text-stone-300 mb-4">
              Upload a photo showing the fixed issue and write a short note. This proof will be visible to the community.
            </p>

            {resolutionError && (
              <div className="mb-4 bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-200 text-sm p-3 rounded-sm">
                {resolutionError}
              </div>
            )}

            <form onSubmit={submitResolution} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-2">
                  Proof Photo *
                </label>

                {resolutionImagePreview ? (
                  <div className="relative aspect-video bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-sm overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resolutionImagePreview}
                      alt="Resolution preview"
                      className="w-full h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (previewRef.current) {
                          URL.revokeObjectURL(previewRef.current);
                          previewRef.current = null;
                        }
                        setResolutionImage(null);
                        setResolutionImagePreview(null);
                      }}
                      className="absolute top-2 right-2 h-7 w-7 flex items-center justify-center bg-stone-900/80 text-white text-sm rounded-full hover:bg-red-600 transition"
                      aria-label="Remove photo"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <label className="block px-4 py-6 text-center text-xs font-semibold uppercase tracking-wider bg-stone-100 dark:bg-stone-800 border-2 border-dashed border-stone-400 dark:border-stone-600 rounded-sm hover:border-amber-600 dark:hover:border-amber-500 transition cursor-pointer">
                    📷 Click to upload proof photo
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleResolutionImageChange}
                      className="hidden"
                    />
                  </label>
                )}
                <p className="text-xs text-stone-500 dark:text-stone-500 mt-1">
                  JPEG, PNG, or WEBP · max 5 MB
                </p>
              </div>

              <div>
                <label
                  htmlFor="resolutionNote"
                  className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-2"
                >
                  What was fixed? *
                </label>
                <textarea
                  id="resolutionNote"
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-600 rounded-sm text-stone-900 dark:text-stone-50 focus:outline-none focus:border-slate-800 dark:focus:border-slate-500 transition resize-y"
                  placeholder="e.g. Pothole filled and asphalt leveled by the municipal team."
                />
                <p className="text-xs text-stone-500 dark:text-stone-500 mt-1">
                  {resolutionNote.length}/500 characters
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeResolveModal}
                  disabled={resolutionSubmitting}
                  className="flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300 bg-amber-50 dark:bg-stone-800 rounded-sm hover:bg-amber-100 dark:hover:bg-stone-700 border border-stone-400 dark:border-stone-600 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolutionSubmitting}
                  className="flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-stone-900 bg-amber-600 rounded-sm hover:bg-amber-500 shadow-md shadow-amber-600/30 transition border border-amber-700 disabled:opacity-50"
                >
                  {resolutionSubmitting ? "Marking…" : "Mark Resolved"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
