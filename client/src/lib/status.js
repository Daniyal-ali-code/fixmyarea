// One status system for the whole app. Rounded pill badges,
// indigo-consistent palette. Both light and dark tested.
export const STATUS_LABELS = {
  reported: "Reported",
  under_review: "Under Review",
  in_progress: "In Progress",
  resolved: "Resolved",
};

export const STATUS_STYLES = {
  reported:
    "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  under_review:
    "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300",
  in_progress:
    "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  resolved:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
};

// Map pin colors — kept hex for Leaflet
export const STATUS_COLORS = {
  reported: "#3b82f6",
  under_review: "#f59e0b",
  in_progress: "#f97316",
  resolved: "#10b981",
};

export const STATUS_ORDER = ["reported", "under_review", "in_progress", "resolved"];
