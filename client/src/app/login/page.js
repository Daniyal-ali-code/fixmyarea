import Link from "next/link";
import Header from "@/components/Header";

export default function LoginPlaceholder() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white border border-gray-200 rounded-lg p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Login</h1>
          <p className="text-gray-600 mb-6">Coming in Phase 6b.</p>
          <Link href="/" className="text-blue-600 hover:underline">
            ← Back to home
          </Link>
        </div>
      </main>
    </>
  );
}
