"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

export function GA4Script() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hostname = window.location.hostname;
    // Load GA4 only on salonapp.pro, not on salon subdomains (*.salonapp.pro)
    const isSalonSubdomain = /^(?!www\.)[^.]+\.salonapp\.pro(:\d+)?$/.test(hostname);
    if (!isSalonSubdomain) setShow(true);
  }, []);

  if (!show) return null;

  return (
    <>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-PXV7BT1S03"
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-PXV7BT1S03');`}
      </Script>
    </>
  );
}
