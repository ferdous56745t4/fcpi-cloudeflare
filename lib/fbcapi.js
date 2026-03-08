// lib/fbcapi.js

/**
 * Generates a SHA-256 hash of a string.
 * Native implementation using Web Crypto API.
 * Used for hashing user data (email, phone, name, etc.) before sending to Facebook.
 */
export async function hashData(string) {
  if (!string) return "";
  
  // Facebook requires lowercase, trimmed strings before hashing
  const normalizedString = string.trim().toLowerCase();
  
  const utf8 = new TextEncoder().encode(normalizedString);
  const hashBuffer = await crypto.subtle.digest("SHA-256", utf8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  
  return hashHex;
}

/**
 * Helper function to retrieve a cookie value by name.
 * Safe to call on the server or client.
 */
export function getCookie(name) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  if (match) return match[2];
  return null;
}

/**
 * Retrieves Facebook's click ID and browser ID cookies.
 * These are essential for browser-server deduplication and matching.
 */
export function getFBCookies() {
  return {
    fbp: getCookie("_fbp") || undefined,
    fbc: getCookie("_fbc") || undefined,
  };
}

/**
 * Generates a unique event ID for deduplication.
 * Ensures the Server CAPI event and Browser Pixel event share the exact same ID.
 */
export function generateEventId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return \`evt_\${Date.now()}_\${Math.floor(Math.random() * 100000)}\`;
}

/**
 * Sends event data to our Next.js API route (/api/track),
 * which then safely forwards it to the Cloudflare Worker without exposing secrets.
 */
export async function sendToServerCAPI(eventData) {
  try {
    const response = await fetch("/api/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to forward CAPI event from API Route:", errorData);
    }
  } catch (error) {
    console.error("CAPI send error:", error);
  }
}
