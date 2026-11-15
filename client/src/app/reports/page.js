import { Suspense } from "react";
import Link from "next/link";
import ReportCard from "@/components/ReportCard";
import { query } from "@/lib/db";

const STATUS_VALUES = ["reported", "under_review", "in_progress", "resolved"];

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "reported", label: "Reported" },
  { value: "under_review", label: "Under Review" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
];

// Hardcoded only as a fallback if the categories table cannot be read.
const FALLBACK_CATEGORIES = [
  { id: 1, name: "Road" },
  { id: 2, name: "Garbage" },
  { id: 3, name: "Water" },
  { id: 4, name: "Streetlight" },
  { id: 5, name: "Other" },
];

async function getCategories() {
  try {
    const { rows } = await query(
      "SELECT id, name FROM categories ORDER BY id"
    );
    if (rows.length > 0) return rows;
  } catch (err) {
    console.error("Failed to load categories:", err);
  }
  return FALLBACK_CATEGORIES;
}

async function getReports(status, category_id) {
  try {
    const conditions = [];
    const params = [];

    if (status) {
      params.push(status);
      conditions.push(`r.status = $${params.length}`);
    }
    if (category_id) {
      params.push(category_id);
      conditions.push(`r.category_id = $${params.length}`);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

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
       ${whereClause}
       ORDER BY r.priority_score DESC, r.created_at DESC
       LIMIT 100`,
      params
    );
    return { reports: rows, error: false };
  } catch (err) {
    console.error("Failed to load reports:", err);
    return { reports: [], error: true };
  }
}

async function ReportsList({ status, category_id }) {
  const { reports, error } = await getReports(status, category_id);

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-800 rounded-sm p-12 text-center">
        <p className="font-serif italic text-lg text-red-800 dark:text-red-200">
          Could not load reports — try again.
        </p>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-sm p-12 text-center">
        <p className="font-serif italic text-lg text-stone-600 dark:text-stone-400 mb-4">
          No reports match these filters.
        </p>
        <Link
          href="/reports"
          className="font-serif italic text-sm text-slate-800 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-500 underline underline-offset-2 decoration-amber-600/40 hover:decoration-amber-600 transition"
        >
          Clear filters
        </Link>
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
      {[1, 2, 3, 4, 5, 6].map((n) => (
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

export default async function ReportsPage({ searchParams }) {
  const params = await searchParams;
  const categories = await getCategories();

  // Invalid filter values are ignored (treated as no filter) so the
  // full list shows instead of a misleading empty state.
  const rawStatus = params.status || "";
  const rawCategory = params.category_id || "";
  const status = STATUS_VALUES.includes(rawStatus) ? rawStatus : "";
  const category_id =
    /^\d+$/.test(rawCategory) &&
    categories.some((c) => String(c.id) === rawCategory)
      ? rawCategory
      : "";

  const categoryOptions = [
    { value: "", label: "All" },
    ...categories.map((c) => ({ value: String(c.id), label: c.name })),
  ];

  function buildFilterUrl(newStatus, newCategory) {
    const p = new URLSearchParams();
    if (newStatus) p.set("status", newStatus);
    if (newCategory) p.set("category_id", newCategory);
    const qs = p.toString();
    return qs ? `/reports?${qs}` : "/reports";
  }

  return (
    <>

      <main className="min-h-screen bg-amber-50 dark:bg-stone-900">
        <section className="bg-gradient-to-br from-[#fef3c7] via-amber-50 to-amber-50 dark:from-stone-800 dark:via-stone-900 dark:to-stone-900 border-b border-stone-400 dark:border-stone-700">
          <div className="max-w-6xl mx-auto px-4 py-12">
            <p className="font-serif italic text-xs uppercase tracking-[0.3em] text-stone-600 dark:text-stone-400 mb-2 border-b-2 border-amber-600 pb-1 inline-block">
              Community Reports
            </p>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-stone-900 dark:text-stone-50 mt-3 mb-4">
              All reports
            </h1>
            <p className="font-serif italic text-lg text-stone-700 dark:text-stone-300 max-w-xl">
              Every issue reported by your community. Filter by status or
              category to see what matters to you.
            </p>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-8">
          {/* Filters */}
          <div className="bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-sm p-4 mb-8 space-y-4">
            {/* Status filters */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-2">
                Status
              </p>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((opt) => {
                  const isActive = status === opt.value;
                  return (
                    <Link
                      key={opt.value}
                      href={buildFilterUrl(opt.value, category_id)}
                      className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-sm border transition ${
                        isActive
                          ? "bg-amber-600 text-stone-900 border-amber-700 shadow-sm shadow-amber-600/30"
                          : "bg-amber-50 dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-400 dark:border-stone-600 hover:border-amber-600 dark:hover:border-amber-500"
                      }`}
                    >
                      {opt.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Category filters */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-2">
                Category
              </p>
              <div className="flex flex-wrap gap-2">
                {categoryOptions.map((opt) => {
                  const isActive = category_id === opt.value;
                  return (
                    <Link
                      key={opt.value}
                      href={buildFilterUrl(status, opt.value)}
                      className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-sm border transition ${
                        isActive
                          ? "bg-amber-600 text-stone-900 border-amber-700 shadow-sm shadow-amber-600/30"
                          : "bg-amber-50 dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-400 dark:border-stone-600 hover:border-amber-600 dark:hover:border-amber-500"
                      }`}
                    >
                      {opt.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            {(status || category_id) && (
              <div className="pt-2 border-t border-stone-300 dark:border-stone-700">
                <Link
                  href="/reports"
                  className="font-serif italic text-sm text-slate-800 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-500 underline underline-offset-2"
                >
                  Clear all filters
                </Link>
              </div>
            )}
          </div>

          {/* Reports grid */}
          <Suspense
            key={`${status}-${category_id}`}
            fallback={<ReportsSkeleton />}
          >
            <ReportsList status={status} category_id={category_id} />
          </Suspense>
        </section>
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
