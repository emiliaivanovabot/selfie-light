import { NextResponse } from "next/server";
import { getRandomScenes } from "@/lib/fal";

export async function GET() {
  try {
    const scenes = getRandomScenes();
    return NextResponse.json({ scenes });
  } catch (error) {
    console.error("Error generating random scenes:", error);
    return NextResponse.json(
      { error: "Failed to generate scenes" },
      { status: 500 }
    );
  }
}