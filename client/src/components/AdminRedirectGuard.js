"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

export default function AdminRedirectGuard({ children }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user && user.role === "admin") {
      router.replace("/admin");
    }
  }, [user, loading, router]);

  // While auth is loading or redirect is in progress, render nothing
  if (loading) return null;
  if (user?.role === "admin") return null;

  return children;
}
