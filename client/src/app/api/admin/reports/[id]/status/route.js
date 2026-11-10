import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

const VALID_STATUSES = ['reported', 'under_review', 'in_progress', 'resolved'];

const MAX_RESOLUTION_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

export async function PATCH(request, { params }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;

    const contentType = request.headers.get('content-type') || '';
    const isMultipart = contentType.includes('multipart/form-data');

    let status;
    let resolutionNote = null;
    let resolutionImageFile = null;

    if (isMultipart) {
      const form = await request.formData();
      status = form.get('status');
      resolutionNote = (form.get('resolution_note') || '').toString().trim();
      resolutionImageFile = form.get('resolution_image');
    } else {
      const body = await request.json();
      status = body.status;
    }

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    const existing = await query('SELECT status FROM reports WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const oldStatus = existing.rows[0].status;
    if (oldStatus === status) {
      return NextResponse.json({ error: `Report is already ${status}` }, { status: 400 });
    }

    let resolutionImageUrl = null;

    if (status === 'resolved') {
      if (!resolutionNote || resolutionNote.length < 5) {
        return NextResponse.json(
          { error: 'resolution_note (min 5 chars) is required to mark as resolved' },
          { status: 400 }
        );
      }
      if (!resolutionImageFile || typeof resolutionImageFile === 'string') {
        return NextResponse.json(
          { error: 'resolution_image is required to mark as resolved' },
          { status: 400 }
        );
      }
      if (!ALLOWED_MIME.includes(resolutionImageFile.type)) {
        return NextResponse.json(
          { error: 'resolution_image must be JPEG, PNG, or WEBP' },
          { status: 400 }
        );
      }
      if (resolutionImageFile.size > MAX_RESOLUTION_IMAGE_BYTES) {
        return NextResponse.json(
          { error: 'resolution_image must be 5 MB or smaller' },
          { status: 400 }
        );
      }

      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'resolutions');
      await mkdir(uploadDir, { recursive: true });

      const ext = path.extname(resolutionImageFile.name) || '.jpg';
      const filename = `${id}-${randomUUID()}${ext}`;
      const buffer = Buffer.from(await resolutionImageFile.arrayBuffer());
      await writeFile(path.join(uploadDir, filename), buffer);

      resolutionImageUrl = `/uploads/resolutions/${filename}`;
    }

    let updateSql;
    let updateParams;

    if (status === 'resolved') {
      updateSql = `UPDATE reports
        SET status = $1,
            resolution_image_url = $2,
            resolution_note = $3,
            resolved_by = $4,
            resolved_at = NOW(),
            updated_at = NOW()
        WHERE id = $5
        RETURNING *`;
      updateParams = [status, resolutionImageUrl, resolutionNote, user.id, id];
    } else {
      updateSql = `UPDATE reports
        SET status = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *`;
      updateParams = [status, id];
    }

    const { rows } = await query(updateSql, updateParams);

    await query(
      `INSERT INTO status_history (report_id, old_status, new_status, changed_by, note)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, oldStatus, status, user.id, resolutionNote]
    );

    return NextResponse.json({
      report: rows[0],
      old_status: oldStatus,
      new_status: status,
    });
  } catch (err) {
    console.error('admin.updateStatus error:', err);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}
