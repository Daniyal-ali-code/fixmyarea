import Link from "next/link";
import Header from "@/components/Header";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-amber-50 dark:bg-stone-900 flex items-center justify-center px-4 py-16">
        <div className="max-w-md text-center">
          <p className="font-serif italic text-xs uppercase tracking-[0.3em] text-stone-600 dark:text-stone-400 mb-2 border-b-2 border-amber-600 pb-1 inline-block">
            Page Not Found
          </p>
          <h1 className="font-serif text-6xl md:text-7xl font-bold text-stone-900 dark:text-stone-50 mt-4 mb-4">
            404
          </h1>
          <p className="font-serif italic text-lg text-stone-700 dark:text-stone-300 mb-8">
            This page doesn&apos;t exist — maybe the report was removed, or the
            link is wrong.
          </p>
          <Link
            href="/"
            className="inline-block px-8 py-3 text-xs font-semibold uppercase tracking-wider text-stone-900 bg-amber-600 rounded-sm hover:bg-amber-500 shadow-md shadow-amber-600/30 transition border border-amber-700"
          >
            Back to Home
          </Link>
        </div>
      </main>
    </>
  );
}
