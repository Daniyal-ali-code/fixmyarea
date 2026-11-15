import { NextResponse } from 'next/server';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { query, withTransaction } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { parseIdParam, parseJsonBody, VALID_STATUSES } from '@/lib/http';
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  extensionForImage,
} from '@/lib/upload';

export async function PATCH(request, { params }) {
  let resolutionFilepath = null; // written file, deleted if the DB update fails
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const reportId = parseIdParam(id);
    if (reportId === null) {
      return NextResponse.json({ error: 'Invalid report id' }, { status: 400 });
    }

    const contentType = request.headers.get('content-type') || '';
    const isMultipart = contentType.includes('multipart/form-data');

    let status;
    let resolutionNote = null;
    let resolutionImageFile = null;

    if (isMultipart) {
      let form;
      try {
        form = await request.formData();
      } catch {
        return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
      }
      status = form.get('status');
      resolutionNote = (form.get('resolution_note') || '').toString().trim();
      resolutionImageFile = form.get('resolution_image');
    } else {
      const { body, error } = await parseJsonBody(request);
      if (error) {
        return NextResponse.json({ error }, { status: 400 });
      }
      status = body.status;
    }

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    const existing = await query('SELECT * FROM reports WHERE id = $1', [reportId]);
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const oldStatus = existing.rows[0].status;
    if (oldStatus === status) {
      // Idempotent no-op: setting the status it already has is fine.
      return NextResponse.json({
        report: existing.rows[0],
        old_status: oldStatus,
        new_status: status,
      });
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
      if (!ALLOWED_IMAGE_TYPES.includes(resolutionImageFile.type)) {
        return NextResponse.json(
          { error: 'resolution_image must be JPEG, PNG, or WEBP' },
          { status: 400 }
        );
      }
      if (resolutionImageFile.size > MAX_IMAGE_BYTES) {
        return NextResponse.json(
          { error: 'resolution_image must be 5 MB or smaller' },
          { status: 400 }
        );
      }

      // Extension comes from the verified MIME type, never the
      // attacker-supplied filename; magic bytes must match too.
      const buffer = Buffer.from(await resolutionImageFile.arrayBuffer());
      const ext = extensionForImage(buffer, resolutionImageFile.type);
      if (!ext) {
        return NextResponse.json(
          { error: 'resolution_image contents do not match its type' },
          { status: 400 }
        );
      }

      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'resolutions');
      await mkdir(uploadDir, { recursive: true });

      const filename = `${reportId}-${randomUUID()}${ext}`;
      resolutionFilepath = path.join(uploadDir, filename);
      await writeFile(resolutionFilepath, buffer);

      resolutionImageUrl = `/uploads/resolutions/${filename}`;
    }

    // Report UPDATE + history INSERT in one transaction. The UPDATE only
    // matches the status we read, so a concurrent status change fails
    // instead of silently overwriting it.
    let updated;
    try {
      updated = await withTransaction(async (client) => {
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
            WHERE id = $5 AND status = $6
            RETURNING *`;
          updateParams = [status, resolutionImageUrl, resolutionNote, user.id, reportId, oldStatus];
        } else {
          // Leaving 'resolved' clears the stale resolution data.
          updateSql = `UPDATE reports
            SET status = $1,
                resolution_image_url = NULL,
                resolution_note = NULL,
                resolved_by = NULL,
                resolved_at = NULL,
                updated_at = NOW()
            WHERE id = $2 AND status = $3
            RETURNING *`;
          updateParams = [status, reportId, oldStatus];
        }

        const { rows } = await client.query(updateSql, updateParams);
        if (rows.length === 0) {
          return null; // status changed concurrently
        }

        await client.query(
          `INSERT INTO status_history (report_id, old_status, new_status, changed_by, note)
           VALUES ($1, $2, $3, $4, $5)`,
          [reportId, oldStatus, status, user.id, resolutionNote]
        );

        return rows[0];
      });
    } catch (txErr) {
      // The resolution file was already written; remove it so a failed
      // update leaves no orphan file behind.
      if (resolutionFilepath) {
        try {
          await unlink(resolutionFilepath);
        } catch (unlinkErr) {
          console.error('updateStatus: failed to delete orphan resolution file', resolutionFilepath, unlinkErr);
        }
      }
      throw txErr;
    }

    if (!updated) {
      if (resolutionFilepath) {
        try {
          await unlink(resolutionFilepath);
        } catch (unlinkErr) {
          console.error('updateStatus: failed to delete orphan resolution file', resolutionFilepath, unlinkErr);
        }
      }
      return NextResponse.json(
        { error: 'Report status changed concurrently, please reload and retry' },
        { status: 409 }
      );
    }

    return NextResponse.json({
      report: updated,
      old_status: oldStatus,
      new_status: status,
    });
  } catch (err) {
    console.error('admin.updateStatus error:', err);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}
