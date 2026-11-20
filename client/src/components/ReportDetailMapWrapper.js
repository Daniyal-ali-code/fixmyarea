"use client";

import dynamic from "next/dynamic";

const ReportDetailMap = dynamic(
  () => import("@/components/ReportDetailMap"),
  {
    ssr: false,
    loading: () => (
      <div
        className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] animate-pulse"
        style={{ height: 320 }}
      />
    ),
  }
);

export default function ReportDetailMapWrapper({ report }) {
  return <ReportDetailMap report={report} />;
}
