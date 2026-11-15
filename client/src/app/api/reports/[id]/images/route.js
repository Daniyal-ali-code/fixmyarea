import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { query } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { parseIdParam } from "@/lib/http";
import { deleteFromBucket, uploadToBucket } from "@/lib/storage";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  extensionForImage,
} from "@/lib/upload";

const MAX_FILES_PER_REQUEST = 3;

export async function POST(request, { params }) {
  const savedPaths = []; // Storage object paths, for rollback
  const savedRows = []; // report_images ids inserted, for rollback
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const { id } = await params;
    const reportId = parseIdParam(id);
    if (reportId === null) {
      return NextResponse.json({ error: "Invalid report id" }, { status: 400 });
    }

    // Verify report exists and user owns it (or is admin)
    const reportCheck = await query(
      "SELECT id, user_id FROM reports WHERE id = $1",
      [reportId]
    );

    if (reportCheck.rows.length === 0) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (
      reportCheck.rows[0].user_id !== user.id &&
      user.role !== "admin"
    ) {
      return NextResponse.json(
        { error: "You can only add images to your own reports" },
        { status: 403 }
      );
    }

    // Parse form-data
    const formData = await request.formData();
    const files = formData.getAll("images").filter((f) => f instanceof File);

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    if (files.length > MAX_FILES_PER_REQUEST) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FILES_PER_REQUEST} files per request` },
        { status: 400 }
      );
    }

    // Validate ALL files (type, size, magic bytes) BEFORE uploading any,
    // so a failure cannot leave earlier files half-applied.
    const buffers = [];
    for (const file of files) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.type}. Use JPG, PNG, or WebP.` },
          { status: 400 }
        );
      }
      if (file.size > MAX_IMAGE_BYTES) {
        return NextResponse.json(
          { error: `File too large: ${file.name}. Max 5 MB.` },
          { status: 400 }
        );
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = extensionForImage(buffer, file.type);
      if (!ext) {
        return NextResponse.json(
          { error: `File contents do not match ${file.type}: ${file.name}` },
          { status: 400 }
        );
      }
      buffers.push({ buffer, ext, type: file.type });
    }

    const savedImages = [];

    for (const { buffer, ext, type } of buffers) {
      const storagePath = `reports/${reportId}-${randomUUID()}${ext}`;
      const url = await uploadToBucket(storagePath, buffer, type);
      savedPaths.push(storagePath);

      const { rows } = await query(
        `INSERT INTO report_images (report_id, url)
         VALUES ($1, $2)
         RETURNING id, url`,
        [reportId, url]
      );
      savedRows.push(rows[0].id);

      savedImages.push(rows[0]);
    }

    return NextResponse.json({ images: savedImages }, { status: 201 });
  } catch (err) {
    // Roll back anything already uploaded: delete the Storage objects
    // and the rows.
    for (const storagePath of savedPaths) {
      await deleteFromBucket(storagePath);
    }
    if (savedRows.length > 0) {
      try {
        await query("DELETE FROM report_images WHERE id = ANY($1)", [savedRows]);
      } catch (dbErr) {
        console.error("Image upload rollback: failed to delete rows", savedRows, dbErr);
      }
    }
    console.error("Image upload error:", err);
    return NextResponse.json(
      { error: "Failed to upload images" },
      { status: 500 }
    );
  }
}
