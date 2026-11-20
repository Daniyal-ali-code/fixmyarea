// Modern design system — clean, rounded, indigo accent.
// Every page imports from here, so restyling one file restyles the app.
import { STATUS_LABELS, STATUS_STYLES } from "@/lib/status";

// --- tokens ---
export const btnBase =
  "inline-flex items-center justify-center px-5 py-2.5 min-h-11 text-sm font-medium rounded-full transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2";
export const btnPrimary =
  `${btnBase} text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400 shadow-sm shadow-indigo-600/20`;
export const btnSecondary =
  `${btnBase} text-slate-700 dark:text-slate-200 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 shadow-sm`;
export const btnDanger =
  `${btnBase} text-white bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-400 shadow-sm`;
export const btnDangerSm =
  "inline-flex items-center justify-center px-3 py-2 min-h-11 text-xs font-medium rounded-full bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900 transition active:scale-95 disabled:opacity-50";
export const chipBase =
  "inline-flex items-center min-h-9 px-4 py-1.5 text-sm font-medium rounded-full border transition active:scale-95";
export const chipActive =
  `${chipBase} bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500`;
export const chipInactive =
  `${chipBase} bg-white dark:bg-zinc-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-zinc-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400`;
export const inputClass =
  "w-full px-4 py-3 min-h-11 text-base bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-slate-50 transition placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-400/10";
export const textareaClass = `${inputClass} resize-y`;
export const labelClass =
  "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5";
export const helperClass = "text-xs text-slate-500 dark:text-zinc-500 mt-1";
export const cardClass =
  "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm";
export const eyebrowClass =
  "text-xs font-semibold uppercase tracking-[0.15em] text-indigo-600 dark:text-indigo-400";
export const textLinkClass =
  "inline-flex items-center min-h-11 py-1 font-medium text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition";

// --- buttons / fields ---
export function Button({ variant = "primary", className = "", ...props }) {
  const styles =
    variant === "secondary" ? btnSecondary
    : variant === "danger" ? btnDanger
    : btnPrimary;
  return <button className={`${styles} ${className}`} {...props} />;
}

export function Input({ className = "", ...props }) {
  return <input className={`${inputClass} ${className}`} {...props} />;
}

export function Textarea({ className = "", ...props }) {
  return <textarea className={`${textareaClass} ${className}`} {...props} />;
}

export function Card({ className = "", ...props }) {
  return <div className={`${cardClass} ${className}`} {...props} />;
}

// --- alerts / states ---
export function Alert({ tone = "error", className = "", children, ...props }) {
  const styles =
    tone === "success"
      ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
      : "bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300";
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`animate-fade-in border text-sm p-3 rounded-lg ${styles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function StatusBadge({ status, large = false }) {
  return (
    <span
      className={`${large ? "px-3 py-1" : "px-2.5 py-0.5"} text-xs font-semibold rounded-full ${
        STATUS_STYLES[status] || STATUS_STYLES.reported
      }`}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}

export function LoadingNote({ children }) {
  return (
    <p className="text-slate-500 dark:text-zinc-500 text-center py-20">
      {children}
    </p>
  );
}

export function EmptyState({ children, action }) {
  return (
    <div className={`${cardClass} p-12 text-center`}>
      <p className="text-slate-600 dark:text-slate-400 mb-4">{children}</p>
      {action}
    </div>
  );
}

export function ErrorState({ children }) {
  return (
    <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl p-12 text-center">
      <p className="text-lg font-medium text-red-800 dark:text-red-300">
        {children}
      </p>
    </div>
  );
}

export function ReportsSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, n) => (
        <div key={n} className={`${cardClass} p-5 animate-pulse`}>
          <div className="h-3 w-20 bg-slate-200 dark:bg-zinc-700 rounded mb-4" />
          <div className="h-5 w-full bg-slate-200 dark:bg-zinc-700 rounded mb-2" />
          <div className="h-4 w-3/4 bg-slate-200 dark:bg-zinc-700 rounded mb-4" />
          <div className="h-3 w-1/3 bg-slate-200 dark:bg-zinc-700 rounded" />
        </div>
      ))}
    </div>
  );
}

// --- page furniture ---
export function PageHero({ eyebrow, title, sub, center = false, children }) {
  return (
    <section className="bg-gradient-to-b from-indigo-50/60 to-transparent dark:from-indigo-950/20 dark:to-transparent border-b border-slate-200 dark:border-zinc-800">
      <div
        className={`mx-auto px-4 py-12 md:py-16 ${
          center ? "max-w-4xl text-center" : "max-w-6xl"
        }`}
      >
        {eyebrow && <p className={`${eyebrowClass} mb-3`}>{eyebrow}</p>}
        <h1 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-slate-50 tracking-tight leading-tight mb-4">
          {title}
        </h1>
        {sub && (
          <p
            className={`text-lg text-slate-600 dark:text-slate-400 max-w-xl ${
              center ? "mx-auto" : ""
            }`}
          >
            {sub}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="bg-white dark:bg-zinc-950 border-t border-slate-200 dark:border-zinc-800 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))]">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <p className="text-sm text-slate-500 dark:text-zinc-500">
          FixMyArea · Built for communities
        </p>
      </div>
    </footer>
  );
}

// --- icons ---
function Svg({ className = "w-4 h-4", children }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function PinIcon({ className }) {
  return (
    <Svg className={className}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </Svg>
  );
}

export function CameraIcon({ className }) {
  return (
    <Svg className={className}>
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </Svg>
  );
}

export function CheckIcon({ className }) {
  return (
    <Svg className={className}>
      <path d="M20 6 9 17l-5-5" />
    </Svg>
  );
}

export function ThumbsUpIcon({ className }) {
  return (
    <Svg className={className}>
      <path d="M7 10v12" />
      <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
    </Svg>
  );
}
