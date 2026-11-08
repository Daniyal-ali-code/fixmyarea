import Link from "next/link";
import Header from "@/components/Header";

export default function LoginPlaceholder() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-amber-50 dark:bg-stone-900 flex items-center justify-center px-4 py-12">
        <div className="bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-sm p-8 max-w-md w-full">
          <h1 className="font-serif text-3xl font-bold text-stone-900 dark:text-stone-50 mb-2">
            Login
          </h1>
          <p className="font-serif italic text-stone-600 dark:text-stone-400 mb-6">
            Coming soon in Phase 6b.
          </p>
          <Link
            href="/"
            className="font-serif italic text-sm text-slate-800 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300"
          >
            ← Back to home
          </Link>
        </div>
      </main>
    </>
  );
}
