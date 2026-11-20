"use client";

import dynamic from "next/dynamic";

const ReportDetailMap = dynamic(
  () => import("@/components/ReportDetailMap"),
  {
    ssr: false,
    loading: () => (
      <div
        className="rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-900 animate-pulse"
        style={{ height: 320 }}
      />
    ),
  }
);

export default function ReportDetailMapWrapper({ report }) {
  return <ReportDetailMap report={report} />;
}
