// lib/fbEvents.js
import { getFBCookies, generateEventId, sendToServerCAPI, hashData } from "./fbcapi";

/**
 * Universal event tracker that fires BOTH standard browser Pixel events
 * and forwards the exact same event over to our CAPI API Route.
 * Facebook will deduplicate these using the shared "event_id".
 */
export async function trackEvent(eventName, customData = {}, userData = {}) {
  try {
    const eventId = generateEventId();
    const cookies = getFBCookies();

    // 1. FIRE BROWSER-SIDE PIXEL EVENT
    // Check if the Facebook Pixel script (fbq) is loaded on the client window
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", eventName, customData, { eventID: eventId });
    } else {
        console.warn("Facebook Pixel (fbq) not found on window. Client-side event might not fire.");
    }

    // 2. HASHS SENSITIVE USER DATA FOR CAPI
    // We must hash PII (email, phone, etc) using SHA-256 before sending to Facebook
    const hashedUserData = {
      // Pass client browser details if we are on the client
      client_user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      fbp: cookies.fbp, // Browser ID
      fbc: cookies.fbc, // Click ID
    };

    // Hash specific user details if provided
    if (userData.email) hashedUserData.em = await hashData(userData.email);
    if (userData.phone) hashedUserData.ph = await hashData(userData.phone);
    if (userData.fn) hashedUserData.fn = await hashData(userData.fn);
    if (userData.ln) hashedUserData.ln = await hashData(userData.ln);
    if (userData.city) hashedUserData.ct = await hashData(userData.city);
    if (userData.state) hashedUserData.st = await hashData(userData.state);
    if (userData.zip) hashedUserData.zp = await hashData(userData.zip);
    if (userData.country) hashedUserData.country = await hashData(userData.country);
    if (userData.external_id) hashedUserData.external_id = await hashData(userData.external_id);

    // 3. PREPARE SERVER-SIDE CAPI EVENT PAYLOAD
    // The exact same event goes to the API route to be forwarded to Cloudflare
    const serverEventData = {
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000), // Current time in Unix timestamp (seconds)
      action_source: "website",
      event_id: eventId, // Critical for deduplication against the browser event
      event_source_url: typeof window !== "undefined" ? window.location.href : "", // The page where the event happened
      user_data: hashedUserData,
      custom_data: customData, // Pass contents, value, currency, etc.
    };

    // 4. FIRE SERVER-SIDE EVENT (Proxy via API)
    await sendToServerCAPI(serverEventData);
    
    // Return the eventId tracking in case calling code needs to reference it
    return eventId;
  } catch (error) {
    console.error(\`Meta Event Tracking Error [\${eventName}]:\`, error);
  }
}

// ==========================================
// Standard Facebook Event Functions
// ==========================================

export const trackPageView = () => {
  return trackEvent("PageView");
};

export const trackViewContent = ({ contents, currency = "USD", value = 0 }) => {
  return trackEvent("ViewContent", { content_type: "product", contents, currency, value });
};

export const trackAddToCart = ({ contents, currency = "USD", value = 0 }) => {
  return trackEvent("AddToCart", { content_type: "product", contents, currency, value });
};

export const trackInitiateCheckout = ({ contents, currency = "USD", value = 0 }) => {
  return trackEvent("InitiateCheckout", { content_type: "product", contents, currency, value });
};

export const trackPurchase = ({ contents, currency = "USD", value, orderId }, userData = {}) => {
  return trackEvent("Purchase", { 
      content_type: "product", 
      contents, 
      currency, 
      value,
      order_id: orderId 
    }, 
    userData
  );
};

export const trackLead = (userData = {}) => {
  return trackEvent("Lead", {}, userData);
};

export const trackCompleteRegistration = (userData = {}) => {
  return trackEvent("CompleteRegistration", {}, userData);
};
