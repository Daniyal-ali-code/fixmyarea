"use client";

import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function restore(attempt = 1) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        let res;
        try {
          res = await fetch("/api/auth/me", {
            credentials: "include",
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeoutId);
        }

        if (cancelled) return;

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else if (res.status === 401) {
          // Session is gone (expired/invalid cookie) — clear it server-side.
          setUser(null);
          fetch("/api/auth/logout", {
            method: "POST",
            credentials: "include",
          }).catch(() => {});
        } else {
          // 404/5xx: a transient or server-side problem, not proof the
          // session is dead. Keep the user signed out for now but do NOT
          // clear the cookie — the next restore can still succeed.
          setUser(null);
        }
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        if (err.name !== "AbortError") {
          console.error("Auth restore failed:", err);
        }
        // Timeout / network failure: retry once, then give up quietly.
        // Never clear the cookie on a transient failure.
        if (attempt === 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          if (!cancelled) await restore(2);
          return;
        }
        setUser(null);
        setLoading(false);
      }
    }

    restore();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = async () => {
    setUser(null);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
