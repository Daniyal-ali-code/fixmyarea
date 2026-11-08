import Link from "next/link";

const categoryColors = {
  Road: "bg-orange-100 text-orange-800",
  Garbage: "bg-green-100 text-green-800",
  Water: "bg-blue-100 text-blue-800",
  Streetlight: "bg-yellow-100 text-yellow-800",
  Other: "bg-gray-100 text-gray-800",
};

const statusColors = {
  reported: "bg-blue-50 text-blue-700 border-blue-200",
  under_review: "bg-yellow-50 text-yellow-700 border-yellow-200",
  in_progress: "bg-orange-50 text-orange-700 border-orange-200",
  resolved: "bg-green-50 text-green-700 border-green-200",
};

const statusLabels = {
  reported: "Reported",
  under_review: "Under Review",
  in_progress: "In Progress",
  resolved: "Resolved",
};

export default function ReportCard({ report }) {
  const categoryColor = categoryColors[report.category_name] || categoryColors.Other;
  const statusColor = statusColors[report.status] || statusColors.reported;

  return (
    <Link
      href={`/reports/${report.id}`}
      className="block bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition"
    >
      <div className="flex items-start justify-between mb-3">
        <span className={`px-2 py-1 text-xs font-medium rounded ${categoryColor}`}>
          {report.category_name}
        </span>
        <span className={`px-2 py-1 text-xs font-medium border rounded ${statusColor}`}>
          {statusLabels[report.status] || report.status}
        </span>
      </div>

      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
        {report.title}
      </h3>
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
        {report.description}
      </p>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>by {report.reporter_name || "Anonymous"}</span>
        <span className="flex items-center gap-1">
          <span>👍</span>
          <span>{report.support_count} support</span>
        </span>
      </div>
    </Link>
  );
}
