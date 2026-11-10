"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const ReportsMap = dynamic(() => import("./ReportsMap"), {
  ssr: false,
  loading: () => (
    <div className="rounded-sm border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 animate-pulse" style={{ height: 520 }} />
  ),
});

export default function HomeMapSection() {
  const [reports, setReports] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/reports");
        if (!res.ok) throw new Error("Failed to load reports");
        const data = await res.json();
        if (!cancelled) setReports(data.reports || []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="rounded-sm border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950 p-4 text-red-800 dark:text-red-200 text-sm">
        Could not load map: {error}
      </div>
    );
  }

  if (reports === null) {
    return (
      <div
        className="rounded-sm border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 animate-pulse flex items-center justify-center"
        style={{ height: 520 }}
      >
        <span className="font-serif italic text-stone-500 dark:text-stone-500">
          Loading map…
        </span>
      </div>
    );
  }

    if (reports.length === 0) {
    return (
      <div
        className="rounded-sm border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 flex items-center justify-center p-8 text-center"
        style={{ minHeight: 320 }}
      >
        <div>
          <p className="font-serif italic text-stone-600 dark:text-stone-400 mb-2">
            No issues reported yet in your area.
          </p>
          <p className="font-serif italic text-sm text-stone-500 dark:text-stone-500">
            Be the first to report something nearby.
          </p>
        </div>
      </div>
    );
  }

  return <ReportsMap reports={reports} />;
}
