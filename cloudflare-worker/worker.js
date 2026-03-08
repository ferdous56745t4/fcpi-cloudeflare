/**
 * Cloudflare Worker for Facebook Conversions API (CAPI)
 * 
 * This worker acts as a proxy between your Next.js server and Facebook's Graph API.
 * It automatically captures the real user IP (CF-Connecting-IP) and User Agent.
 */

export default {
  async fetch(request, env, ctx) {
    // 1. Handle CORS Preflight Requests (OPTIONS)
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    // Only allow POST requests
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method Not Allowed" }), { 
        status: 405,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    try {
      // 2. Parse the incoming request from the Next.js server
      const body = await request.json();
      const { pixelId, accessToken, data, testEventCode } = body;

      // Validate required fields
      if (!pixelId || !accessToken || !data || !Array.isArray(data)) {
        return new Response(JSON.stringify({ error: "Missing required fields (pixelId, accessToken, data)" }), {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }

      // 3. Automatically capture real user features from Cloudflare
      // Cloudflare sets CF-Connecting-IP to the actual user's IP address
      const cfConnectingIp = request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For");
      const userAgent = request.headers.get("User-Agent");

      // 4. Inject IP and User Agent into the event data if not already provided
      const enrichedData = data.map((event) => {
        // Ensure user_data object exists
        if (!event.user_data) {
          event.user_data = {};
        }

        // If Next.js already passed the real IP (because this proxy was called from the server), use it.
        // Otherwise, fallback to CF-Connecting-IP (useful if called directly from client).
        if (!event.user_data.client_ip_address && cfConnectingIp) {
          event.user_data.client_ip_address = cfConnectingIp;
        }

        if (!event.user_data.client_user_agent && userAgent) {
          event.user_data.client_user_agent = userAgent;
        }

        return event;
      });

      // 5. Construct Facebook CAPI Request Payload
      const fbPayload = {
        data: enrichedData,
      };

      // Add Test Event Code if provided (for debugging in Events Manager)
      if (testEventCode) {
        fbPayload.test_event_code = testEventCode;
      }

      // 6. Forward the event to Facebook Graph API v18.0
      const fbGraphUrl = `https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${accessToken}`;

      const fbResponse = await fetch(fbGraphUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(fbPayload),
      });

      // 7. Parse Facebook's Response
      const fbResult = await fbResponse.json();

      // Return Facebook's response back to the Next.js app
      return new Response(JSON.stringify(fbResult), {
        status: fbResponse.status,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });

    } catch (error) {
      // Graceful error handling
      return new Response(JSON.stringify({ error: "Worker Error: " + error.message }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }
  },
};
