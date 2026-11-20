// Shared UI tokens + components for FixMyArea.
// One button scale, one input style, one card, one alert, one status
// badge, one hero, one footer — so pages stop copy-pasting class
// strings and drifting apart. Flat colours only: stone neutrals +
// amber accent, no gradients, no glass. Success is emerald, the one
// neutral is stone (no slate anywhere).
import { STATUS_LABELS, STATUS_STYLES } from "@/lib/status";

// --- class tokens (import these when a <button>/<a> can't be a <Button>) ---
export const btnBase =
  "inline-flex items-center justify-center px-6 py-3 min-h-11 text-xs font-semibold uppercase tracking-wider rounded-sm border transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed";
export const btnPrimary = `${btnBase} text-stone-900 bg-amber-600 hover:bg-amber-500 border-amber-700`;
export const btnSecondary = `${btnBase} text-stone-900 dark:text-stone-100 bg-amber-50 dark:bg-stone-800 hover:bg-amber-100 dark:hover:bg-stone-700 border-stone-400 dark:border-stone-600`;
export const btnDanger = `${btnBase} text-red-800 dark:text-red-200 bg-red-50 dark:bg-red-950 hover:bg-red-100 dark:hover:bg-red-900 border-red-300 dark:border-red-800`;
export const btnDangerSm =
  "inline-flex items-center justify-center px-3 py-2 min-h-11 text-xs uppercase tracking-wider rounded-sm bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900 transition active:scale-95 disabled:opacity-50";
export const chipBase =
  "inline-flex items-center min-h-11 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-sm border transition active:scale-95";
export const chipActive = `${chipBase} bg-amber-600 text-stone-900 border-amber-700`;
export const chipInactive = `${chipBase} bg-amber-50 dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-400 dark:border-stone-600 hover:border-amber-600 dark:hover:border-amber-500`;
export const inputClass =
  "w-full px-4 py-3 min-h-11 text-base bg-amber-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-600 rounded-sm text-stone-900 dark:text-stone-50 transition placeholder:text-stone-400 dark:placeholder:text-stone-500";
export const textareaClass = `${inputClass} resize-y`;
export const labelClass =
  "block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-2";
export const helperClass = "text-xs text-stone-500 dark:text-stone-500 mt-1";
export const cardClass =
  "bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-sm";
export const eyebrowClass =
  "font-serif italic text-xs uppercase tracking-[0.3em] text-stone-600 dark:text-stone-400 border-b-2 border-amber-600 pb-1 inline-block";
export const textLinkClass =
  "font-serif italic text-sm text-stone-800 dark:text-stone-300 hover:text-amber-600 dark:hover:text-amber-500 underline underline-offset-2 transition";

// --- buttons / fields ---
export function Button({ variant = "primary", className = "", ...props }) {
  const styles =
    variant === "secondary"
      ? btnSecondary
      : variant === "danger"
        ? btnDanger
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
      ? "bg-emerald-50 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
      : "bg-red-50 dark:bg-red-950 border-red-300 dark:border-red-800 text-red-800 dark:text-red-200";
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`animate-fade-in border text-sm p-3 rounded-sm ${styles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function StatusBadge({ status, large = false }) {
  return (
    <span
      className={`${large ? "px-3 py-1" : "px-2 py-0.5"} text-xs font-semibold uppercase tracking-wider border rounded-sm ${
        STATUS_STYLES[status] || STATUS_STYLES.reported
      }`}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}

export function LoadingNote({ children }) {
  return (
    <p className="font-serif italic text-stone-600 dark:text-stone-400 text-center py-20">
      {children}
    </p>
  );
}

export function EmptyState({ children, action }) {
  return (
    <div className={`${cardClass} p-12 text-center`}>
      <p className="font-serif italic text-stone-600 dark:text-stone-400 mb-4">
        {children}
      </p>
      {action}
    </div>
  );
}

export function ErrorState({ children }) {
  return (
    <div className="bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-800 rounded-sm p-12 text-center">
      <p className="font-serif italic text-lg text-red-800 dark:text-red-200">
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
          <div className="h-3 w-20 bg-stone-200 dark:bg-stone-700 rounded mb-4" />
          <div className="h-5 w-full bg-stone-200 dark:bg-stone-700 rounded mb-2" />
          <div className="h-4 w-3/4 bg-stone-200 dark:bg-stone-700 rounded mb-4" />
          <div className="h-3 w-1/3 bg-stone-200 dark:bg-stone-700 rounded" />
        </div>
      ))}
    </div>
  );
}

// --- page furniture ---
export function PageHero({ eyebrow, title, sub, center = false, children }) {
  return (
    <section className="bg-amber-100 dark:bg-stone-800 border-b border-stone-400 dark:border-stone-700">
      <div
        className={`mx-auto px-4 py-12 md:py-16 ${
          center ? "max-w-4xl text-center" : "max-w-6xl"
        }`}
      >
        {eyebrow && <p className={`${eyebrowClass} mb-2`}>{eyebrow}</p>}
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-stone-900 dark:text-stone-50 mt-3 mb-4 leading-tight">
          {title}
        </h1>
        {sub && (
          <p
            className={`font-serif italic text-lg text-stone-700 dark:text-stone-300 max-w-xl ${
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

// The one footer, rendered by the root layout on every page.
// Bottom padding is its own 1.5rem + 4.5rem nav clearance + safe
// area, so the footer text always clears the fixed bottom nav and
// no blank band sits below the footer.
export function Footer() {
  return (
    <footer className="bg-stone-900 dark:bg-stone-950 text-amber-50 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))] border-t-4 border-amber-600">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <p className="font-serif italic text-sm">
          FixMyArea · Built for communities
        </p>
      </div>
    </footer>
  );
}

// --- inline SVG icons (same stroke style as BottomNav; no emoji) ---
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
