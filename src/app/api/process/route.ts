import { NextRequest, NextResponse } from "next/server";
import { processImageWithFAL } from "@/lib/fal";
import { readFile } from "fs/promises";
import { join } from "path";

export async function POST(request: NextRequest) {
  try {
    const { selfieUrl, referenceUrl, prompt } = await request.json();

    if (!selfieUrl || !referenceUrl) {
      return NextResponse.json({
        error: "Both selfie URL and reference URL are required"
      }, { status: 400 });
    }

    // Helper function to convert local file to base64
    const convertToBase64 = async (imageUrl: string) => {
      const filePath = join(process.cwd(), "public", imageUrl);

      try {
        const fileBuffer = await readFile(filePath);
        const extension = imageUrl.split('.').pop()?.toLowerCase();
        let mimeType = "image/jpeg"; // default
        if (extension === "png") mimeType = "image/png";
        else if (extension === "gif") mimeType = "image/gif";
        else if (extension === "webp") mimeType = "image/webp";

        const base64String = fileBuffer.toString('base64');
        return `data:${mimeType};base64,${base64String}`;
      } catch (fileError) {
        console.error("File read error for", imageUrl, ":", fileError);
        throw new Error(`Could not read file: ${imageUrl}`);
      }
    };

    // Convert both images to base64
    const selfieDataUrl = await convertToBase64(selfieUrl);
    const referenceDataUrl = await convertToBase64(referenceUrl);

    console.log("Processing with FAL.ai:", {
      selfieUrl: "base64 data URL (selfie)",
      referenceUrl: "base64 data URL (reference)",
      prompt: prompt || "Using two reference photos (person A, person B), create a selfie style image where both are smiling and standing close together. Lighting: soft golden hour sunlight, warm tones. Background: beach at sunset with gentle waves. Both are looking at the camera. Maintain facial features, skin tone, hairstyle from the reference photos. High detail, photorealistic, slight depth of field, vertical format (9:16)."
    });

    // Process both images with FAL.ai nano-banana/edit API
    const result = await processImageWithFAL(
      selfieDataUrl,
      referenceDataUrl,
      prompt || "Using two reference photos (person A, person B), create a selfie style image where both are smiling and standing close together. Lighting: soft golden hour sunlight, warm tones. Background: beach at sunset with gentle waves. Both are looking at the camera. Maintain facial features, skin tone, hairstyle from the reference photos. High detail, photorealistic, slight depth of field, vertical format (9:16)."
    );

    return NextResponse.json({
      success: true,
      result: result
    });

  } catch (error) {
    console.error("Processing error:", error);

    // Enhanced error response with details for debugging
    let errorMessage = "Failed to process image";
    let errorDetails: Record<string, unknown> = {};

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      };
    }

    // Check for specific FAL.ai validation errors
    if (error && typeof error === 'object' && 'status' in error) {
      if (error.status === 422) {
        errorMessage = "Validation error: Please check image URL format and parameters";
        errorDetails.status = 422;
        errorDetails.type = "ValidationError";
      }
    }

    console.error("Detailed error info:", errorDetails);

    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      },
      { status: 500 }
    );
  }
}