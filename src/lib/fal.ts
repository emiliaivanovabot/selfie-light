import * as fal from "@fal-ai/serverless-client";

// Configure FAL client
fal.config({
  credentials: process.env.FAL_KEY || process.env.FAL_API_KEY,
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

// ALLE verfügbaren Szenen
const ALL_SCENE_VARIATIONS = [
  "Two people taking a selfie together at a beach during sunset with ocean waves",
  "Two people taking a selfie on a rooftop at night with city lights",
  "Two people taking a selfie at a wedding party with decorations and string lights",
  "Two people taking a selfie at a night party with colorful lights and crowd",
  "Two people taking a selfie at a music festival with stage in background",
  "Two people taking a selfie in a forest with trees and nature",
  "Two people taking a selfie in bright daylight in a park",
  "Two people taking a selfie during golden hour evening light",
  "Two people taking a selfie at an elegant restaurant with candles",
  "Two people taking a selfie at a street cafe with people in background",
  "Two people taking a selfie in a modern art gallery with paintings",
  "Two people taking a selfie at a mountain viewpoint with landscape"
];

// Wähle RANDOM 4 Szenen für diesen User
export function getRandomScenes(): string[] {
  const shuffled = [...ALL_SCENE_VARIATIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 4);
}

export async function processImageWithFAL(
  selfieUrl: string,
  referenceUrl: string,
  prompt?: string,
  promptIndex?: number,
  selectedScenes?: string[]
): Promise<EditResponse> {
  try {
    // Use provided prompt or select from random scenes
    let selectedPrompt: string;
    if (prompt) {
      selectedPrompt = prompt;
    } else if (selectedScenes && promptIndex !== undefined && promptIndex >= 0 && promptIndex < selectedScenes.length) {
      selectedPrompt = selectedScenes[promptIndex];
    } else {
      // Fallback: use first scene from ALL_SCENE_VARIATIONS
      selectedPrompt = ALL_SCENE_VARIATIONS[0];
    }

    console.log("FAL.ai request params:", {
      prompt: selectedPrompt,
      image_urls: [selfieUrl, referenceUrl],
      num_images: 1,
      output_format: "jpeg"
    });

    const result = await fal.subscribe("fal-ai/nano-banana/edit", {
      input: {
        prompt: selectedPrompt,
        image_urls: [selfieUrl, referenceUrl],
        num_images: 1  // NUR 1 Bild pro Request
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