import { notFound } from "next/navigation";
import Link from "next/link";
import { query } from "@/lib/db";
import { parseIdParam } from "@/lib/http";

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

async function getPublicProfile(userId) {
  try {
    const [userRes, statsRes, reportsRes] = await Promise.all([
      query("SELECT id, name, created_at FROM users WHERE id = $1", [userId]),
      query(
        `SELECT
           (SELECT COUNT(*)::int FROM reports WHERE user_id = $1) AS total_reports,
           (SELECT COUNT(*)::int FROM reports WHERE user_id = $1 AND status = 'resolved') AS resolved_reports,
           (SELECT COUNT(*)::int FROM supports WHERE user_id = $1) AS total_supports_given
         `,
        [userId]
      ),
      query(
        `SELECT
           r.id, r.title, r.status, r.created_at,
           c.name AS category_name
         FROM reports r
         JOIN categories c ON c.id = r.category_id
         WHERE r.user_id = $1
         ORDER BY r.created_at DESC
         LIMIT 20`,
        [userId]
      ),
    ]);

    if (userRes.rows.length === 0) return null;

    return {
      user: userRes.rows[0],
      stats: statsRes.rows[0],
      reports: reportsRes.rows,
    };
  } catch (err) {
    console.error("getPublicProfile error:", err);
    return null;
  }
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

export default async function PublicProfilePage({ params }) {
  const { id } = await params;
  const userId = parseIdParam(id);
  if (userId === null) notFound();

  const profile = await getPublicProfile(userId);
  if (!profile) notFound();

  const { user, stats, reports } = profile;

  return (
    <>
      <main className="min-h-screen bg-amber-50 dark:bg-stone-900">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Link
            href="/reports"
            className="font-serif italic text-sm text-slate-800 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-500 underline underline-offset-2 inline-block mb-6"
          >
            ← Back to reports
          </Link>

          <div className="bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-sm p-6 md:p-8 mb-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-16 w-16 rounded-full bg-amber-600 dark:bg-amber-500 flex items-center justify-center text-stone-50 font-serif font-bold text-xl flex-shrink-0">
                {initials(user.name)}
              </div>
              <div>
                <h1 className="font-serif text-2xl md:text-3xl font-bold text-stone-900 dark:text-stone-50">
                  {user.name}
                </h1>
                <p className="font-serif italic text-sm text-stone-600 dark:text-stone-400 mt-1">
                  Member since {formatDate(user.created_at)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-stone-300 dark:border-stone-700">
              <div>
                <p className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-50">
                  {stats.total_reports}
                </p>
                <p className="text-xs uppercase tracking-wider text-stone-500 dark:text-stone-500 font-semibold mt-1">
                  Reports
                </p>
              </div>
              <div>
                <p className="font-serif text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                  {stats.resolved_reports}
                </p>
                <p className="text-xs uppercase tracking-wider text-stone-500 dark:text-stone-500 font-semibold mt-1">
                  Resolved
                </p>
              </div>
              <div>
                <p className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-50">
                  {stats.total_supports_given}
                </p>
                <p className="text-xs uppercase tracking-wider text-stone-500 dark:text-stone-500 font-semibold mt-1">
                  Supports
                </p>
              </div>
            </div>
          </div>

          <div className="bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-sm p-6 md:p-8">
            <h2 className="font-serif text-xl font-bold text-stone-900 dark:text-stone-50 mb-4 pb-2 border-b-2 border-amber-600">
              Reported Issues
            </h2>

            {reports.length === 0 ? (
              <p className="font-serif italic text-sm text-stone-600 dark:text-stone-400">
                No reports yet.
              </p>
            ) : (
              <ul className="divide-y divide-stone-200 dark:divide-stone-700">
                {reports.map((r) => (
                  <li key={r.id} className="py-3">
                    <Link
                      href={`/reports/${r.id}`}
                      className="group flex items-start justify-between gap-4"
                    >
                      <div className="flex-1">
                        <p className="font-serif text-base text-stone-900 dark:text-stone-50 group-hover:text-amber-700 dark:group-hover:text-amber-500 transition">
                          {r.title}
                        </p>
                        <p className="text-xs text-stone-500 dark:text-stone-500 mt-1">
                          {r.category_name} · {formatDate(r.created_at)}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-[10px] font-semibold uppercase tracking-wider border rounded-sm flex-shrink-0 ${
                          statusStyles[r.status] || statusStyles.reported
                        }`}
                      >
                        {statusLabels[r.status] || r.status}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {stats.total_reports > reports.length && (
              <p className="font-serif italic text-xs text-stone-500 dark:text-stone-500 mt-4 pt-4 border-t border-stone-300 dark:border-stone-700">
                Showing {reports.length} of {stats.total_reports} reports
              </p>
            )}
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
