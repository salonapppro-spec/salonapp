"use client";

import Link from "next/link";
import { LP } from "@/components/landing/palette";

const CLIENTS = [
  {
    slug: "lindynails",
    name: "Lindy Nails",
    type: "Нокти & Маникюр",
    url: "https://lindynails.salonapp.pro",
    accent: LP.accentDark,
  },
  {
    slug: "theskin",
    name: "The Skin",
    type: "Козметика & Грижа за кожата",
    url: "https://theskin.salonapp.pro",
    accent: LP.accent,
  },
  {
    slug: "thebeast",
    name: "The Beast",
    type: "Барбершоп",
    url: "https://thebeast.salonapp.pro",
    accent: LP.text,
  },
  {
    slug: "paw-empire",
    name: "Paw Empire",
    type: "Pet Grooming",
    url: "https://paw-empire.salonapp.pro",
    accent: "#C8956A",
  },
  {
    slug: "euphoria",
    name: "Euphoria",
    type: "Спа & Уелнес",
    url: "https://euphoria.salonapp.pro",
    accent: "#5A8A5E",
  },
  {
    slug: "magnetic-eyes",
    name: "Magnetic Eyes",
    type: "Мигли, Вежди & Перманентен грим",
    url: "https://magnetic-eyes.salonapp.pro",
    accent: "#7C5C8A",
  },
];

export default function TemplatesSection() {
  return (
    <section id="templates" className="bg-[#FFFCF8] px-4 py-10 sm:px-6 md:py-14">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-12 border-b border-[#E7DDD0] pb-8">
          <h2
            className="mt-3 text-3xl font-black text-[#1A1A1A] md:text-5xl"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            Ти избираш стила.
          </h2>
          <p className="mt-3 max-w-xl text-sm text-[#6E6A63]">
            Всеки салон получава уникален дизайн, изграден специално за него.<br />Виж примерни проекти.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-[30px] sm:grid-cols-2 lg:grid-cols-3">
          {CLIENTS.map((c) => (
            <div
              key={c.slug}
              className="relative flex flex-col overflow-hidden rounded-xl bg-[#FDFBF8] shadow-md border border-[#E7DDD0]"
            >
              {/* Live iframe preview */}
              <div className="relative h-[220px] overflow-hidden bg-[#F7F5F2]">
                <iframe
                  src={c.url}
                  className="absolute left-0 top-0 border-0"
                  style={{
                    width: "1440px",
                    height: "900px",
                    transform: "scale(0.25)",
                    transformOrigin: "top left",
                    pointerEvents: "none",
                  }}
                  loading="lazy"
                  tabIndex={-1}
                  aria-hidden="true"
                  title={`${c.name} сайт превю`}
                />
              </div>

              {/* Card body */}
              <div className="flex flex-1 flex-col p-6">
                <p
                  className="text-[10px] font-black uppercase tracking-[0.35em]"
                  style={{ color: c.accent }}
                >
                  {c.type}
                </p>
                <h3
                  className="mt-1 text-xl font-black text-[#1A1A1A]"
                  style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
                >
                  {c.name}
                </h3>

                {/* Link */}
                <div className="mt-5">
                  <Link
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[12px] font-bold transition-colors duration-200 hover:opacity-70"
                    style={{ color: c.accent }}
                  >
                    <span className="border-b border-current">Виж сайта</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
