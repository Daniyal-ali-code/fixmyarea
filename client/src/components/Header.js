import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-amber-50 dark:bg-stone-900 border-b border-stone-400 dark:border-stone-700">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-50 tracking-tight"
        >
          FixMyArea
        </Link>

        <nav className="flex items-center gap-4">
          <Link
            href="/login"
            className="font-serif italic text-sm text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 transition"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-amber-50 bg-slate-800 dark:bg-slate-700 rounded-sm hover:bg-slate-900 dark:hover:bg-slate-600 transition border border-slate-900 dark:border-slate-500"
          >
            Sign Up
          </Link>
        </nav>
      </div>
    </header>
  );
}
