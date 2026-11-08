import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { query } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_FILES_PER_REQUEST = 3;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request, { params }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const { id } = await params;

    // Verify report exists and user owns it (or is admin)
    const reportCheck = await query(
      "SELECT id, user_id FROM reports WHERE id = $1",
      [id]
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

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), "public", "uploads", "reports");
    await mkdir(uploadDir, { recursive: true });

    const savedImages = [];

    for (const file of files) {
      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.type}. Use JPG, PNG, or WebP.` },
          { status: 400 }
        );
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File too large: ${file.name}. Max 5 MB.` },
          { status: 400 }
        );
      }

      // Generate unique filename
      const ext = file.type.split("/")[1].replace("jpeg", "jpg");
      const filename = `${id}-${randomUUID()}.${ext}`;
      const filepath = path.join(uploadDir, filename);

      // Write file
      const arrayBuffer = await file.arrayBuffer();
      await writeFile(filepath, Buffer.from(arrayBuffer));

      // Insert into DB
      const url = `/uploads/reports/${filename}`;
      const { rows } = await query(
        `INSERT INTO report_images (report_id, url)
         VALUES ($1, $2)
         RETURNING id, url`,
        [id, url]
      );

      savedImages.push(rows[0]);
    }

    return NextResponse.json({ images: savedImages }, { status: 201 });
  } catch (err) {
    console.error("Image upload error:", err);
    return NextResponse.json(
      { error: "Failed to upload images" },
      { status: 500 }
    );
  }
}
