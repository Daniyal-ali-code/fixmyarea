// One status system for the whole app. Colors tuned to
// the Aubergine palette — no raw primary blue/green,
// no grey "resolved" badge. All badges are muted
// pill styles that feel at home with plum/coral.
export const STATUS_LABELS = {
  reported: "Reported",
  under_review: "Under Review",
  in_progress: "In Progress",
  resolved: "Resolved",
};

export const STATUS_STYLES = {
  reported:
    "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  under_review:
    "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  in_progress:
    "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  resolved:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
};

// Map pin colors — kept semantic so users can read the map
export const STATUS_COLORS = {
  reported: "#0284c7",       // sky-600
  under_review: "#d97706",   // amber-600
  in_progress: "#ea580c",    // orange-600
  resolved: "#059669",       // emerald-600
};

export const STATUS_ORDER = ["reported", "under_review", "in_progress", "resolved"];
