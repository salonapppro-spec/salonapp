"use client";

import { useEffect } from "react";

/**
 * Плавно изплуване на секциите при скрол + скриване на мобилната лента
 * със „Запази час“, докато формата за резервация е на екрана.
 *
 * Скритото начално състояние се включва от JS (`data-t-reveal="on"` на <html>),
 * за да е видимо цялото съдържание, ако скриптът не се изпълни.
 */
export function TaniaReveal() {
  useEffect(() => {
    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!reduced) {
      root.dataset.tReveal = "on";
      const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              (e.target as HTMLElement).dataset.v = "1";
              io.unobserve(e.target);
            }
          }
        },
        { threshold: 0.1, rootMargin: "0px 0px -8% 0px" }
      );
      for (const t of targets) io.observe(t);

      // Секцията за резервация — мобилната лента се скрива, за да не пречи.
      const booking = document.getElementById("rezervaciya");
      let bio: IntersectionObserver | null = null;
      if (booking) {
        bio = new IntersectionObserver(
          ([e]) => { root.dataset.tBooking = e.isIntersecting ? "on" : "off"; },
          { threshold: 0.06 }
        );
        bio.observe(booking);
      }

      return () => {
        io.disconnect();
        bio?.disconnect();
        delete root.dataset.tReveal;
        delete root.dataset.tBooking;
      };
    }

    const booking = document.getElementById("rezervaciya");
    if (!booking) return;
    const bio = new IntersectionObserver(
      ([e]) => { root.dataset.tBooking = e.isIntersecting ? "on" : "off"; },
      { threshold: 0.06 }
    );
    bio.observe(booking);
    return () => {
      bio.disconnect();
      delete root.dataset.tBooking;
    };
  }, []);

  return null;
}
