import { Suspense } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import ReportCard from "@/components/ReportCard";
import { query } from "@/lib/db";

async function RecentReports() {
  let reports = [];
  try {
    const { rows } = await query(
      `SELECT
         r.id, r.title, r.description, r.latitude, r.longitude,
         r.severity, r.status, r.priority_score, r.created_at,
         r.category_id, c.name AS category_name,
         u.name AS reporter_name,
         (SELECT COUNT(*)::int FROM supports s WHERE s.report_id = r.id) AS support_count
       FROM reports r
       JOIN categories c ON c.id = r.category_id
       JOIN users u      ON u.id = r.user_id
       ORDER BY r.priority_score DESC, r.created_at DESC
       LIMIT 6`
    );
    reports = rows;
  } catch (err) {
    console.error("Failed to load reports:", err);
  }

  if (reports.length === 0) {
    return (
      <div className="bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-sm p-12 text-center font-serif italic text-stone-600 dark:text-stone-400">
        No reports yet. Be the first to report an issue!
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {reports.map((report) => (
        <ReportCard key={report.id} report={report} />
      ))}
    </div>
  );
}

function ReportsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((n) => (
        <div
          key={n}
          className="bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-sm p-5 animate-pulse"
        >
          <div className="h-3 w-20 bg-stone-200 dark:bg-stone-700 rounded mb-4" />
          <div className="h-5 w-full bg-stone-200 dark:bg-stone-700 rounded mb-2" />
          <div className="h-4 w-3/4 bg-stone-200 dark:bg-stone-700 rounded mb-4" />
          <div className="h-3 w-1/3 bg-stone-200 dark:bg-stone-700 rounded" />
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <Header />

      <main className="min-h-screen bg-amber-50 dark:bg-stone-900">
        <section className="bg-amber-50 dark:bg-stone-900 border-b border-stone-400 dark:border-stone-700">
          <div className="max-w-4xl mx-auto px-4 py-20 text-center">
            <div className="inline-block mb-6">
              <span className="font-serif italic text-xs uppercase tracking-[0.3em] text-stone-600 dark:text-stone-400 border-b border-stone-400 dark:border-stone-600 pb-1">
                Established for the Community
              </span>
            </div>
            <h1 className="font-serif text-5xl md:text-6xl font-bold text-stone-900 dark:text-stone-50 mb-6 leading-tight">
              Report issues in
              <br />
              <span className="italic">your area</span>
            </h1>
            <p className="font-serif italic text-lg text-stone-700 dark:text-stone-300 mb-10 max-w-xl mx-auto leading-relaxed">
              Help make your community better. Report potholes, broken
              streetlights, garbage, and other local issues — then track their
              progress.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link
                href="/reports/new"
                className="inline-block px-6 py-3 text-xs font-semibold uppercase tracking-wider text-amber-50 bg-slate-800 dark:bg-slate-700 rounded-sm hover:bg-slate-900 dark:hover:bg-slate-600 transition border border-slate-900 dark:border-slate-500"
              >
                + Report an Issue
              </Link>
              <Link
                href="/reports"
                className="inline-block px-6 py-3 text-xs font-semibold uppercase tracking-wider text-stone-900 dark:text-stone-100 bg-amber-50 dark:bg-stone-800 rounded-sm hover:bg-amber-100 dark:hover:bg-stone-700 transition border border-stone-400 dark:border-stone-600"
              >
                Browse Reports
              </Link>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-baseline justify-between mb-8 pb-2 border-b border-stone-400 dark:border-stone-700">
            <h2 className="font-serif text-3xl font-bold text-stone-900 dark:text-stone-50">
              Recent Reports
            </h2>
            <Link
              href="/reports"
              className="font-serif italic text-sm text-slate-800 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300"
            >
              View all →
            </Link>
          </div>

          <Suspense fallback={<ReportsSkeleton />}>
            <RecentReports />
          </Suspense>
        </section>
      </main>

      <footer className="bg-slate-900 dark:bg-slate-950 text-amber-50 py-6 border-t-4 border-amber-600">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="font-serif italic text-sm">
            FixMyArea · Built for communities
          </p>
        </div>
      </footer>
    </>
  );
}
