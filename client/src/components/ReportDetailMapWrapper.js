"use client";

import dynamic from "next/dynamic";

const ReportDetailMap = dynamic(
  () => import("@/components/ReportDetailMap"),
  {
    ssr: false,
    loading: () => (
      <div
        className="rounded-sm border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 animate-pulse"
        style={{ height: 320 }}
      />
    ),
  }
);

export default function ReportDetailMapWrapper({ report }) {
  return <ReportDetailMap report={report} />;
}
