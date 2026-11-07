import { query } from "../config/db.js";

const VALID_STATUSES = ["reported", "under_review", "in_progress", "resolved"];

// GET /api/admin/reports  (admin)
export async function listAllReports(req, res) {
  try {
    const { rows } = await query(
      `SELECT
         r.id, r.title, r.description, r.latitude, r.longitude,
         r.severity, r.status, r.priority_score, r.created_at, r.updated_at,
         r.category_id, c.name AS category_name,
         u.id AS user_id, u.name AS reporter_name, u.email AS reporter_email,
         (SELECT COUNT(*)::int FROM supports s WHERE s.report_id = r.id) AS support_count
       FROM reports r
       JOIN categories c ON c.id = r.category_id
       JOIN users u      ON u.id = r.user_id
       ORDER BY r.created_at DESC
       LIMIT 500`
    );
    res.json({ reports: rows });
  } catch (err) {
    console.error("admin.listAllReports error:", err);
    res.status(500).json({ error: "Failed to list reports" });
  }
}

// PATCH /api/admin/reports/:id/status  (admin)
export async function updateStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `status must be one of: ${VALID_STATUSES.join(", ")}`,
      });
    }

    const existing = await query("SELECT status FROM reports WHERE id = $1", [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Report not found" });
    }

    const oldStatus = existing.rows[0].status;
    if (oldStatus === status) {
      return res.status(400).json({ error: `Report is already ${status}` });
    }

    const { rows } = await query(
      `UPDATE reports
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    await query(
      `INSERT INTO status_history (report_id, old_status, new_status, changed_by)
       VALUES ($1, $2, $3, $4)`,
      [id, oldStatus, status, req.user.id]
    );

    res.json({ report: rows[0], old_status: oldStatus, new_status: status });
  } catch (err) {
    console.error("admin.updateStatus error:", err);
    res.status(500).json({ error: "Failed to update status" });
  }
}

// DELETE /api/admin/reports/:id  (admin)
export async function deleteReport(req, res) {
  try {
    const { id } = req.params;

    const existing = await query("SELECT id FROM reports WHERE id = $1", [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Report not found" });
    }

    await query("DELETE FROM reports WHERE id = $1", [id]);

    res.json({ deleted: true, id: Number(id) });
  } catch (err) {
    console.error("admin.deleteReport error:", err);
    res.status(500).json({ error: "Failed to delete report" });
  }
}

// GET /api/stats  (public)
export async function getStats(req, res) {
  try {
    const byStatus = await query(
      `SELECT status, COUNT(*)::int AS count
       FROM reports
       GROUP BY status`
    );

    const byCategory = await query(
      `SELECT c.id, c.name, COUNT(r.id)::int AS count
       FROM categories c
       LEFT JOIN reports r ON r.category_id = c.id
       GROUP BY c.id, c.name
       ORDER BY count DESC`
    );

    const totals = await query(
      `SELECT
         COUNT(*)::int AS total,
         SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END)::int AS resolved
       FROM reports`
    );

    const perDay = await query(
      `SELECT
         DATE_TRUNC('day', created_at)::date AS day,
         COUNT(*)::int AS count
       FROM reports
       WHERE created_at >= NOW() - INTERVAL '30 days'
       GROUP BY day
       ORDER BY day`
    );

    const topSupported = await query(
      `SELECT
         r.id, r.title, r.status,
         COUNT(s.user_id)::int AS support_count
       FROM reports r
       LEFT JOIN supports s ON s.report_id = r.id
       GROUP BY r.id, r.title, r.status
       ORDER BY support_count DESC
       LIMIT 5`
    );

    const { total, resolved } = totals.rows[0];

    res.json({
      by_status: byStatus.rows,
      by_category: byCategory.rows,
      totals: {
        total_reports: total,
        resolved_reports: resolved,
        resolution_rate:
          total === 0 ? 0 : Number(((resolved / total) * 100).toFixed(1)),
      },
      reports_per_day: perDay.rows,
      top_supported: topSupported.rows,
    });
  } catch (err) {
    console.error("getStats error:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
}
