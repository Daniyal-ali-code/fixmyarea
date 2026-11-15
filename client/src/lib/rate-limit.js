// Simple in-memory per-key windowed rate limiter.
// NOTE: state lives in one process only. A multi-instance production
// deployment needs a shared store (e.g. Upstash Redis) instead.
const buckets = new Map(); // key -> array of request timestamps (ms)

// Drop empty buckets every minute so the map does not grow forever.
setInterval(() => {
  const now = Date.now();
  for (const [key, stamps] of buckets) {
    const fresh = stamps.filter((t) => now - t < 15 * 60 * 1000);
    if (fresh.length === 0) buckets.delete(key);
    else buckets.set(key, fresh);
  }
}, 60 * 1000).unref?.();

export function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

// Returns null when the request is allowed, or { retryAfterSeconds }
// when the key has exceeded `limit` requests in `windowMs`.
export function checkRateLimit(key, { limit, windowMs }) {
  const now = Date.now();
  const stamps = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  if (stamps.length >= limit) {
    const retryAfterSeconds = Math.ceil((stamps[0] + windowMs - now) / 1000);
    return { retryAfterSeconds: Math.max(retryAfterSeconds, 1) };
  }
  stamps.push(now);
  buckets.set(key, stamps);
  return null;
}
