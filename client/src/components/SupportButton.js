"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

export default function SupportButton({ reportId, initialCount, initialSupported = false }) {
  const router = useRouter();
  const { user } = useAuth();
  const [count, setCount] = useState(initialCount);
  const [supported, setSupported] = useState(initialSupported);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!user) {
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/reports/${reportId}/support`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Support failed:", data.error);
        return;
      }

      setSupported(data.supported);
      setCount(data.support_count);
    } catch (err) {
      console.error("Support error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`inline-block px-8 py-3 text-xs font-semibold uppercase tracking-wider rounded-sm transition-all border ${
        supported
          ? "text-stone-900 bg-amber-500 hover:bg-amber-400 border-amber-600 shadow-md shadow-amber-600/30"
          : "text-stone-900 bg-amber-600 hover:bg-amber-500 border-amber-700 shadow-md shadow-amber-600/30 hover:shadow-lg hover:shadow-amber-600/40"
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {loading
        ? "Updating..."
        : supported
        ? `✓ Supported (${count})`
        : `👍 Support this report (${count})`}
    </button>
  );
}
