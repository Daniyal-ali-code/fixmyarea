import Link from "next/link";
import { btnPrimary, eyebrowClass } from "@/components/ui";

export default function NotFound() {
  return (
    <>
      <main className="min-h-screen bg-amber-50 dark:bg-stone-900 flex items-center justify-center px-4 py-16">
        <div className="max-w-md text-center">
          <p className={eyebrowClass}>Page Not Found</p>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-stone-900 dark:text-stone-50 mt-4 mb-4">
            404
          </h1>
          <p className="font-serif italic text-lg text-stone-700 dark:text-stone-300 mb-8">
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
