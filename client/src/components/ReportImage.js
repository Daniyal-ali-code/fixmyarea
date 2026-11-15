"use client";

import { useState } from "react";

// Plain <img> with a fallback: a broken image URL shows a
// "photo unavailable" box instead of a broken-image icon.
export default function ReportImage({ src, alt, className }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center bg-stone-100 dark:bg-stone-900 text-stone-500 dark:text-stone-500 text-sm font-serif italic ${className || ""}`}
      >
        Photo unavailable
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
