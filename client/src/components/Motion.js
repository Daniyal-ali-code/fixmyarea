"use client";

import { useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { withGsap } from "@/lib/motion";

// Route entrance: page content fades in and rises slightly (10px,
// 250ms) on every navigation. Keyed by pathname so client-side
// route changes re-run it; the root layout wraps children in this.
export function PageEnter({ children }) {
  const pathname = usePathname();
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    withGsap((gsap) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.25, ease: "power2.out", overwrite: true }
      );
    });
  }, [pathname]);

  return <div ref={ref}>{children}</div>;
}

// Staggered entrance for card grids (home recent reports, reports
// list, dashboard). Children fade + rise one after another (50ms
// apart); props are cleared afterwards so hover states keep working.
export function Stagger({ children, className }) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || el.children.length === 0) return;
    withGsap((gsap) => {
      gsap.fromTo(
        el.children,
        { opacity: 0, y: 10 },
        {
          opacity: 1,
          y: 0,
          duration: 0.25,
          stagger: 0.05,
          ease: "power2.out",
          overwrite: true,
          clearProps: "opacity,transform",
        }
      );
    });
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
