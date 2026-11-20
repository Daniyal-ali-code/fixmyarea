import { query } from '@/lib/db';

/**
 * Create a notification for a user. Fire-and-forget: caller should
 * wrap in try/catch so a failed notification never breaks the
 * operation that triggered it (e.g. a status change).
 */
export async function createNotification({ userId, reportId, type, message }) {
  await query(
    `INSERT INTO notifications (user_id, report_id, type, message)
     VALUES ($1, $2, $3, $4)`,
    [userId, reportId, type, message]
  );
}

/**
 * Fetch the current user's notifications, newest first.
 * Returns { notifications, unreadCount }.
 */
export async function getNotifications(userId, { limit = 30 } = {}) {
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 30, 1), 100);
  const [list, count] = await Promise.all([
    query(
      `SELECT n.id, n.type, n.message, n.is_read, n.created_at,
              n.report_id, r.title AS report_title
       FROM notifications n
       LEFT JOIN reports r ON r.id = n.report_id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC
       LIMIT $2`,
      [userId, safeLimit]
    ),
    query(
      `SELECT COUNT(*)::int AS n FROM notifications
       WHERE user_id = $1 AND is_read = FALSE`,
      [userId]
    ),
  ]);
  return {
    notifications: list.rows,
    unreadCount: count.rows[0].n,
  };
}

/**
 * Mark one notification as read. Only the owner can mark it — the
 * WHERE clause enforces that, so a wrong user_id is a no-op.
 */
export async function markRead(notificationId, userId) {
  const { rowCount } = await query(
    `UPDATE notifications SET is_read = TRUE
     WHERE id = $1 AND user_id = $2 AND is_read = FALSE`,
    [notificationId, userId]
  );
  return rowCount > 0;
}

/**
 * Mark all of the user's unread notifications as read.
 */
export async function markAllRead(userId) {
  const { rowCount } = await query(
    `UPDATE notifications SET is_read = TRUE
     WHERE user_id = $1 AND is_read = FALSE`,
    [userId]
  );
  return rowCount;
}
