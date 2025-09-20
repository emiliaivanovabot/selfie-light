import { NextRequest, NextResponse } from "next/server";

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

    // Convert file to arrayBuffer and then to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename for reference (though we won't store the file)
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `selfie-${timestamp}-${sanitizedName}`;

    // CRITICAL: For Vercel production, we NEVER write files to disk
    // Instead, convert directly to base64 data URL for immediate use
    const base64Data = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64Data}`;

    console.log("Upload successful:", {
      filename,
      size: file.size,
      type: file.type,
      isDataUrl: dataUrl.startsWith('data:'),
      dataUrlLength: dataUrl.length
    });

    return NextResponse.json({
      message: "File uploaded successfully",
      url: dataUrl,
      filename: filename,
      size: file.size,
      type: file.type,
      isBase64: true
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({
      error: "Failed to upload file",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}