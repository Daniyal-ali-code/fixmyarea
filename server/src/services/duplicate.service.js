import { query } from '../config/db.js';

const EARTH_RADIUS_M = 6371000;
const MAX_DISTANCE_M = 200;
const MIN_SIMILARITY = 0.25;
const MAX_CANDIDATES = 5;

// Distance in meters between two lat/lng points (haversine formula)
export function haversine(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
}

// Token-overlap similarity (Jaccard index)
export function textSimilarity(a, b) {
  const tokens = (s) =>
    new Set((s || '').toLowerCase().match(/[a-z0-9]+/g) || []);
  const A = tokens(a);
  const B = tokens(b);
  if (A.size === 0 && B.size === 0) return 1;
  const intersection = [...A].filter((t) => B.has(t)).length;
  const union = new Set([...A, ...B]).size;
  return union === 0 ? 0 : intersection / union;
}

// Find reports near a location with similar text
export async function findDuplicates({
  title,
  description,
  latitude,
  longitude,
  category_id,
}) {
  // 1. Bounding box filter — index-friendly, ~200m around the point
  // 1 degree latitude ≈ 111km, so 0.002° ≈ 220m
  const delta = 0.002;
  const { rows: candidates } = await query(
    `SELECT id, title, description, latitude, longitude, status, created_at
     FROM reports
     WHERE category_id = $1
       AND status <> 'resolved'
       AND latitude  BETWEEN $2 AND $3
       AND longitude BETWEEN $4 AND $5`,
    [
      category_id,
      latitude - delta,
      latitude + delta,
      longitude - delta,
      longitude + delta,
    ]
  );

  // 2. Score each candidate
  const scored = candidates
    .map((c) => {
      const distance = haversine(latitude, longitude, c.latitude, c.longitude);
      if (distance > MAX_DISTANCE_M) return null;

      const similarity = textSimilarity(
        `${title} ${description}`,
        `${c.title} ${c.description}`
      );
      if (similarity < MIN_SIMILARITY) return null;

      const score = similarity * (1 - distance / MAX_DISTANCE_M);
      return {
        id: c.id,
        title: c.title,
        status: c.status,
        created_at: c.created_at,
        distance_m: Math.round(distance),
        similarity: Number(similarity.toFixed(2)),
        score: Number(score.toFixed(2)),
      };
    })
    .filter((x) => x !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_CANDIDATES);

  return scored;
}
