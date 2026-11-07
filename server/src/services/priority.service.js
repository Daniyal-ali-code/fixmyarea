import { query } from '../config/db.js';

const SEVERITY_WEIGHT = 10;
const SUPPORT_WEIGHT = 2;
const SUPPORT_CAP = 50;
const AGE_WEIGHT = 0.5;
const AGE_CAP_DAYS = 30;

// Compute the priority score for a report based on severity, support, and age
export async function computePriority(reportId) {
  const { rows } = await query(
    `SELECT
       r.severity,
       (SELECT COUNT(*)::int FROM supports s WHERE s.report_id = r.id) AS support_count,
       EXTRACT(EPOCH FROM (NOW() - r.created_at)) / 86400 AS age_days
     FROM reports r
     WHERE r.id = $1`,
    [reportId]
  );

  if (rows.length === 0) return null;

  const { severity, support_count, age_days } = rows[0];

  const severityScore = severity * SEVERITY_WEIGHT;
  const supportScore = Math.min(support_count, SUPPORT_CAP) * SUPPORT_WEIGHT;
  const ageScore = Math.min(Number(age_days), AGE_CAP_DAYS) * AGE_WEIGHT;

  const score = severityScore + supportScore + ageScore;

  // Round to 2 decimals to keep the column tidy
  const rounded = Number(score.toFixed(2));

  // Persist it so listReports can sort efficiently
  await query('UPDATE reports SET priority_score = $1, updated_at = NOW() WHERE id = $2', [
    rounded,
    reportId,
  ]);

  return rounded;
}
