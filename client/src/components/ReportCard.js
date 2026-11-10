import Link from "next/link";

const statusStyles = {
  reported:
    "bg-blue-50 text-blue-900 border-blue-300 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800",
  under_review:
    "bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800",
  in_progress:
    "bg-orange-50 text-orange-900 border-orange-300 dark:bg-orange-950 dark:text-orange-200 dark:border-orange-800",
  resolved:
    "bg-slate-50 text-slate-900 border-slate-300 dark:bg-slate-950 dark:text-slate-200 dark:border-slate-700",
};

const statusLabels = {
  reported: "Reported",
  under_review: "Under Review",
  in_progress: "In Progress",
  resolved: "Resolved",
};

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
        <span
          className={`px-2 py-0.5 text-xs font-semibold uppercase tracking-wider border rounded-sm ${
            statusStyles[report.status] || statusStyles.reported
          }`}
        >
          {statusLabels[report.status] || report.status}
        </span>
      </div>

      <h3 className="font-serif text-xl font-bold text-stone-900 dark:text-stone-50 mb-2 leading-tight">
        {report.title}
      </h3>
      <p className="text-sm text-stone-700 dark:text-stone-300 mb-3 line-clamp-2 leading-relaxed">
        {report.description}
      </p>

      {report.address && (
        <p className="text-xs text-stone-600 dark:text-stone-400 mb-3 font-serif italic">
          📍 {report.address}
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
