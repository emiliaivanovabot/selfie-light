import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;

    if (!file) {
      return NextResponse.json({ error: "No file received" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Please upload an image file" }, { status: 400 });
    }

    // Validate file size (max 10MB)
    const maxSize = parseInt(process.env.MAX_FILE_SIZE || "10485760", 10);
    if (file.size > maxSize) {
      return NextResponse.json({ error: `File size too large. Max ${Math.round(maxSize / 1024 / 1024)}MB allowed.` }, { status: 400 });
    }

    // Validate MIME types
    const allowedTypes = (process.env.ALLOWED_MIME_TYPES || "image/jpeg,image/jpg,image/png,image/webp").split(",");
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "File type not allowed. Please upload JPG, PNG, or WebP images." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `selfie-${timestamp}-${sanitizedName}`;

    // CRITICAL: Vercel serverless functions can ONLY write to /tmp directory
    const uploadDir = process.env.UPLOAD_DIR || "/tmp";
    const filePath = join(uploadDir, filename);

    // Create uploads directory if it doesn't exist (for /tmp)
    const { mkdir } = await import("fs/promises");
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch {
      // Directory might already exist
    }

    await writeFile(filePath, buffer);

    // For Vercel, we need to return a data URL since files in /tmp are not publicly accessible
    const base64Data = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64Data}`;

    return NextResponse.json({
      message: "File uploaded successfully",
      url: dataUrl,
      filename: filename,
      filePath: filePath,
      size: file.size,
      type: file.type
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({
      error: "Failed to upload file",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}