"use client";

import { useEffect } from "react";

/**
 * Плавно изплуване на секциите при скрол + скриване на мобилната лента
 * със „Запази час“, докато формата за резервация е на екрана.
 *
 * Скритото начално състояние се включва от JS (`data-t-reveal="on"` на <html>),
 * за да е видимо цялото съдържание, ако скриптът не се изпълни.
 */
/**
 * Мобилната лента „Обади се / Запази час“ се скрива на две места:
 * в hero-то (там вече има бутон и лентата покрива текста) и над самата
 * форма за резервация.
 */
function watchStickyBar(root: HTMLElement): () => void {
  const targets = ["nachalo", "rezervaciya"]
    .map((id) => document.getElementById(id))
    .filter((el): el is HTMLElement => el !== null);
  if (targets.length === 0) return () => undefined;

  const visible = new Set<Element>();
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) visible.add(e.target);
        else visible.delete(e.target);
      }
      root.dataset.tHideSticky = visible.size > 0 ? "on" : "off";
    },
    { threshold: 0.06 }
  );
  for (const t of targets) io.observe(t);

  return () => {
    io.disconnect();
    delete root.dataset.tHideSticky;
  };
}

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

      const stop = watchStickyBar(root);

      return () => {
        io.disconnect();
        stop();
        delete root.dataset.tReveal;
      };
    }

    return watchStickyBar(root);
  }, []);

  return null;
}
