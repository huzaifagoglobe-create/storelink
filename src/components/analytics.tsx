import Script from "next/script";

// Loads analytics only if configured via env. Set ONE of:
//   NEXT_PUBLIC_GA_ID            (e.g. G-XXXXXXX)  -> Google Analytics 4
//   NEXT_PUBLIC_PLAUSIBLE_DOMAIN (e.g. storelink.pk) -> Plausible
export function Analytics() {
  const ga = process.env.NEXT_PUBLIC_GA_ID;
  const plausible = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

  if (plausible) {
    return (
      <Script
        src="https://plausible.io/js/script.js"
        data-domain={plausible}
        strategy="afterInteractive"
      />
    );
  }
  if (ga) {
    return (
      <>
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} strategy="afterInteractive" />
        <Script id="ga4" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga}');`}
        </Script>
      </>
    );
  }
  return null;
}
