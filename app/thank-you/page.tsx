"use client";

import Link from "next/link";
import { useEffect } from "react";

// ─── Facebook Event Helpers ───────────────────────────────────────────────────
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}

async function sendServerEvent(
  eventName: string,
  customData: Record<string, any> = {},
  userData: Record<string, any> = {}
) {
  try {
    await fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventName,
        eventSourceUrl: window.location.href,
        userData: {
          fbc: getCookie("_fbc"),
          fbp: getCookie("_fbp"),
          ...userData,
        },
        customData,
      }),
    });
  } catch (err) {
    console.error("FB CAPI error:", err);
  }
}

function firePixelEvent(eventName: string, data: Record<string, any> = {}) {
  if (typeof window !== "undefined" && (window as any).fbq) {
    (window as any).fbq("track", eventName, data);
  }
}
// ─────────────────────────────────────────────────────────────────────────────

export default function ThankYouPage() {

  // ✅ Purchase event — fires once when Thank You page loads
  useEffect(() => {
    const purchaseData = {
      value: 99.00,
      currency: "USD",
      content_name: "AuraSync Pro",
      content_type: "product",
      content_ids: ["aurasync-pro"],
      num_items: 1,
    };

    // Browser pixel
    firePixelEvent("Purchase", purchaseData);

    // Server CAPI (more reliable, bypasses ad blockers)
    sendServerEvent("Purchase", purchaseData);
  }, []); // empty array = runs only once on page load

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 p-8 sm:p-10 text-center relative">
         <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>
         
         {/* Success Animation Container */}
         <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100 mb-8 relative">
            <div className="absolute inset-0 bg-green-200 rounded-full animate-ping opacity-20"></div>
            <svg className="w-12 h-12 text-green-600 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
         </div>
         
         <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Order Confirmed!</h1>
         <p className="text-gray-500 mb-8 text-lg">
           Thank you for choosing AuraSync. We've received your order and are getting it ready for shipment. You will receive an email shortly with your tracking details.
         </p>
         
         <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100 text-left">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-200 pb-2">Order summary</h3>
            <div className="flex justify-between items-center py-2 text-sm">
               <span className="text-gray-600">Product</span>
               <span className="font-medium text-gray-900">AuraSync Pro</span>
            </div>
            <div className="flex justify-between items-center py-2 text-sm">
               <span className="text-gray-600">Shipping</span>
               <span className="font-medium text-gray-900">Free</span>
            </div>
            <div className="flex justify-between items-center py-2 text-sm font-semibold border-t border-gray-200 mt-2 pt-2">
               <span className="text-gray-900">Total</span>
               <span className="text-indigo-600">$99.00</span>
            </div>
         </div>

         <div className="flex flex-col space-y-3">
           <Link
             href="/"
             className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
           >
             Return Home
           </Link>
           <button className="w-full flex justify-center items-center py-4 px-4 border border-gray-200 rounded-xl text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200">
             View Order Status
           </button>
         </div>
         
         <p className="mt-8 text-xs text-gray-400">
            Need help? Contact our support team at support@aurasync.com
         </p>
      </div>
    </div>
  );
}