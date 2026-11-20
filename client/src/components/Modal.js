"use client";

import { useLayoutEffect, useRef } from "react";
import { withGsap } from "@/lib/motion";

// Mobile-app sheet: slides up from the bottom on phones, centred
// dialog on desktop. Backdrop fades in, panel slides up 24px + fades
// in (250ms, transform + opacity only). Backdrop click closes;
// Escape is handled by the caller.
export default function Modal({ onClose, label, children }) {
  const backdropRef = useRef(null);
  const panelRef = useRef(null);

  useLayoutEffect(() => {
    withGsap((gsap) => {
      if (backdropRef.current) {
        gsap.fromTo(
          backdropRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.2, ease: "power1.out" }
        );
      }
      if (panelRef.current) {
        gsap.fromTo(
          panelRef.current,
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.25, ease: "power2.out" }
        );
      }
    });
  }, []);

  return (
    <div
      ref={backdropRef}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center sm:px-4 sm:py-8 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-zinc-800 rounded-lg max-w-lg w-full p-6 mt-auto sm:my-auto max-h-[90vh] overflow-y-auto"
      >
        {children}
      </div>
    </div>
  );
}
