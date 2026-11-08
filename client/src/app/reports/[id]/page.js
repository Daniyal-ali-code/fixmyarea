import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import SupportButton from "@/components/SupportButton";
import { query } from "@/lib/db";

const statusLabels = {
  reported: "Reported",
  under_review: "Under Review",
  in_progress: "In Progress",
  resolved: "Resolved",
};

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

const STATUS_ORDER = ["reported", "under_review", "in_progress", "resolved"];

async function getReport(id) {
  try {
    const { rows } = await query(
      `SELECT
         r.*,
         c.name AS category_name, c.icon AS category_icon,
         u.name AS reporter_name,
         (SELECT COUNT(*)::int FROM supports s WHERE s.report_id = r.id) AS support_count
       FROM reports r
       JOIN categories c ON c.id = r.category_id
       JOIN users u      ON u.id = r.user_id
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
              ? "bg-amber-600 dark:bg-amber-500"
              : "bg-stone-200 dark:bg-stone-700"
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

  const timeline = [
    { status: "reported", at: report.created_at, label: "Reported" },
    ...history.map((h) => ({
      status: h.new_status,
      at: h.created_at,
      label: statusLabels[h.new_status] || h.new_status,
    })),
  ];

  const currentStatusIndex = STATUS_ORDER.indexOf(report.status);

  return (
    <>
      <Header />

      <main className="min-h-screen bg-amber-50 dark:bg-stone-900">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link
            href="/reports"
            className="font-serif italic text-sm text-slate-800 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-500 underline underline-offset-2 inline-block mb-6"
          >
            ← Back to reports
          </Link>

          <div className="bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-sm p-6 md:p-8 mb-6">
            <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
              <span className="font-serif italic text-xs uppercase tracking-[0.2em] text-stone-600 dark:text-stone-400">
                {report.category_name}
              </span>
              <span
                className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider border rounded-sm ${
                  statusStyles[report.status] || statusStyles.reported
                }`}
              >
                {statusLabels[report.status] || report.status}
              </span>
            </div>

            <h1 className="font-serif text-3xl md:text-4xl font-bold text-stone-900 dark:text-stone-50 mb-4 leading-tight">
              {report.title}
            </h1>

            <div className="flex items-center gap-4 flex-wrap mb-6">
              <div className="flex items-center gap-2">
                <SeverityDots severity={report.severity} />
                <span className="text-xs text-stone-600 dark:text-stone-400 font-medium uppercase tracking-wider">
                  Severity {report.severity}/5
                </span>
              </div>
              <span className="text-stone-400 dark:text-stone-600">·</span>
              <span className="text-xs text-stone-600 dark:text-stone-400 font-medium uppercase tracking-wider">
                {report.support_count} {report.support_count === 1 ? "support" : "supports"}
              </span>
            </div>

            <p className="text-base text-stone-700 dark:text-stone-300 leading-relaxed mb-6 whitespace-pre-wrap">
              {report.description}
            </p>

            <div className="pt-4 border-t border-stone-300 dark:border-stone-700 flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-stone-500 dark:text-stone-500 font-semibold mb-1">
                  Reported by
                </p>
                <p className="font-serif italic text-base text-stone-900 dark:text-stone-50">
                  {report.reporter_name}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wider text-stone-500 dark:text-stone-500 font-semibold mb-1">
                  Reported on
                </p>
                <p className="font-serif italic text-base text-stone-900 dark:text-stone-50">
                  {formatDate(report.created_at)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-sm p-6 md:p-8 mb-6">
            <h2 className="font-serif text-xl font-bold text-stone-900 dark:text-stone-50 mb-4 pb-2 border-b-2 border-amber-600">
              Location
            </h2>
            <div className="bg-amber-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-sm p-6 text-center">
              <p className="font-serif italic text-sm text-stone-600 dark:text-stone-400 mb-2">
                Coordinates
              </p>
              <p className="font-mono text-base text-stone-900 dark:text-stone-50">
                {report.latitude}, {report.longitude}
              </p>
              <p className="font-serif italic text-xs text-stone-500 dark:text-stone-500 mt-3">
                Interactive map coming in Phase 6e
              </p>
            </div>
          </div>

          <div className="bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-sm p-6 md:p-8 mb-6">
            <h2 className="font-serif text-xl font-bold text-stone-900 dark:text-stone-50 mb-6 pb-2 border-b-2 border-amber-600">
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
                          ? "bg-amber-600 dark:bg-amber-500"
                          : "bg-stone-300 dark:bg-stone-700"
                      } ${isCurrent ? "ring-4 ring-amber-600/20" : ""}`}
                    />
                    <div className="flex-1">
                      <p
                        className={`font-serif text-base ${
                          reached
                            ? "text-stone-900 dark:text-stone-50 font-semibold"
                            : "text-stone-500 dark:text-stone-500"
                        }`}
                      >
                        {statusLabels[step]}
                      </p>
                      {date && (
                        <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                          {date}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-sm p-6 md:p-8 text-center">
            <p className="font-serif italic text-sm text-stone-600 dark:text-stone-400 mb-4">
              Does this issue affect you too?
            </p>
            <SupportButton
              reportId={report.id}
              initialCount={report.support_count}
            />
          </div>
        </div>
      </main>

      <footer className="bg-slate-900 dark:bg-slate-950 text-amber-50 py-6 border-t-4 border-amber-600 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="font-serif italic text-sm">
            FixMyArea · Built for communities
          </p>
        </div>
      </footer>
    </>
  );
}
