"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

export default function SupportButton({ reportId, initialCount, initialSupported = false }) {
  const router = useRouter();
  const { user } = useAuth();
  const [count, setCount] = useState(initialCount);
  const [supported, setSupported] = useState(initialSupported);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // The server-rendered page cannot know whether the viewer already
  // supported this report, so ask the API (GET /api/reports/[id]/support)
  // instead of assuming "not supported" and unsupporting on first click.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/reports/${reportId}/support`, {
          credentials: "include",
        });
        if (!res.ok) return; // 401 (logged out) or error: treat as not supported
        const data = await res.json();
        if (!cancelled) setSupported(Boolean(data.supported));
      } catch (err) {
        if (!cancelled) console.error("Support status failed:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, reportId]);

  async function handleClick() {
    if (!user) {
      router.push("/login");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/reports/${reportId}/support`, {
        method: "POST",
        credentials: "include",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Could not update support. Please try again.");
        return;
      }

      setSupported(data.supported);
      setCount(data.support_count);
      // The header count is server-rendered — refresh so both counts agree.
      router.refresh();
    } catch (err) {
      console.error("Support error:", err);
      setError("Could not update support. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        aria-pressed={supported}
        className={`inline-block px-8 py-3 text-xs font-semibold uppercase tracking-wider rounded-sm transition-all border ${
          supported
            ? "text-stone-900 bg-amber-500 hover:bg-amber-400 border-amber-600 shadow-md shadow-amber-600/30"
            : "text-stone-900 bg-amber-600 hover:bg-amber-500 border-amber-700 shadow-md shadow-amber-600/30 hover:shadow-lg hover:shadow-amber-600/40"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {loading
          ? "Updating..."
          : supported
          ? `✓ Supported (${count})`
          : `👍 Support this report (${count})`}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-800 dark:text-red-200">
          {error}
        </p>
      )}
    </div>
  );
}
