// pages/api/track.js

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const eventData = req.body;

    // Load credentials from Environment
    const PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID;
    const ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;
    const CF_WORKER_URL = process.env.NEXT_PUBLIC_CLOUDFLARE_WORKER_URL;

    if (!PIXEL_ID || !ACCESS_TOKEN || !CF_WORKER_URL) {
      console.error("Missing Environment Variables. Ensure .env.local is configured.");
      return res.status(500).json({ error: 'Server Configuration Error' });
    }

    // Capture the client's real IP address.
    // Why? Because this server (Vercel) intercepts the request. If Vercel makes the request 
    // to Cloudflare, Cloudflare thinks Vercel's IP is the user's IP.
    // By passing it in `user_data`, our Cloudflare Worker can use the REAL user IP.
    const forwardedFor = req.headers['x-forwarded-for'] || req.headers['x-real-ip'];
    let clientIp = "";
    if (forwardedFor) {
      // x-forwarded-for can be a comma-separated list; the first one is the original client
      clientIp = forwardedFor.split(',')[0].trim();
    }

    if (clientIp) {
      if (!eventData.user_data) eventData.user_data = {};
      eventData.user_data.client_ip_address = clientIp;
    }

    // Construct Payload for Cloudflare Worker
    const payload = {
      pixelId: PIXEL_ID,
      accessToken: ACCESS_TOKEN,
      data: [eventData],
      // testEventCode: "TEST12345" // Uncomment when testing in FB Events Manager
    };

    // Forward to Cloudflare Worker
    const cfResponse = await fetch(CF_WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await cfResponse.json();

    if (!cfResponse.ok) {
       console.error("Cloudflare Worker Error:", result);
       return res.status(cfResponse.status).json({ error: "Failed to send to Facebook CAPI via Worker", details: result });
    }

    // Return success to the client
    return res.status(200).json({ success: true, result });
  } catch (error) {
    console.error("API Track Error:", error);
    // Return gracefully without crashing the app
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
