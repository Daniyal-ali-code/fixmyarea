// One status system for the whole app: labels, badge classes and map
// pin colours all come from here. Previously the same strings were
// copy-pasted in ReportCard, the report detail page, the admin page
// and both map files — and they had already drifted.
// Resolved uses stone (the one neutral); success green is emerald
// everywhere else (see components/ui.js Alert).
export const STATUS_LABELS = {
  reported: "Reported",
  under_review: "Under Review",
  in_progress: "In Progress",
  resolved: "Resolved",
};

export const STATUS_STYLES = {
  reported:
    "bg-blue-50 text-blue-900 border-blue-300 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800",
  under_review:
    "bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800",
  in_progress:
    "bg-orange-50 text-orange-900 border-orange-300 dark:bg-orange-950 dark:text-orange-200 dark:border-orange-800",
  resolved:
    "bg-stone-100 text-stone-900 border-stone-300 dark:bg-stone-800 dark:text-stone-200 dark:border-stone-600",
};

// Hex copies of the same four statuses, for Leaflet pins.
export const STATUS_COLORS = {
  reported: "#2563eb",
  under_review: "#d97706",
  in_progress: "#ea580c",
  resolved: "#57534e",
};

export const STATUS_ORDER = ["reported", "under_review", "in_progress", "resolved"];
