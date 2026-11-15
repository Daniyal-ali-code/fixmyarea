// Small shared helpers for API route handlers.

// Safely parse a JSON body. Returns { body } on success, or
// { error } (a plain message string) when the body is malformed or
// not a JSON object.
export async function parseJsonBody(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return { error: 'Invalid JSON body' };
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Request body must be a JSON object' };
  }
  return { body };
}

// Validate a numeric route [id] param. Returns the integer, or null.
export function parseIdParam(id) {
  const n = Number(id);
  return Number.isInteger(n) ? n : null;
}

export const VALID_STATUSES = ['reported', 'under_review', 'in_progress', 'resolved'];

// Validate ?limit (default 50, cap 100) and ?offset (>= 0).
// Returns { limit, offset } or { error }.
export function parsePagination(searchParams) {
  const rawLimit = searchParams.get('limit');
  const rawOffset = searchParams.get('offset');
  const limit = rawLimit === null ? 50 : Number(rawLimit);
  const offset = rawOffset === null ? 0 : Number(rawOffset);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    return { error: 'limit must be an integer between 1 and 100' };
  }
  if (!Number.isInteger(offset) || offset < 0) {
    return { error: 'offset must be an integer >= 0' };
  }
  return { limit, offset };
}
