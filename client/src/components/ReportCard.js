import Link from "next/link";
import { StatusBadge, PinIcon } from "@/components/ui";

function SeverityDots({ severity }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`h-2 w-2 rounded-full ${
            n <= severity
              ? "bg-indigo-600 dark:bg-indigo-500"
              : "bg-slate-200 dark:bg-zinc-700"
          }`}
        />
      ))}
    </div>
  );
}

export default function ReportCard({ report }) {
  return (
    <Link
      href={`/reports/${report.id}`}
      className="block bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 hover:shadow-md hover:border-indigo-600 dark:hover:border-indigo-500 transition"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400">
          {report.category_name}
        </span>
        <StatusBadge status={report.status} />
      </div>

      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-2 leading-tight">
        {report.title}
      </h3>
      <p className="text-sm text-slate-700 dark:text-slate-300 mb-3 line-clamp-2 leading-relaxed">
        {report.description}
      </p>

      {report.address && (
        <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 flex items-center gap-1">
          <PinIcon className="w-3.5 h-3.5 flex-shrink-0" /> {report.address}
        </p>
      )}

      <div className="flex items-center justify-between mb-3">
        <SeverityDots severity={report.severity} />
        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium uppercase tracking-wider">
          Severity {report.severity}/5
        </span>
      </div>

      <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
        <span >
          By {report.reporter_name || "Anonymous"}
        </span>
        <span className="font-semibold">{report.support_count} supports</span>
      </div>
    </Link>
  );
}
