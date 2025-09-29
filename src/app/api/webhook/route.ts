import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, imageUrl, action } = body;

    if (!email || !imageUrl || !action) {
      return NextResponse.json(
        { error: "Missing required fields: email, imageUrl, action" },
        { status: 400 }
      );
    }

    // N8N Webhook URL - replace with your actual N8N webhook URL
    const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || "http://localhost:5678/webhook/selfie-payment";

    console.log("Calling N8N webhook...", {
      email,
      imageUrl,
      action,
      webhookUrl: N8N_WEBHOOK_URL
    });

    // Send data to N8N including the image URL for Airtable storage (via GET with query params)
    const params = new URLSearchParams({
      email,
      imageUrl, // This is now a Vercel Blob URL that Airtable can store
      action,
      timestamp: new Date().toISOString(),
      hasImage: imageUrl ? "true" : "false",
    });

    const n8nResponse = await fetch(`${N8N_WEBHOOK_URL}?${params}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("N8N Response Status:", n8nResponse.status, n8nResponse.statusText);

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error("N8N webhook failed:", n8nResponse.status, n8nResponse.statusText);
      console.error("N8N Error Body:", errorText);

      // If 404, the test webhook is not active - provide a mock response for testing
      if (n8nResponse.status === 404) {
        console.log("Test webhook not active, using mock response for development");
        const mockResponse = {
          requiresPayment: true,
          paymentUrl: "https://buy.stripe.com/test_14k17EcAE2R01tS289", // Test Stripe URL
          canProcess: false,
          userExists: false,
          message: "Test webhook not active - payment required"
        };
        console.log("Mock N8N response:", mockResponse);
        return NextResponse.json(mockResponse);
      }

      return NextResponse.json(
        { error: "Webhook processing failed", details: errorText },
        { status: 500 }
      );
    }

    const responseText = await n8nResponse.text();
    console.log("N8N Raw Response:", responseText);

    let n8nData;
    try {
      n8nData = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse N8N response as JSON:", parseError);
      console.error("Response was:", responseText);
      return NextResponse.json(
        { error: "Invalid webhook response format" },
        { status: 500 }
      );
    }

    console.log("N8N Parsed Data:", n8nData);

    // Expected N8N response format:
    // {
    //   "requiresPayment": true/false,
    //   "paymentUrl": "https://checkout.stripe.com/...", // if requiresPayment is true
    //   "canProcess": true/false, // true if already paid or payment not required
    //   "userExists": true/false,
    //   "message": "User created and payment required" / "User already paid, can process"
    // }

    return NextResponse.json(n8nData);

  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}