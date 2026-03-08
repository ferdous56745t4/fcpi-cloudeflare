# Facebook CAPI Implementation Guide

This guide explains how to use the Facebook CAPI setup we just generated, including complete examples for `_app.js` and various page interactions.

---

## 1. Global Setup (`pages/_app.js`)

To initialize the Facebook Pixel on the client side and track page views automatically on route changes, use this complete `_app.js` file:

\`\`\`javascript
// pages/_app.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Script from 'next/script';
import { trackPageView } from '../lib/fbEvents';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    // 1. Fire initial page load
    trackPageView();

    // 2. Fire on subsequent route changes
    const handleRouteChange = () => {
      trackPageView();
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  return (
    <>
      {/* Facebook Pixel Initialization Script */}
      <Script
        id="fb-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: \`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            
            // AutoConfig false prevents Facebook from sending automatic page views 
            // without our event_id, which ruins deduplication.
            fbq('set', 'autoConfig', false, '\${process.env.NEXT_PUBLIC_FB_PIXEL_ID}');
            fbq('init', '\${process.env.NEXT_PUBLIC_FB_PIXEL_ID}');
          \`,
        }}
      />
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
\`\`\`

*(Note: If you are using the App Router (`app/layout.tsx`), you can create a `<FacebookPixel />` client component containing the `Script` tag and use `usePathname` inside a `useEffect` to trigger `trackPageView()`, then import that component into your Root Layout).*

---

## 2. Implementation Examples for Pages

### A. Product Page (`ViewContent` & `AddToCart`)

\`\`\`javascript
// pages/product/[id].js
import { useEffect } from 'react';
import { trackViewContent, trackAddToCart } from '../../lib/fbEvents';

export default function ProductPage({ product }) {
  
  useEffect(() => {
    // Fire ViewContent when the page loads
    trackViewContent({
      contents: [{ id: product.id, quantity: 1 }],
      currency: "USD",
      value: product.price
    });
  }, [product]);

  const handleAddToCart = async () => {
    // Fire AddToCart event when the button is clicked
    await trackAddToCart({
      contents: [{ id: product.id, quantity: 1 }],
      currency: "USD",
      value: product.price
    });
    
    // Proceed with adding to cart logic...
    console.log("Added to cart!");
  };

  return (
    <div>
      <h1>{product.name}</h1>
      <p>\${product.price}</p>
      <button onClick={handleAddToCart}>Add to Cart</button>
    </div>
  );
}
\`\`\`

### B. Checkout Page (`InitiateCheckout`)

\`\`\`javascript
// pages/checkout.js
import { useEffect } from 'react';
import { trackInitiateCheckout } from '../lib/fbEvents';

export default function CheckoutPage({ cartItems, cartTotal }) {
  
  useEffect(() => {
    // Fire InitiateCheckout when the checkout page loads
      const contents = cartItems.map(item => ({
        id: item.id,
        quantity: item.quantity
    }));

    trackInitiateCheckout({
      contents: contents,
      currency: "USD",
      value: cartTotal
    });
  }, [cartItems, cartTotal]);

  return (
    <div>
      <h1>Checkout</h1>
      {/* Checkout Form... */}
    </div>
  );
}
\`\`\`

### C. Order Confirmation Page (`Purchase`)

\`\`\`javascript
// pages/thank-you.js
import { useEffect } from 'react';
import { trackPurchase } from '../lib/fbEvents';

export default function ThankYouPage({ orderDetails, userDetails }) {
  
  useEffect(() => {
    // Fire Purchase event including User Data (for higher match quality)
    const contents = orderDetails.items.map(item => ({
        id: item.id,
        quantity: item.quantity
    }));

    trackPurchase(
      { // Event Data
        contents: contents,
        currency: "USD",
        value: orderDetails.total,
        orderId: orderDetails.id
      },
      { // User Data (will be automatically SHA-256 hashed by our lib)
        email: userDetails.email,
        phone: userDetails.phone,
        fn: userDetails.firstName,
        ln: userDetails.lastName,
        city: userDetails.city,
        state: userDetails.state,
        zip: userDetails.zip,
        country: userDetails.country
      }
    );
  }, [orderDetails, userDetails]);

  return (
    <div>
      <h1>Order Confirmed! Thank you!</h1>
    </div>
  );
}
\`\`\`

### D. Lead Form Submission (`Lead`)

\`\`\`javascript
// components/LeadForm.js
import { useState } from 'react';
import { trackLead } from '../lib/fbEvents';

export default function LeadForm() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // 1. Submit lead to your database/backend
    await fetch('/api/submit-lead', { method: 'POST', body: JSON.stringify({ email, firstName }) });

    // 2. Track Facebook Lead Event
    await trackLead({
        email: email,
        fn: firstName
    });

    setLoading(false);
    alert("Thanks for signing up!");
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} required />
      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
      <button type="submit" disabled={loading}>Sign Up</button>
    </form>
  );
}
\`\`\`
