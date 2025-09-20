import { NextResponse } from "next/server";

export async function GET() {
  try {
    const healthData = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "unknown",
      hasApiKey: !!(process.env.FAL_KEY || process.env.FAL_API_KEY),
      platform: process.env.VERCEL ? "vercel" : "local",
      version: "1.0.0"
    };

    return NextResponse.json(healthData);
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}