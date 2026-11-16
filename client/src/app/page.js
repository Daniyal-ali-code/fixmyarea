import { Suspense } from "react";
import Link from "next/link";
import ReportCard from "@/components/ReportCard";
import AdminRedirectGuard from "@/components/AdminRedirectGuard";
import HomeMapSection from "@/components/HomeMapSection";
import { Stagger } from "@/components/Motion";
import {
  PageHero,
  ReportsSkeleton,
  ErrorState,
  EmptyState,
  StatusBadge,
  btnPrimary,
  btnSecondary,
  textLinkClass,
} from "@/components/ui";
import { query } from "@/lib/db";

async function RecentReports() {
  let reports = [];
  let loadError = false;
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
    loadError = true;
  }

  if (loadError) {
    return <ErrorState>Could not load reports — try again.</ErrorState>;
  }

  if (reports.length === 0) {
    return (
      <EmptyState>No reports yet. Be the first to report an issue!</EmptyState>
    );
  }

  return (
    <Stagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {reports.map((report) => (
        <ReportCard key={report.id} report={report} />
      ))}
    </Stagger>
  );
}

export default function HomePage() {
  return (
    <AdminRedirectGuard>
      <main className="min-h-screen bg-amber-50 dark:bg-stone-900">
        <PageHero
          center
          eyebrow="Established for the Community"
          title={
            <>
              Report issues in
              <br />
              <span className="italic">your area</span>
            </>
          }
          sub="Help make your community better. Report potholes, broken streetlights, garbage, and other local issues — then track their progress."
        >
          <div className="flex items-center justify-center gap-4 flex-wrap mt-10">
            <Link href="/reports/new" className={btnPrimary}>
              + Report an Issue
            </Link>
            <Link href="/reports" className={btnSecondary}>
              Browse Reports
            </Link>
          </div>
        </PageHero>

        <section className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-baseline justify-between mb-6 pb-2 border-b-2 border-amber-600">
            <h2 className="font-serif text-3xl font-bold text-stone-900 dark:text-stone-50">
              Issues Near You
            </h2>
            <Link href="/reports" className={textLinkClass}>
              View all →
            </Link>
          </div>
          <HomeMapSection />
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs font-serif italic text-stone-500 dark:text-stone-500 mr-1">
              Pin colors:
            </span>
            <StatusBadge status="reported" />
            <StatusBadge status="under_review" />
            <StatusBadge status="in_progress" />
            <StatusBadge status="resolved" />
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-baseline justify-between mb-8 pb-2 border-b-2 border-amber-600">
            <h2 className="font-serif text-3xl font-bold text-stone-900 dark:text-stone-50">
              Recent Reports
            </h2>
            <Link href="/reports" className={textLinkClass}>
              View all →
            </Link>
          </div>

          <Suspense fallback={<ReportsSkeleton count={3} />}>
            <RecentReports />
          </Suspense>
        </section>
      </main>
    </AdminRedirectGuard>
  );
}
