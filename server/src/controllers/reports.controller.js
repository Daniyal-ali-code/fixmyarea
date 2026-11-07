import { query } from "../config/db.js";
import { findDuplicates } from "../services/duplicate.service.js";
import { computePriority } from "../services/priority.service.js";

// POST /api/reports  (protected)
export async function createReport(req, res) {
  try {
    const { title, description, category_id, latitude, longitude, severity } =
      req.body;

    if (
      !title ||
      !description ||
      !category_id ||
      latitude == null ||
      longitude == null
    ) {
      return res.status(400).json({
        error:
          "title, description, category_id, latitude, longitude are required",
      });
    }
    if (title.length > 150) {
      return res
        .status(400)
        .json({ error: "Title must be 150 characters or fewer" });
    }
    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({ error: "Invalid latitude" });
    }
    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({ error: "Invalid longitude" });
    }

    const sev = severity ?? 2;
    if (sev < 1 || sev > 5) {
      return res
        .status(400)
        .json({ error: "Severity must be between 1 and 5" });
    }

    const catCheck = await query("SELECT id FROM categories WHERE id = $1", [
      category_id,
    ]);
    if (catCheck.rows.length === 0) {
      return res.status(400).json({ error: "Invalid category_id" });
    }

    if (req.query.force !== "true") {
      const duplicates = await findDuplicates({
        title,
        description,
        latitude,
        longitude,
        category_id,
      });

      if (duplicates.length > 0) {
        return res.status(409).json({
          message:
            "Similar reports found nearby. Support an existing one or resubmit with ?force=true",
          duplicates,
        });
      }
    }

    const { rows } = await query(
      `INSERT INTO reports
         (user_id, category_id, title, description, latitude, longitude, severity)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [req.user.id, category_id, title, description, latitude, longitude, sev]
    );

    const report = rows[0];
    const score = await computePriority(report.id);
    report.priority_score = score;

    res.status(201).json({ report });
  } catch (err) {
    console.error("createReport error:", err);
    res.status(500).json({ error: "Failed to create report" });
  }
}

// GET /api/reports  (public)
export async function listReports(req, res) {
  try {
    const { status, category_id } = req.query;

    const conditions = [];
    const params = [];

    if (status) {
      params.push(status);
      conditions.push(`r.status = $${params.length}`);
    }
    if (category_id) {
      params.push(category_id);
      conditions.push(`r.category_id = $${params.length}`);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const { rows } = await query(
      `SELECT
         r.id, r.title, r.description, r.latitude, r.longitude,
         r.severity, r.status, r.priority_score, r.created_at,
         r.category_id, c.name AS category_name, c.icon AS category_icon,
         u.name AS reporter_name,
         (SELECT COUNT(*)::int FROM supports s WHERE s.report_id = r.id) AS support_count
       FROM reports r
       JOIN categories c ON c.id = r.category_id
       JOIN users u      ON u.id = r.user_id
       ${whereClause}
       ORDER BY r.priority_score DESC, r.created_at DESC
       LIMIT 500`,
      params
    );

    res.json({ reports: rows });
  } catch (err) {
    console.error("listReports error:", err);
    res.status(500).json({ error: "Failed to list reports" });
  }
}

// GET /api/reports/:id  (public)
export async function getReport(req, res) {
  try {
    const { id } = req.params;

    const { rows } = await query(
      `SELECT
         r.*,
         c.name AS category_name, c.icon AS category_icon,
         u.name AS reporter_name,
         (SELECT COUNT(*)::int FROM supports s WHERE s.report_id = r.id) AS support_count
       FROM reports r
       JOIN categories c ON c.id = r.category_id
       JOIN users u      ON u.id = r.user_id
       WHERE r.id = $1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Report not found" });
    }

    const images = await query(
      "SELECT id, url FROM report_images WHERE report_id = $1 ORDER BY id",
      [id]
    );

    res.json({ report: rows[0], images: images.rows });
  } catch (err) {
    console.error("getReport error:", err);
    res.status(500).json({ error: "Failed to fetch report" });
  }
}

// POST /api/reports/:id/support  (protected)
export async function toggleSupport(req, res) {
  try {
    const { id } = req.params;

    const exists = await query("SELECT id FROM reports WHERE id = $1", [id]);
    if (exists.rows.length === 0) {
      return res.status(404).json({ error: "Report not found" });
    }

    const existing = await query(
      "SELECT 1 FROM supports WHERE user_id = $1 AND report_id = $2",
      [req.user.id, id]
    );

    let supported;
    if (existing.rows.length > 0) {
      await query(
        "DELETE FROM supports WHERE user_id = $1 AND report_id = $2",
        [req.user.id, id]
      );
      supported = false;
    } else {
      await query("INSERT INTO supports (user_id, report_id) VALUES ($1, $2)", [
        req.user.id,
        id,
      ]);
      supported = true;
    }

    await computePriority(id);

    const count = await query(
      "SELECT COUNT(*)::int AS n FROM supports WHERE report_id = $1",
      [id]
    );

    res.json({ supported, support_count: count.rows[0].n });
  } catch (err) {
    console.error("toggleSupport error:", err);
    res.status(500).json({ error: "Failed to toggle support" });
  }
}
