/**
 * Per-shop marketing tags: Google Analytics 4 (gtag.js) and the Meta/Facebook
 * Pixel, injected ONLY when the seller pasted their IDs in Settings. IDs are
 * strictly validated server-side (digits / G-XXXX format), so nothing but the
 * official snippets with a clean ID can ever render here.
 */
export function ShopTracking({ fbPixelId, gaMeasurementId }: { fbPixelId: string | null; gaMeasurementId: string | null }) {
  if (!fbPixelId && !gaMeasurementId) return null;
  return (
    <>
      {gaMeasurementId && (
        <>
          <script async src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaMeasurementId)}`} />
          <script
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaMeasurementId}');`,
            }}
          />
        </>
      )}
      {fbPixelId && (
        <>
          <script
            dangerouslySetInnerHTML={{
              __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${fbPixelId}');fbq('track','PageView');`,
            }}
          />
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element -- official pixel noscript fallback */}
            <img height="1" width="1" style={{ display: "none" }} alt="" src={`https://www.facebook.com/tr?id=${encodeURIComponent(fbPixelId)}&ev=PageView&noscript=1`} />
          </noscript>
        </>
      )}
    </>
  );
}
