import { notFound } from "next/navigation";
import Link from "next/link";
import SupportButton from "@/components/SupportButton";
import ReportImage from "@/components/ReportImage";
import ReportDetailMapWrapper from "@/components/ReportDetailMapWrapper";
import {
  StatusBadge,
  PinIcon,
  CheckIcon,
  textLinkClass,
} from "@/components/ui";
import { STATUS_LABELS, STATUS_ORDER } from "@/lib/status";
import { query } from "@/lib/db";
import { getSupporters } from "@/lib/supporters.service";

async function getReport(id) {
  try {
    const { rows } = await query(
      `SELECT
         r.*,
         c.name AS category_name, c.icon AS category_icon,
         u.name AS reporter_name,
         resolver.name AS resolver_name,
         (SELECT COUNT(*)::int FROM supports s WHERE s.report_id = r.id) AS support_count
       FROM reports r
       JOIN categories c ON c.id = r.category_id
       JOIN users u      ON u.id = r.user_id
       LEFT JOIN users resolver ON resolver.id = r.resolved_by
       WHERE r.id = $1`,
      [id]
    );
    return rows[0] || null;
  } catch (err) {
    console.error("Failed to load report:", err);
    return null;
  }
}

async function getStatusHistory(reportId) {
  try {
    const { rows } = await query(
      `SELECT old_status, new_status, created_at
       FROM status_history
       WHERE report_id = $1
       ORDER BY created_at ASC`,
      [reportId]
    );
    return rows;
  } catch (err) {
    return [];
  }
}

async function getImages(reportId) {
  try {
    const { rows } = await query(
      "SELECT id, url FROM report_images WHERE report_id = $1 ORDER BY id",
      [reportId]
    );
    return rows;
  } catch (err) {
    return [];
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

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

export default async function ReportDetailPage({ params }) {
  const { id } = await params;
  const report = await getReport(id);

  if (!report) {
    notFound();
  }

  const history = await getStatusHistory(id);
  const images = await getImages(id);
  const { supporters, total: supporterTotal } = await getSupporters(id);

  const timeline = [
    { status: "reported", at: report.created_at, label: "Reported" },
    ...history.map((h) => ({
      status: h.new_status,
      at: h.created_at,
      label: STATUS_LABELS[h.new_status] || h.new_status,
    })),
  ];

  const currentStatusIndex = STATUS_ORDER.indexOf(report.status);
  const isResolved = report.status === "resolved";
  const hasResolutionProof =
    isResolved && (report.resolution_note || report.resolution_image_url);

  return (
    <main className="min-h-screen bg-white dark:bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link
            href="/reports"
            className={`${textLinkClass} mb-6`}
          >
            ← Back to reports
          </Link>

          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 md:p-8 mb-6">
            <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
              <span className="text-xs uppercase tracking-[0.3em] text-slate-600 dark:text-slate-400">
                {report.category_name}
              </span>
              <StatusBadge status={report.status} large />
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-50 mb-4 leading-tight">
              {report.title}
            </h1>

            <div className="flex items-center gap-4 flex-wrap mb-6">
              <div className="flex items-center gap-2">
                <SeverityDots severity={report.severity} />
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium uppercase tracking-wider">
                  Severity {report.severity}/5
                </span>
              </div>
              <span className="text-slate-400 dark:text-slate-600">·</span>
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium uppercase tracking-wider">
                {report.support_count}{" "}
                {report.support_count === 1 ? "support" : "supports"}
              </span>
            </div>

            <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed mb-6 whitespace-pre-wrap">
              {report.description}
            </p>

            {images.length > 0 && (
              <div className="mb-6">
                <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-zinc-500 font-semibold mb-2">
                  Photos ({images.length})
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {images.map((img) => (
                    <a
                      key={img.id}
                      href={img.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block aspect-square bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden hover:border-indigo-600 dark:hover:border-indigo-500 transition"
                    >
                      <ReportImage
                        src={img.url}
                        alt="Report photo"
                        className="w-full h-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-zinc-500 font-semibold mb-1">
                  Reported by
                </p>
                <Link
                  href={`/users/${report.user_id}`}
                  className="text-base text-slate-900 dark:text-slate-50 hover:text-indigo-700 dark:hover:text-slate-500 underline underline-offset-2"
                >
                  {report.reporter_name}
                </Link>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-zinc-500 font-semibold mb-1">
                  Reported on
                </p>
                <p className="text-base text-slate-900 dark:text-slate-50">
                  {formatDate(report.created_at)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 md:p-8 mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-4 pb-2 border-b-2 border-indigo-600">
              Location
            </h2>
            {report.address && (
              <p className="text-base text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-1.5">
                <PinIcon className="w-4 h-4 flex-shrink-0" /> {report.address}
              </p>
            )}
            <ReportDetailMapWrapper report={report} />
            <p className="font-mono text-xs text-slate-600 dark:text-slate-400 mt-3 text-center">
              {report.latitude}, {report.longitude}
            </p>
          </div>

          {hasResolutionProof && (
            <div className="bg-white dark:bg-zinc-900 border-2 border-emerald-600 dark:border-emerald-500 rounded-xl p-6 md:p-8 mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-4 pb-2 border-b-2 border-emerald-600 flex items-center gap-2">
                <CheckIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
                Resolution Proof
              </h2>

              {report.resolution_image_url && (
                <a
                  href={report.resolution_image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden mb-4 hover:border-emerald-600 dark:hover:border-emerald-500 transition"
                >
                  <ReportImage
                    src={report.resolution_image_url}
                    alt="Proof of fix"
                    className="w-full max-h-96 object-contain"
                  />
                </a>
              )}

              {report.resolution_note && (
                <blockquote className="text-base text-slate-800 dark:text-slate-200 leading-relaxed mb-4 pl-4 border-l-4 border-emerald-600 dark:border-emerald-500 whitespace-pre-wrap">
                  &ldquo;{report.resolution_note}&rdquo;
                </blockquote>
              )}

              <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-400">
                {report.resolver_name && (
                  <span >
                    Fixed by{" "}
                    <strong className="not-text-slate-900 dark:text-slate-100">
                      {report.resolver_name}
                    </strong>
                  </span>
                )}
                {report.resolved_at && (
                  <span >
                    Resolved on {formatDate(report.resolved_at)}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 md:p-8 mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-6 pb-2 border-b-2 border-indigo-600">
              Status Timeline
            </h2>
            <div className="space-y-4">
              {STATUS_ORDER.map((step, idx) => {
                const reached = idx <= currentStatusIndex;
                const isCurrent = idx === currentStatusIndex;
                const timelineEntry = timeline.find((t) => t.status === step);
                const date = timelineEntry ? formatDate(timelineEntry.at) : null;

                return (
                  <div key={step} className="flex items-start gap-3">
                    <div
                      className={`mt-1 h-3 w-3 rounded-full flex-shrink-0 ${
                        reached
                          ? "bg-indigo-600 dark:bg-indigo-500"
                          : "bg-slate-300 dark:bg-zinc-700"
                      } ${isCurrent ? "ring-4 ring-indigo-500/20" : ""}`}
                    />
                    <div className="flex-1">
                      <p
                        className={`text-base ${
                          reached
                            ? "text-slate-900 dark:text-slate-50 font-semibold"
                            : "text-slate-500 dark:text-zinc-500"
                        }`}
                      >
                        {STATUS_LABELS[step]}
                      </p>
                      {date && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                          {date}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {!isResolved ? (
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 md:p-8 text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Does this issue affect you too?
              </p>
              <SupportButton
                reportId={report.id}
                initialCount={report.support_count}
              />

              {supporterTotal > 0 && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-700 dark:hover:text-slate-500 select-none">
                    See who supports this ({supporterTotal})
                  </summary>
                  <ul className="mt-3 space-y-1.5 pl-4 border-l-2 border-slate-200 dark:border-zinc-800">
                    {supporters.map((s) => (
                      <li key={s.id}>
                        <Link
                          href={`/users/${s.id}`}
                          className="text-sm text-slate-700 dark:text-slate-300 hover:text-indigo-700 dark:hover:text-slate-500 underline underline-offset-2"
                        >
                          {s.name}
                        </Link>
                      </li>
                    ))}
                    {supporterTotal > supporters.length && (
                      <li className="text-xs text-slate-500 dark:text-zinc-500 pt-1">
                        and {supporterTotal - supporters.length} more
                      </li>
                    )}
                  </ul>
                </details>
              )}
            </div>
          ) : (
            <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 rounded-xl p-6 md:p-8 text-center">
              <p className="text-sm text-emerald-800 dark:text-emerald-200">
                This issue has been resolved. Thank you for your support.
              </p>
            </div>
          )}
        </div>
      </main>
  );
}
