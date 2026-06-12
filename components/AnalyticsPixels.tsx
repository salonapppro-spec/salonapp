/** Server component — injects FB Pixel, GTM, and Clarity scripts per tenant. */

// Only alphanumeric, hyphens and underscores — guards against XSS in dangerouslySetInnerHTML
function safeId(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const clean = raw.trim().replace(/[^A-Za-z0-9_\-]/g, "");
  return clean.length > 0 ? clean : null;
}

export function AnalyticsPixels(props: {
  facebookPixelId?: string | null;
  gtmId?: string | null;
  clarityId?: string | null;
  ga4MeasurementId?: string | null;
}) {
  const pixelId = safeId(props.facebookPixelId);
  const gtmId = safeId(props.gtmId);
  const clarityId = safeId(props.clarityId);
  const ga4Id = safeId(props.ga4MeasurementId);

  return (
    <>
      {ga4Id && (
        <>
          {/* eslint-disable-next-line @next/next/next-script-for-ga */}
          <script async src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`} />
          <script
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4Id}');`,
            }}
          />
        </>
      )}

      {pixelId && (
        <>
          <script
            dangerouslySetInnerHTML={{
              __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');fbq('track','PageView');`,
            }}
          />
          <noscript dangerouslySetInnerHTML={{ __html: `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1" alt="" />` }} />
        </>
      )}

      {gtmId && (
        // eslint-disable-next-line @next/next/next-script-for-ga
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`,
          }}
        />
      )}

      {clarityId && (
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,"clarity","script","${clarityId}");`,
          }}
        />
      )}
    </>
  );
}
