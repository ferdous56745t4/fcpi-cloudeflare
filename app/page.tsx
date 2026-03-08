"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

// ─── Facebook Event Helper ───────────────────────────────────────────────────
// Reads _fbc and _fbp cookies automatically
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}

// Sends event to your Next.js API route → Cloudflare Worker → Facebook CAPI
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

// Also fires browser-side pixel event (for deduplication with server event)
function firePixelEvent(eventName: string, data: Record<string, any> = {}) {
  if (typeof window !== "undefined" && (window as any).fbq) {
    (window as any).fbq("track", eventName, data);
  }
}
// ─────────────────────────────────────────────────────────────────────────────

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // ✅ ViewContent — fires when page loads
  useEffect(() => {
    const eventData = { content_name: "AuraSync Pro", content_type: "product", value: 99, currency: "USD" };

    // Browser pixel
    firePixelEvent("ViewContent", eventData);

    // Server CAPI
    sendServerEvent("ViewContent", eventData);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const form = e.currentTarget;
    const phone = (form.elements.namedItem("phone") as HTMLInputElement)?.value || "";
    const name = (form.elements.namedItem("name") as HTMLInputElement)?.value || "";

    const customData = {
      value: 99,
      currency: "USD",
      content_name: "AuraSync Pro",
      content_type: "product",
    };

    const userData = {
      phone: phone,      // will be SHA256 hashed in lib/fbcapi.js
      fn: name.split(" ")[0] || "",
      ln: name.split(" ")[1] || "",
    };

    // ✅ Lead event — fires on form submit
    firePixelEvent("Lead", customData);
    await sendServerEvent("Lead", customData, userData);

    // ✅ InitiateCheckout event
    firePixelEvent("InitiateCheckout", customData);
    await sendServerEvent("InitiateCheckout", customData, userData);

    setTimeout(() => {
      router.push("/thank-you");
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0 flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl leading-none">A</span>
              </div>
              <span className="font-bold text-xl tracking-tight">AuraSync</span>
            </div>
            <div>
              <a href="#order" className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Order Now
              </a>
            </div>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-center">
              <div className="lg:col-span-6 text-center lg:text-left z-10 relative">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium mb-6 animate-fade-in-up">
                  <span className="flex h-2 w-2 rounded-full bg-indigo-600"></span>
                  New Release 2026
                </div>
                <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-gray-900 mb-6 leading-[1.1]">
                  Elevate your <br className="hidden lg:block"/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">daily work</span>
                </h1>
                <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto lg:mx-0 mb-10 leading-relaxed">
                  Experience seamless productivity with AuraSync. Designed for professionals who demand excellence and elegant simplicity in their workflow.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <a href="#order" className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold rounded-full text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
                    Get Yours Today
                  </a>
                  <a href="#features" className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold rounded-full text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200">
                    Learn More
                  </a>
                </div>
                
                <div className="mt-10 flex items-center justify-center lg:justify-start gap-4 text-sm text-gray-500">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className={`w-8 h-8 rounded-full border-2 border-white bg-gray-${i*100+100} relative overflow-hidden`}>
                         <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-400"></div>
                      </div>
                    ))}
                  </div>
                  <p>Trusted by <span className="font-semibold text-gray-900">10,000+</span> users</p>
                </div>
              </div>
              
              <div className="hidden lg:block lg:col-span-6 relative mt-16 lg:mt-0">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-100 to-purple-50 rounded-full blur-3xl opacity-60 transform translate-x-10 translate-y-10"></div>
                <div className="relative w-full aspect-square max-w-lg mx-auto">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-2xl transform rotate-3 scale-105 border border-white/50 backdrop-blur-sm"></div>
                    <div className="absolute inset-0 bg-white rounded-2xl shadow-2xl overflow-hidden flex items-center justify-center p-8">
                       <div className="w-full h-full border border-gray-100 rounded-xl bg-gray-50 flex items-center justify-center relative overflow-hidden group">
                          <div className="w-48 h-64 bg-white rounded-xl shadow-sm border border-gray-100 absolute z-10 transform group-hover:scale-105 transition-transform duration-500 group-hover:-rotate-2">
                             <div className="w-full h-12 border-b border-gray-50 bg-gray-50/50 rounded-t-xl flex items-center px-4 gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                             </div>
                             <div className="p-4 space-y-3">
                                <div className="w-full h-4 bg-gray-100 rounded-md"></div>
                                <div className="w-3/4 h-4 bg-gray-100 rounded-md"></div>
                                <div className="w-5/6 h-4 bg-gray-100 rounded-md"></div>
                             </div>
                          </div>
                          <div className="w-56 h-40 bg-indigo-600 rounded-xl shadow-lg absolute -right-8 -bottom-8 z-20 transform group-hover:scale-105 transition-transform duration-500 group-hover:rotate-3 flex flex-col justify-between p-4 mix-blend-multiply">
                              <div className="flex justify-between items-center">
                                 <div className="w-8 h-6 bg-white/20 rounded-md"></div>
                                 <svg className="w-6 h-6 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                 </svg>
                              </div>
                              <div className="space-y-1">
                                <div className="w-1/2 h-2 text-white/80 rounded-full font-mono text-xs">AuraSync</div>
                              </div>
                          </div>
                       </div>
                    </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights */}
        <section id="features" className="py-20 bg-white">
           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto mb-16">
                 <h2 className="text-3xl font-bold text-gray-900 mb-4">Crafted for perfection</h2>
                 <p className="text-lg text-gray-600">Every detail has been meticulously designed to provide you with the smoothest experience possible.</p>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                 {[
                    { title: "Lightning Fast", desc: "Optimized for speed. Get your work done in record time without any lag.", icon: "zap" },
                    { title: "Bank-grade Security", desc: "Your data is encrypted and protected with state-of-the-art security protocols.", icon: "shield" },
                    { title: "Cloud Sync", desc: "Access your workspace from anywhere. Seamlessly syncing across all your devices.", icon: "cloud" }
                 ].map((feature, idx) => (
                    <div key={idx} className="p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:border-indigo-100 hover:shadow-md transition-all group">
                       <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                          {feature.icon === 'zap' && <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                          {feature.icon === 'shield' && <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
                          {feature.icon === 'cloud' && <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>}
                       </div>
                       <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                       <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
                    </div>
                 ))}
              </div>
           </div>
        </section>

        {/* Order Form Section */}
        <section id="order" className="py-24 bg-gray-50 relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
              <div className="px-6 py-8 sm:p-10">
                <div className="text-center mb-10">
                  <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Secure Your Order</h2>
                  <p className="text-gray-500">Fill in your details below and we'll get your AuraSync shipped immediately.</p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-8">
                    <div className="sm:col-span-2">
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                      <div className="mt-2 text-gray-900">
                        <input type="text" name="name" id="name" required className="block w-full rounded-xl border-gray-300 px-4 py-3 bg-gray-50 border focus:bg-white focus:border-indigo-500 focus:ring-indigo-500 transition-colors shadow-sm" placeholder="John Doe" />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
                      <div className="mt-2 text-gray-900">
                        <input type="tel" name="phone" id="phone" required className="block w-full rounded-xl border-gray-300 px-4 py-3 bg-gray-50 border focus:bg-white focus:border-indigo-500 focus:ring-indigo-500 transition-colors shadow-sm" placeholder="+1 (555) 000-0000" />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700">Delivery Address</label>
                      <div className="mt-2 text-gray-900">
                        <textarea id="address" name="address" rows={3} required className="block w-full rounded-xl border-gray-300 px-4 py-3 bg-gray-50 border focus:bg-white focus:border-indigo-500 focus:ring-indigo-500 transition-colors shadow-sm" placeholder="123 Main St, Apt 4B, New York, NY 10001"></textarea>
                      </div>
                    </div>
                    
                    <div className="sm:col-span-2">
                       <label className="block text-sm font-medium text-gray-700 mb-3">Select Package</label>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <label className="relative flex cursor-pointer rounded-xl border bg-white p-4 shadow-sm focus:outline-none border-indigo-600 ring-1 ring-indigo-600">
                             <input type="radio" name="package" value="pro" className="sr-only" defaultChecked />
                             <span className="flex flex-1">
                                <span className="flex flex-col">
                                   <span className="block text-sm font-medium text-gray-900">Pro Tier</span>
                                   <span className="mt-1 flex items-center text-sm text-gray-500">All features included</span>
                                   <span className="mt-2 text-sm font-bold text-indigo-600">$99.00</span>
                                </span>
                             </span>
                             <svg className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                             </svg>
                          </label>
                       </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed group"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                           <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                           </svg>
                           Processing...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                           Complete Purchase
                           <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        </span>
                      )}
                    </button>
                    <p className="mt-4 text-center text-xs text-gray-500 flex items-center justify-center gap-1">
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                       Payments are secure and encrypted.
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-4">
               <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold text-sm leading-none">A</span>
               </div>
               <span className="font-bold text-lg tracking-tight">AuraSync</span>
            </div>
            <p className="text-gray-500 text-sm">© 2026 AuraSync Inc. All rights reserved.</p>
         </div>
      </footer>
    </div>
  );
}