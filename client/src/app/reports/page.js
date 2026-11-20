import { Suspense } from "react";
import Link from "next/link";
import ReportCard from "@/components/ReportCard";
import { Stagger } from "@/components/Motion";
import {
  PageHero,
  ReportsSkeleton,
  ErrorState,
  EmptyState,
  chipActive,
  chipInactive,
  textLinkClass,
} from "@/components/ui";
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
    return <ErrorState>Could not load reports — try again.</ErrorState>;
  }

  if (reports.length === 0) {
    return (
      <EmptyState
        action={
          <Link href="/reports" className={textLinkClass}>
            Clear filters
          </Link>
        }
      >
        No reports match these filters.
      </EmptyState>
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
    <main className="min-h-screen bg-white dark:bg-slate-900">
      <PageHero
        eyebrow="Community Reports"
        title="All reports"
        sub="Every issue reported by your community. Filter by status or category to see what matters to you."
      />

      <section className="max-w-6xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-4 mb-8 space-y-4">
          {/* Status filters */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Status
            </p>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((opt) => {
                const isActive = status === opt.value;
                return (
                  <Link
                    key={opt.value}
                    href={buildFilterUrl(opt.value, category_id)}
                    className={isActive ? chipActive : chipInactive}
                  >
                    {opt.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Category filters */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Category
            </p>
            <div className="flex flex-wrap gap-2">
              {categoryOptions.map((opt) => {
                const isActive = category_id === opt.value;
                return (
                  <Link
                    key={opt.value}
                    href={buildFilterUrl(status, opt.value)}
                    className={isActive ? chipActive : chipInactive}
                  >
                    {opt.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {(status || category_id) && (
            <div className="pt-2 border-t border-slate-200 dark:border-zinc-800">
              <Link href="/reports" className={textLinkClass}>
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
  );
}
