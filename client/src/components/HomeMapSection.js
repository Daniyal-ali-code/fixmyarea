"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const ReportsMap = dynamic(() => import("./ReportsMap"), {
  ssr: false,
  loading: () => (
    <div className="map-home rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-900 animate-pulse" />
  ),
});

export default function HomeMapSection() {
  const [reports, setReports] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/reports", { credentials: "include" });
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
      <div className="rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950 p-4 text-red-800 dark:text-red-200 text-sm">
        Could not load map: {error}
      </div>
    );
  }

  if (reports === null) {
    return (
      <div className="map-home rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-900 animate-pulse flex items-center justify-center">
        <span className="text-slate-500 dark:text-zinc-500">
          Loading map…
        </span>
      </div>
    );
  }

    if (reports.length === 0) {
    return (
      <div className="map-home rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-center p-8 text-center">
        <div>
          <p className="text-slate-600 dark:text-slate-400 mb-2">
            No issues reported yet in your area.
          </p>
          <p className="text-sm text-slate-500 dark:text-zinc-500">
            Be the first to report something nearby.
          </p>
        </div>
      </div>
    );
  }

  return <ReportsMap reports={reports} />;
}
