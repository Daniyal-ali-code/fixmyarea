import Link from "next/link";
import { btnPrimary, eyebrowClass } from "@/components/ui";

export default function NotFound() {
  return (
    <>
      <main className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center px-4 py-16">
        <div className="max-w-md text-center">
          <p className={eyebrowClass}>Page Not Found</p>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-slate-50 mt-4 mb-4">
            404
          </h1>
          <p className="text-lg text-slate-700 dark:text-slate-300 mb-8">
            This page doesn&apos;t exist — maybe the report was removed, or the
            link is wrong.
          </p>
          <Link href="/" className={btnPrimary}>
            Back to Home
          </Link>
        </div>
      </main>
    </>
  );
}
