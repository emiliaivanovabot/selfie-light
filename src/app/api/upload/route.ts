import { NextRequest, NextResponse } from "next/server";
import { put } from '@vercel/blob';

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

    // Check if BLOB_READ_WRITE_TOKEN exists
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("BLOB_READ_WRITE_TOKEN not configured");
      return NextResponse.json({
        error: "Server configuration error",
        details: "Blob storage not configured"
      }, { status: 500 });
    }

    // Convert file to arrayBuffer for Vercel Blob upload
    const bytes = await file.arrayBuffer();

    // Create unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `selfie-${timestamp}-${sanitizedName}`;

    console.log("Attempting upload:", {
      filename,
      size: file.size,
      type: file.type,
      hasToken: !!process.env.BLOB_READ_WRITE_TOKEN
    });

    // Upload to Vercel Blob Storage with explicit token
    const blob = await put(filename, bytes, {
      access: 'public',
      contentType: file.type,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    console.log("Upload successful:", {
      filename,
      size: file.size,
      type: file.type,
      url: blob.url
    });

    return NextResponse.json({
      message: "File uploaded successfully",
      url: blob.url,
      filename: filename,
      size: file.size,
      type: file.type,
      isBase64: false,
      blobUrl: blob.url
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({
      error: "Failed to upload file",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}