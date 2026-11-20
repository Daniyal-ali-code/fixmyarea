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
              ? "bg-[var(--accent)]"
              : "bg-[var(--border)]"
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
      className="block bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 hover:shadow-md hover:border-[var(--accent)] dark:hover:border-[var(--accent)] transition"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="text-xs uppercase tracking-wider text-[var(--foreground-muted)]">
          {report.category_name}
        </span>
        <StatusBadge status={report.status} />
      </div>

      <h3 className="text-xl font-bold text-[var(--foreground)] mb-2 leading-tight">
        {report.title}
      </h3>
      <p className="text-sm text-[var(--foreground)] mb-3 line-clamp-2 leading-relaxed">
        {report.description}
      </p>

      {report.address && (
        <p className="text-xs text-[var(--foreground-muted)] mb-3 flex items-center gap-1">
          <PinIcon className="w-3.5 h-3.5 flex-shrink-0" /> {report.address}
        </p>
      )}

      <div className="flex items-center justify-between mb-3">
        <SeverityDots severity={report.severity} />
        <span className="text-xs text-[var(--foreground-muted)] font-medium uppercase tracking-wider">
          Severity {report.severity}/5
        </span>
      </div>

      <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--foreground-muted)]">
        <span >
          By {report.reporter_name || "Anonymous"}
        </span>
        <span className="font-semibold">{report.support_count} supports</span>
      </div>
    </Link>
  );
}
