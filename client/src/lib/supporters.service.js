import { query } from '@/lib/db';

const SUPPORTERS_LIMIT = 10;

/**
 * Fetch the first N supporters for a report (name only, no PII).
 * Returns { supporters: [{ id, name }], total: number }.
 */
export async function getSupporters(reportId, limit = SUPPORTERS_LIMIT) {
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || SUPPORTERS_LIMIT, 1), 50);

  const [list, count] = await Promise.all([
    query(
      `SELECT u.id, u.name
       FROM supports s
       JOIN users u ON u.id = s.user_id
       WHERE s.report_id = $1
       ORDER BY s.created_at DESC
       LIMIT $2`,
      [reportId, safeLimit]
    ),
    query(
      'SELECT COUNT(*)::int AS total FROM supports WHERE report_id = $1',
      [reportId]
    ),
  ]);

  return {
    supporters: list.rows,
    total: count.rows[0].total,
  };
}
