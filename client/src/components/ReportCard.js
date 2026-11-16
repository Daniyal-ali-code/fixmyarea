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
              ? "bg-amber-600 dark:bg-amber-500"
              : "bg-stone-200 dark:bg-stone-700"
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
      className="block bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-sm p-5 hover:shadow-md hover:border-amber-600 dark:hover:border-amber-500 transition"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="font-serif italic text-xs uppercase tracking-wider text-stone-600 dark:text-stone-400">
          {report.category_name}
        </span>
        <StatusBadge status={report.status} />
      </div>

      <h3 className="font-serif text-xl font-bold text-stone-900 dark:text-stone-50 mb-2 leading-tight">
        {report.title}
      </h3>
      <p className="text-sm text-stone-700 dark:text-stone-300 mb-3 line-clamp-2 leading-relaxed">
        {report.description}
      </p>

      {report.address && (
        <p className="text-xs text-stone-600 dark:text-stone-400 mb-3 font-serif italic flex items-center gap-1">
          <PinIcon className="w-3.5 h-3.5 flex-shrink-0" /> {report.address}
        </p>
      )}

      <div className="flex items-center justify-between mb-3">
        <SeverityDots severity={report.severity} />
        <span className="text-xs text-stone-600 dark:text-stone-400 font-medium uppercase tracking-wider">
          Severity {report.severity}/5
        </span>
      </div>

      <div className="pt-3 border-t border-stone-300 dark:border-stone-700 flex items-center justify-between text-xs text-stone-600 dark:text-stone-400">
        <span className="font-serif italic">
          By {report.reporter_name || "Anonymous"}
        </span>
        <span className="font-semibold">{report.support_count} supports</span>
      </div>
    </Link>
  );
}
