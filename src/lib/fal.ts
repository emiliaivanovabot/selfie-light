import * as fal from "@fal-ai/serverless-client";

// Configure FAL client
fal.config({
  credentials: process.env.FAL_KEY,
});

export interface EditRequest {
  prompt: string;
  image_urls: string[];
  num_images?: number;
  output_format?: "jpeg" | "png";
  sync_mode?: boolean;
}

export interface EditResponse {
  images: Array<{
    url: string;
    width?: number;
    height?: number;
  }>;
  description?: string;
}

export async function processImageWithFAL(
  selfieUrl: string,
  referenceUrl: string,
  prompt: string = "Using two reference photos (person A, person B), create a selfie style image where both are smiling and standing close together. Lighting: soft golden hour sunlight, warm tones. Background: beach at sunset with gentle waves. Both are looking at the camera. Maintain facial features, skin tone, hairstyle from the reference photos. High detail, photorealistic, slight depth of field, vertical format (9:16)."
): Promise<EditResponse> {
  try {
    console.log("FAL.ai request params:", {
      prompt,
      image_urls: [selfieUrl, referenceUrl],
      num_images: 1,
      output_format: "jpeg"
    });

    const result = await fal.subscribe("fal-ai/nano-banana/edit", {
      input: {
        prompt: prompt,
        image_urls: [selfieUrl, referenceUrl],
        num_images: 1,
        output_format: "jpeg" as const,
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log("Processing image...", update.logs?.map(log => log.message).join(", "));
        }
      },
    });

    console.log("FAL.ai response:", result);
    return result as EditResponse;
  } catch (error) {
    console.error("FAL.ai processing error:", error);

    // Enhanced error logging for debugging
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }

    // Re-throw with more context for upstream handling
    throw error;
  }
}