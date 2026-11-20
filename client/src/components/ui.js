// Aubergine design system — plum + coral + cream.
// 50/40/10: cream backgrounds, plum surfaces, coral/plum accents.
// Nothing is grey in either mode.
import { STATUS_LABELS, STATUS_STYLES } from "@/lib/status";

export const btnBase =
  "inline-flex items-center justify-center px-5 py-2.5 min-h-11 text-sm font-medium rounded-full transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed";
export const btnPrimary =
  `${btnBase} text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] shadow-md shadow-[var(--accent)]/20`;
export const btnSecondary =
  `${btnBase} text-[var(--foreground)] bg-[var(--surface)] hover:bg-[var(--accent-soft)] border border-[var(--border)] shadow-sm`;
export const btnDanger =
  `${btnBase} text-white bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-400 shadow-sm`;
export const btnDangerSm =
  "inline-flex items-center justify-center px-3 py-2 min-h-11 text-xs font-medium rounded-full bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900 transition active:scale-95 disabled:opacity-50";
export const chipBase =
  "inline-flex items-center min-h-9 px-4 py-1.5 text-sm font-medium rounded-full border transition active:scale-95";
export const chipActive =
  `${chipBase} bg-[var(--accent)] text-white border-[var(--accent)]`;
export const chipInactive =
  `${chipBase} bg-[var(--surface)] text-[var(--foreground-muted)] border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)]`;
export const inputClass =
  "w-full px-4 py-3 min-h-11 text-base bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--foreground)] transition placeholder:text-[var(--foreground-muted)]/70 focus:border-[var(--accent)] focus:outline-none focus:ring-4 focus:ring-[var(--accent)]/10";
export const textareaClass = `${inputClass} resize-y`;
export const labelClass =
  "block text-sm font-medium text-[var(--foreground)] mb-1.5";
export const helperClass = "text-xs text-[var(--foreground-muted)] mt-1";
export const cardClass =
  "bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-sm";
export const eyebrowClass =
  "text-xs font-semibold uppercase tracking-[0.15em] text-[var(--coral)]";
export const textLinkClass =
  "inline-flex items-center min-h-11 py-1 font-medium text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] transition";

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

export function Alert({ tone = "error", className = "", children, ...props }) {
  const styles =
    tone === "success"
      ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
      : "bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300";
  return (
    <div role={tone === "error" ? "alert" : "status"}
      className={`animate-fade-in border text-sm p-3 rounded-lg ${styles} ${className}`} {...props}>
      {children}
    </div>
  );
}

export function StatusBadge({ status, large = false }) {
  return (
    <span className={`${large ? "px-3 py-1" : "px-2.5 py-0.5"} text-xs font-semibold rounded-full ${
      STATUS_STYLES[status] || STATUS_STYLES.reported
    }`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

export function LoadingNote({ children }) {
  return <p className="text-[var(--foreground-muted)] text-center py-20">{children}</p>;
}

export function EmptyState({ children, action }) {
  return (
    <div className={`${cardClass} p-12 text-center`}>
      <p className="text-[var(--foreground-muted)] mb-4">{children}</p>
      {action}
    </div>
  );
}

export function ErrorState({ children }) {
  return (
    <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl p-12 text-center">
      <p className="text-lg font-medium text-red-800 dark:text-red-300">{children}</p>
    </div>
  );
}

export function ReportsSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, n) => (
        <div key={n} className={`${cardClass} p-5 animate-pulse`}>
          <div className="h-3 w-20 bg-[var(--border)] rounded mb-4" />
          <div className="h-5 w-full bg-[var(--border)] rounded mb-2" />
          <div className="h-4 w-3/4 bg-[var(--border)] rounded mb-4" />
          <div className="h-3 w-1/3 bg-[var(--border)] rounded" />
        </div>
      ))}
    </div>
  );
}

export function PageHero({ eyebrow, title, sub, center = false, leftAlign = false, children }) {
  const patternClass = leftAlign ? "hero-pattern-left" : "hero-pattern";
  return (
    <section className={`${patternClass} bg-[var(--background)] border-b border-[var(--border)]`}>
      <div className={`mx-auto px-4 py-12 md:py-16 ${center ? "max-w-4xl text-center" : "max-w-6xl"}`}>
        {eyebrow && <p className={`${eyebrowClass} mb-3`}>{eyebrow}</p>}
        <h1 className="text-3xl md:text-5xl font-bold text-[var(--foreground)] tracking-tight leading-tight mb-4">
          {title}
        </h1>
        {sub && (
          <p className={`text-lg text-[var(--foreground-muted)] max-w-xl ${center ? "mx-auto" : ""}`}>
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
    <footer className="border-t border-[var(--border)] pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))]">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <p className="text-sm text-[var(--foreground-muted)]">FixMyArea · Built for communities</p>
      </div>
    </footer>
  );
}

function Svg({ className = "w-4 h-4", children }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {children}
    </svg>
  );
}

export function PinIcon({ className }) {
  return <Svg className={className}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></Svg>;
}

export function CameraIcon({ className }) {
  return <Svg className={className}><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></Svg>;
}

export function CheckIcon({ className }) {
  return <Svg className={className}><path d="M20 6 9 17l-5-5" /></Svg>;
}

export function ThumbsUpIcon({ className }) {
  return (
    <Svg className={className}>
      <path d="M7 10v12" />
      <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
    </Svg>
  );
}
