"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";

function track(event_type: "visitor" | "cta_click") {
  void fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event_type, source: "landing" }),
    keepalive: true,
  }).catch(() => undefined);
}

export function LandingTracker() {
  useEffect(() => {
    track("visitor");
  }, []);

  return null;
}

export function CtaTrackerButton({ children, className, href }: { children: ReactNode; className?: string; href: string }) {
  return (
    <a
      href={href}
      className={className}
      onClick={() => track("cta_click")}
    >
      {children}
    </a>
  );
}
