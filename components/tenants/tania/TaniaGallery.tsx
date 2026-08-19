"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

export type GalleryItem = { src: string; alt: string };

/** Мозайка от снимки на салона + лайтбокс със стрелки и Escape. */
export function TaniaGallery({ items }: { items: GalleryItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const close = useCallback(() => setOpenIndex(null), []);
  const step = useCallback(
    (delta: number) =>
      setOpenIndex((i) => (i === null ? null : (i + delta + items.length) % items.length)),
    [items.length]
  );

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [openIndex, close, step]);

  const active = openIndex === null ? null : items[openIndex];

  return (
    <>
      <ul className="t-gal">
        {items.map((it, i) => (
          <li key={it.src} className="t-gal-item">
            <button type="button" onClick={() => setOpenIndex(i)} aria-label={`Отвори снимка: ${it.alt}`}>
              <Image
                src={it.src}
                alt={it.alt}
                width={900}
                height={1200}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
                className="t-gal-img"
              />
            </button>
          </li>
        ))}
      </ul>

      {active && (
        <div className="t-lb" role="dialog" aria-modal="true" aria-label={active.alt} onClick={close}>
          <button type="button" className="t-lb-close" onClick={close} aria-label="Затвори">×</button>
          <button
            type="button"
            className="t-lb-nav prev"
            onClick={(e) => { e.stopPropagation(); step(-1); }}
            aria-label="Предишна снимка"
          >‹</button>
          <figure className="t-lb-fig" onClick={(e) => e.stopPropagation()}>
            <Image
              src={active.src}
              alt={active.alt}
              width={900}
              height={1200}
              sizes="(max-width: 900px) 92vw, 700px"
              className="t-lb-img"
            />
            <figcaption>{active.alt}</figcaption>
          </figure>
          <button
            type="button"
            className="t-lb-nav next"
            onClick={(e) => { e.stopPropagation(); step(1); }}
            aria-label="Следваща снимка"
          >›</button>
        </div>
      )}
    </>
  );
}
