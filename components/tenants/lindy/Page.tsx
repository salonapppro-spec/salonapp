"use client";

import { useState, useEffect } from "react";
import type { SalonData } from "@/types/database";

export function LindySite({ data }: { data: SalonData }) {
  const { tenant } = data;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <style>{`
        @keyframes lindy-fade-up {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lindy-line-grow {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        @keyframes lindy-pulse-dot {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50%       { opacity: 1;   transform: scale(1.2); }
        }
        @keyframes lindy-spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes lindy-glow {
          0%, 100% { box-shadow: 0 0 32px color-mix(in srgb, var(--color-primary) 20%, transparent); }
          50%       { box-shadow: 0 0 64px color-mix(in srgb, var(--color-primary) 40%, transparent); }
        }

        .lindy-root {
          min-height: 100svh;
          background: var(--color-bg);
          color: var(--color-text);
          font-family: var(--font-family, 'Inter', sans-serif);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          padding: 40px 24px;
        }

        /* Subtle radial gradient background glow */
        .lindy-bg-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(
            ellipse 70% 60% at 50% 40%,
            color-mix(in srgb, var(--color-primary) 8%, transparent) 0%,
            transparent 70%
          );
          pointer-events: none;
        }

        /* Decorative corner ornaments */
        .lindy-corner {
          position: absolute;
          width: 80px;
          height: 80px;
          border-color: color-mix(in srgb, var(--color-primary) 22%, transparent);
          border-style: solid;
        }
        .lindy-corner-tl {
          top: 28px; left: 28px;
          border-width: 1px 0 0 1px;
        }
        .lindy-corner-tr {
          top: 28px; right: 28px;
          border-width: 1px 1px 0 0;
        }
        .lindy-corner-bl {
          bottom: 28px; left: 28px;
          border-width: 0 0 1px 1px;
        }
        .lindy-corner-br {
          bottom: 28px; right: 28px;
          border-width: 0 1px 1px 0;
        }
        @media (max-width: 480px) {
          .lindy-corner { width: 48px; height: 48px; }
          .lindy-corner-tl { top: 16px; left: 16px; }
          .lindy-corner-tr { top: 16px; right: 16px; }
          .lindy-corner-bl { bottom: 16px; left: 16px; }
          .lindy-corner-br { bottom: 16px; right: 16px; }
        }

        /* Spinning ring */
        .lindy-ring-wrap {
          position: relative;
          width: 140px; height: 140px;
          margin-bottom: 40px;
          animation: lindy-fade-up 0.8s ease both;
          animation-delay: 0.1s;
        }
        .lindy-ring {
          position: absolute; inset: 0;
          border-radius: 50%;
          border: 1.5px solid transparent;
          border-top-color: var(--color-primary);
          border-right-color: color-mix(in srgb, var(--color-primary) 35%, transparent);
          animation: lindy-spin-slow 4s linear infinite, lindy-glow 3s ease-in-out infinite;
        }
        .lindy-ring-inner {
          position: absolute; inset: 12px;
          border-radius: 50%;
          border: 1px solid color-mix(in srgb, var(--color-primary) 16%, transparent);
        }
        .lindy-logo-wrap {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .lindy-logo-img {
          height: 72px; width: auto; max-width: 100px;
          object-fit: contain;
          filter: drop-shadow(0 2px 8px color-mix(in srgb, var(--color-primary) 25%, transparent));
        }
        .lindy-logo-initials {
          font-size: 38px; font-weight: 700;
          color: var(--color-primary);
          font-family: var(--font-heading, serif);
          letter-spacing: -0.02em;
          line-height: 1;
        }

        /* Content area */
        .lindy-content {
          text-align: center;
          max-width: 520px;
          position: relative; z-index: 1;
        }

        /* "COMING SOON" eyebrow */
        .lindy-eyebrow {
          display: flex; align-items: center; justify-content: center;
          gap: 14px; margin-bottom: 24px;
          animation: lindy-fade-up 0.8s ease both;
          animation-delay: 0.25s;
        }
        .lindy-eyebrow-line {
          flex: 1; max-width: 60px; height: 1px;
          background: var(--color-primary);
          opacity: 0.5;
          transform-origin: center;
          animation: lindy-line-grow 0.9s ease both;
          animation-delay: 0.5s;
        }
        .lindy-eyebrow-text {
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.35em; text-transform: uppercase;
          color: var(--color-primary);
          font-family: var(--font-nav, sans-serif);
          white-space: nowrap;
        }

        /* Salon name */
        .lindy-name {
          font-size: clamp(38px, 9vw, 72px);
          font-family: var(--font-heading, serif);
          font-weight: 700;
          color: var(--color-text);
          line-height: 1.05;
          letter-spacing: -0.025em;
          margin: 0 0 20px;
          animation: lindy-fade-up 0.8s ease both;
          animation-delay: 0.35s;
        }

        /* Tagline */
        .lindy-tagline {
          font-size: 16px;
          font-family: var(--font-body, sans-serif);
          color: var(--color-text);
          opacity: 0.52;
          line-height: 1.72;
          margin: 0 0 44px;
          max-width: 380px;
          margin-left: auto; margin-right: auto;
          animation: lindy-fade-up 0.8s ease both;
          animation-delay: 0.45s;
        }

        /* Dots loader */
        .lindy-dots {
          display: flex; align-items: center; justify-content: center;
          gap: 10px; margin-bottom: 44px;
          animation: lindy-fade-up 0.8s ease both;
          animation-delay: 0.55s;
        }
        .lindy-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: var(--color-primary);
        }
        .lindy-dot:nth-child(1) { animation: lindy-pulse-dot 1.6s ease-in-out infinite 0s; }
        .lindy-dot:nth-child(2) { animation: lindy-pulse-dot 1.6s ease-in-out infinite 0.3s; }
        .lindy-dot:nth-child(3) { animation: lindy-pulse-dot 1.6s ease-in-out infinite 0.6s; }

        /* Divider */
        .lindy-divider {
          width: 48px; height: 1px;
          background: color-mix(in srgb, var(--color-primary) 30%, transparent);
          margin: 0 auto 36px;
          animation: lindy-fade-up 0.8s ease both;
          animation-delay: 0.6s;
        }

        /* Contact section */
        .lindy-contact {
          display: flex; flex-direction: column;
          align-items: center; gap: 12px;
          animation: lindy-fade-up 0.8s ease both;
          animation-delay: 0.65s;
        }
        .lindy-contact-label {
          font-size: 11px; font-weight: 700; letter-spacing: 0.25em;
          text-transform: uppercase;
          color: var(--color-text); opacity: 0.35;
          font-family: var(--font-nav, sans-serif);
        }
        .lindy-contact-phone {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 12px 28px;
          border: 1px solid color-mix(in srgb, var(--color-primary) 35%, transparent);
          border-radius: 9999px;
          color: var(--color-primary);
          text-decoration: none;
          font-size: 15px; font-weight: 600;
          font-family: var(--font-body, sans-serif);
          letter-spacing: 0.04em;
          transition: background 0.2s, border-color 0.2s;
          background: color-mix(in srgb, var(--color-primary) 5%, transparent);
        }
        .lindy-contact-phone:hover {
          background: color-mix(in srgb, var(--color-primary) 12%, transparent);
          border-color: color-mix(in srgb, var(--color-primary) 55%, transparent);
        }
        .lindy-contact-email {
          font-size: 14px; color: var(--color-text); opacity: 0.45;
          text-decoration: none;
          font-family: var(--font-body, sans-serif);
          transition: opacity 0.2s;
        }
        .lindy-contact-email:hover { opacity: 0.75; }

        /* Footer */
        .lindy-footer {
          position: absolute; bottom: 28px; left: 0; right: 0;
          text-align: center;
          font-size: 12px; opacity: 0.28;
          font-family: var(--font-body, sans-serif);
          color: var(--color-text);
          animation: lindy-fade-up 0.8s ease both;
          animation-delay: 0.8s;
        }
        .lindy-footer a {
          color: inherit; text-decoration: underline;
        }
      `}</style>

      <div className="lindy-root">
        {/* Background glow */}
        <div className="lindy-bg-glow" />

        {/* Corner ornaments */}
        <div className="lindy-corner lindy-corner-tl" />
        <div className="lindy-corner lindy-corner-tr" />
        <div className="lindy-corner lindy-corner-bl" />
        <div className="lindy-corner lindy-corner-br" />

        {/* Spinning ring with logo/initials */}
        <div className="lindy-ring-wrap">
          <div className="lindy-ring" />
          <div className="lindy-ring-inner" />
          <div className="lindy-logo-wrap">
            {tenant.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tenant.logo_url} alt={tenant.salon_name} className="lindy-logo-img" />
            ) : (
              <span className="lindy-logo-initials">
                {tenant.salon_name.slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="lindy-content">
          {/* Eyebrow */}
          <div className="lindy-eyebrow">
            <div className="lindy-eyebrow-line" />
            <span className="lindy-eyebrow-text">Coming Soon</span>
            <div className="lindy-eyebrow-line" />
          </div>

          {/* Name */}
          <h1 className="lindy-name">{tenant.salon_name}</h1>

          {/* Tagline */}
          <p className="lindy-tagline">
            Нещо красиво се изгражда. Очаквайте скоро.
          </p>

          {/* Animated dots */}
          <div className="lindy-dots">
            <div className="lindy-dot" />
            <div className="lindy-dot" />
            <div className="lindy-dot" />
          </div>

          {/* Divider */}
          <div className="lindy-divider" />

          {/* Contact */}
          {(tenant.phone || tenant.email) && (
            <div className="lindy-contact">
              <span className="lindy-contact-label">Свържете се с нас</span>
              {tenant.phone && (
                <a href={`tel:${tenant.phone}`} className="lindy-contact-phone">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6.29 6.29l1.63-1.63a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  {tenant.phone}
                </a>
              )}
              {tenant.email && (
                <a href={`mailto:${tenant.email}`} className="lindy-contact-email">
                  {tenant.email}
                </a>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {mounted && (
          <p className="lindy-footer">
            © {new Date().getFullYear()} {tenant.salon_name} &nbsp;·&nbsp;{" "}
            <a href="https://salonapp.pro" target="_blank" rel="noopener noreferrer">SalonApp.pro</a>
          </p>
        )}
      </div>
    </>
  );
}
