import Link from "next/link";
import Header from "@/components/Header";
import ReportCard from "@/components/ReportCard";
import { query } from "@/lib/db";

async function getRecentReports() {
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
    return rows;
  } catch (err) {
    console.error("Failed to load reports:", err);
    return [];
  }
}

export default async function HomePage() {
  const reports = await getRecentReports();

  return (
    <>
      <Header />

      <main className="min-h-screen bg-gray-50">
        {/* Hero */}
        <section className="bg-gradient-to-br from-blue-50 to-blue-100 border-b border-blue-200">
          <div className="max-w-6xl mx-auto px-4 py-20 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Report issues in your area
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Help make your community better. Report potholes, broken streetlights,
              garbage, and other local issues — then track their progress.
            </p>
            <Link
              href="/reports/new"
              className="inline-block px-8 py-3 text-base font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
            >
              + Report an Issue
            </Link>
          </div>
        </section>

        {/* Recent Reports */}
        <section className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Recent Reports</h2>
            <Link
              href="/reports"
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              View all →
            </Link>
          </div>

          {reports.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-gray-500">
              No reports yet. Be the first to report an issue!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
