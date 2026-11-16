// GSAP helpers. GSAP is loaded by DYNAMIC IMPORT ONLY — it never
// lands in the initial layout chunk, so the site stays fast.
// All motion is transform + opacity only, 150–300ms, no loops, no
// autoplay — and it is skipped entirely when the user prefers
// reduced motion.
export function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Runs fn(gsap) once GSAP has loaded; returns false (and runs nothing)
// when reduced motion is preferred.
export async function withGsap(fn) {
  if (prefersReducedMotion()) return false;
  const { default: gsap } = await import("gsap");
  fn(gsap);
  return true;
}
