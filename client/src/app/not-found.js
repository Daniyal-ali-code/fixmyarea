import Link from "next/link";
import Header from "@/components/Header";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-amber-50 dark:bg-stone-900 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="font-serif italic text-xs uppercase tracking-[0.3em] text-stone-600 dark:text-stone-400 mb-4">
            Page Not Found
          </p>
          <h1 className="font-serif text-7xl font-bold text-stone-900 dark:text-stone-50 mb-4">
            404
          </h1>
          <p className="font-serif italic text-lg text-stone-700 dark:text-stone-300 mb-8">
            This page isn&apos;t built yet. We&apos;re working on it.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 text-xs font-semibold uppercase tracking-wider text-amber-50 bg-slate-800 dark:bg-slate-700 rounded-sm hover:bg-slate-900 dark:hover:bg-slate-600 transition border border-slate-900 dark:border-slate-500"
          >
            ← Back to home
          </Link>
        </div>
      </main>
    </>
  );
}
