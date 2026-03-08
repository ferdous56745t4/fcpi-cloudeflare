import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// SHA256 hash for PII data
function hash(value: string): string {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventName, eventSourceUrl, userData = {}, customData = {} } = body;

    // Get real user IP
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    const userAgent = req.headers.get("user-agent") || "";

    // Build user_data with hashing
    const user_data: Record<string, any> = {
      client_ip_address: ip,
      client_user_agent: userAgent,
    };

    if (userData.email) user_data.em = hash(userData.email);
    if (userData.phone) user_data.ph = hash(userData.phone.replace(/\D/g, ""));
    if (userData.fn)    user_data.fn = hash(userData.fn);
    if (userData.ln)    user_data.ln = hash(userData.ln);
    if (userData.fbc)   user_data.fbc = userData.fbc;
    if (userData.fbp)   user_data.fbp = userData.fbp;

    // Send to Cloudflare Worker
    const workerUrl = process.env.NEXT_PUBLIC_CLOUDFLARE_WORKER_URL!;

    const payload = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          action_source: "website",
          event_source_url: eventSourceUrl || "",
          user_data,
          custom_data: customData,
        },
      ],
    };

    const response = await fetch(workerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("CAPI error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
