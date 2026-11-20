"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import Modal from "@/components/Modal";
import {
  Alert,
  Button,
  LoadingNote,
  StatusBadge,
  CameraIcon,
  textareaClass,
  btnDangerSm,
  textLinkClass,
  chipActive,
  chipInactive,
} from "@/components/ui";
import { STATUS_LABELS } from "@/lib/status";

const STATUS_OPTIONS = ["reported", "under_review", "in_progress", "resolved"];

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
  const { user, loading: authLoading } = useAuth();

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

  async function refreshStats() {
    try {
      const res = await fetch("/api/stats", { credentials: "include" });
      if (!res.ok) return;
      setStats(await res.json());
    } catch (err) {
      console.error("Failed to refresh stats:", err);
    }
  }

  useEffect(() => {
    if (!user || user?.role !== "admin") return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const [r1, r2] = await Promise.all([
          fetch("/api/admin/reports", { credentials: "include" }),
          fetch("/api/stats", { credentials: "include" }),
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
  }, [user]);

  // Escape closes the resolve modal.
  useEffect(() => {
    if (!resolveTarget) return;
    function onKeyDown(e) {
      if (e.key === "Escape") closeResolveModal();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [resolveTarget]);

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
        },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Status update failed");
      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: data.new_status } : r))
      );
      refreshStats();
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
        credentials: "include",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to mark as resolved");

      setReports((prev) =>
        prev.map((r) =>
          r.id === resolveTarget.id ? { ...r, ...data.report } : r
        )
      );
      refreshStats();
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
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Delete failed");
      setReports((prev) => prev.filter((r) => r.id !== id));
      refreshStats();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  function handleSort(key, shiftKey) {
    setSortStack((prev) => {
      const existingIdx = prev.findIndex((s) => s.key === key);
      // Re-adding a column that is already sorted flips its direction
      // instead of resetting to asc — including Shift+click secondary sorts.
      const dir =
        existingIdx !== -1 && prev[existingIdx].dir === "asc"
          ? "desc"
          : "asc";
      if (!shiftKey) {
        return [{ key, dir }];
      }
      const without = prev.filter((s) => s.key !== key);
      return [...without, { key, dir }];
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
      <main className="min-h-screen bg-[var(--background)]">
        <div className="max-w-6xl mx-auto px-4">
          <LoadingNote>Loading…</LoadingNote>
        </div>
      </main>
    );
  }

  if (!user || user.role !== "admin") return null;

  return (
    <main className="min-h-screen bg-[var(--background)]">
      {/* Admin keeps max-w-7xl deliberately — the 10-column table
          needs the width; every other page is max-w-6xl. */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-baseline justify-between mb-8 pb-2 border-b-2 border-[var(--accent)]">
          <div>
            <h1 className="text-4xl font-bold text-[var(--foreground)]">
              Admin Dashboard
            </h1>
            <p className="text-sm text-[var(--foreground-muted)] mt-1">
              {user.name} · {user.email}
            </p>
          </div>
          <Link
            href="/"
            className={textLinkClass}
          >
            ← Home
          </Link>
        </div>

        {error && <Alert className="mb-6">{error}</Alert>}

        {loading && !stats && <LoadingNote>Loading dashboard…</LoadingNote>}

        {stats && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard label="Total Reports" value={stats.totals.total_reports} />
              <StatCard label="Resolved" value={stats.totals.resolved_reports} />
              <StatCard label="Resolution Rate" value={`${stats.totals.resolution_rate}%`} />
              <StatCard label="Pending" value={stats.totals.total_reports - stats.totals.resolved_reports} />
            </div>

            {stats.by_category?.length > 0 && (
              <div className="mb-8 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
                <h2 className="text-xl font-bold text-[var(--foreground)] mb-3">
                  Reports by Category
                </h2>
                <div className="flex flex-wrap gap-2">
                  {stats.by_category.map((c) => (
                    <span
                      key={c.id}
                      className="font-sans text-xs uppercase tracking-wider bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-1 text-[var(--foreground)]"
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
          <span className="font-sans text-xs uppercase tracking-wider text-[var(--foreground-muted)]">
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
                className={active ? chipActive : chipInactive}
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
              className="ml-2 text-xs text-[var(--foreground-muted)] hover:text-[var(--accent)] dark:hover:text-[var(--foreground-muted)] underline underline-offset-2"
            >
              reset
            </button>
          )}
        </div>
        <p className="mb-4 text-xs text-[var(--foreground-muted)]">
          Click to sort by one column. Shift+click another column to add a secondary sort. Click the same column again to flip direction.
        </p>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--background)]">
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
                      className="p-12 text-center text-[var(--foreground-muted)]"
                    >
                      No reports yet.
                    </td>
                  </tr>
                )}
                {sortedReports.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-[var(--border)] hover:bg-white/50 dark:hover:bg-[var(--background)]/50"
                  >
                    <Td>#{r.id}</Td>
                    <Td>
                      <Link
                        href={`/reports/${r.id}`}
                        className="font-semibold text-[var(--foreground)] hover:text-[var(--accent)] dark:hover:text-[var(--foreground-muted)]"
                      >
                        {r.title}
                      </Link>
                    </Td>
                    <Td>{r.category_name}</Td>
                    <Td>
                      <span className="text-xs text-[var(--foreground-muted)]">
                        {r.address || "—"}
                      </span>
                    </Td>
                    <Td>{r.reporter_name}</Td>
                    <Td>{r.severity}/5</Td>
                    <Td>{r.support_count}</Td>
                    <Td>{Number(r.priority_score).toFixed(1)}</Td>
                    <Td>
                      <StatusBadge status={r.status} />
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <select
                          value={r.status}
                          onChange={(e) => changeStatus(r.id, e.target.value)}
                          disabled={busyId === r.id}
                          aria-label={`Change status of report ${r.id}: ${r.title}`}
                          className="text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg px-2 py-2 min-h-11 text-[var(--foreground)] disabled:opacity-50"
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
                          className={btnDangerSm}
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
        <Modal onClose={closeResolveModal} label="Mark as Resolved">
            <div className="flex items-start justify-between mb-4 pb-2 border-b-2 border-[var(--accent)]">
              <div>
                <h2 className="text-2xl font-bold text-[var(--foreground)]">
                  Mark as Resolved
                </h2>
                <p className="text-sm text-[var(--foreground-muted)] mt-1">
                  {resolveTarget.title}
                </p>
              </div>
              <button
                onClick={closeResolveModal}
                className="h-11 w-11 -mr-2 -mt-1 flex items-center justify-center flex-shrink-0 text-[var(--foreground-muted)] hover:text-[var(--foreground)] dark:hover:text-[var(--foreground)] text-2xl leading-none transition active:scale-95"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <p className="text-sm text-[var(--foreground)] mb-4">
              Upload a photo showing the fixed issue and write a short note. This proof will be visible to the community.
            </p>

            {resolutionError && <Alert className="mb-4">{resolutionError}</Alert>}

            <form onSubmit={submitResolution} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] mb-2">
                  Proof Photo *
                </label>

                {resolutionImagePreview ? (
                  <div className="relative aspect-video bg-[var(--surface-muted)] border border-[var(--border)] rounded-lg overflow-hidden">
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
                      className="absolute top-2 right-2 h-8 w-8 flex items-center justify-center bg-[var(--background)]/80 text-white text-sm rounded-full hover:bg-red-600 transition active:scale-95"
                      aria-label="Remove photo"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 px-4 py-6 text-center text-xs font-semibold uppercase tracking-wider bg-[var(--surface-muted)] border-2 border-dashed border-[var(--border)] rounded-lg hover:border-[var(--accent)] dark:hover:border-[var(--accent)] transition cursor-pointer">
                    <CameraIcon className="w-4 h-4" /> Click to upload proof photo
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleResolutionImageChange}
                      className="hidden"
                    />
                  </label>
                )}
                <p className="text-xs text-[var(--foreground-muted)] mt-1">
                  JPEG, PNG, or WEBP · max 5 MB
                </p>
              </div>

              <div>
                <label
                  htmlFor="resolutionNote"
                  className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] mb-2"
                >
                  What was fixed? *
                </label>
                <textarea
                  id="resolutionNote"
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  rows={3}
                  maxLength={500}
                  className={textareaClass}
                  placeholder="e.g. Pothole filled and asphalt leveled by the municipal team."
                />
                <p className="text-xs text-[var(--foreground-muted)] mt-1">
                  {resolutionNote.length}/500 characters
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={closeResolveModal}
                  disabled={resolutionSubmitting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={resolutionSubmitting}
                  className="flex-1"
                >
                  {resolutionSubmitting ? "Marking…" : "Mark Resolved"}
                </Button>
              </div>
            </form>
        </Modal>
      )}
    </main>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
      <p className="font-sans text-xs uppercase tracking-wider text-[var(--foreground-muted)] mb-1">
        {label}
      </p>
      <p className="text-3xl font-bold text-[var(--foreground)]">
        {value}
      </p>
    </div>
  );
}

function Th({ children }) {
  return (
    <th className="text-left font-sans text-xs uppercase tracking-wider text-[var(--foreground)] px-3 py-3">
      {children}
    </th>
  );
}

function Td({ children }) {
  return (
    <td className="px-3 py-3 font-sans text-[var(--foreground)]">
      {children}
    </td>
  );
}
