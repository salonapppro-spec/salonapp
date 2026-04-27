"use client";

import Image from "next/image";
import Link from "next/link";

const TEMPLATES = [
  {
    slug: "bloom",
    name: "Bloom",
    type: "Нокти & Маникюр",
    desc: "Нежен, розов дизайн за nail студия и козметични салони.",
    href: "/demo/bloom",
    accent: "#C8826A",
    tag: "Най-популярен",
    featured: true,
  },
  {
    slug: "luxe",
    name: "Luxe",
    type: "Луксозен Козметичен",
    desc: "Тъмен, елегантен стил за премиум козметични салони.",
    href: "/demo/luxe",
    accent: "#C9A84C",
    tag: null,
    featured: false,
  },
  {
    slug: "luxe2",
    name: "Luxe 2",
    type: "Фризьорски Салон",
    desc: "Светъл, класически дизайн за фризьорски студия.",
    href: "/demo/luxe2",
    accent: "#B8973A",
    tag: null,
    featured: false,
  },
  {
    slug: "bold",
    name: "Bold",
    type: "Барбершоп",
    desc: "Дързък, тъмен дизайн за барбершопове и мъжки салони.",
    href: "/demo/bold",
    accent: "#F97316",
    tag: null,
    featured: false,
  },
  {
    slug: "zen",
    name: "Zen",
    type: "Масаж & Уелнес",
    desc: "Спокоен, зелен дизайн за спа и масажни студия.",
    href: "/demo/zen",
    accent: "#5A8A5E",
    tag: null,
    featured: false,
  },
  {
    slug: "groom",
    name: "Groom",
    type: "Pet Grooming",
    desc: "Топъл, игрив дизайн за груминг салони за домашни любимци.",
    href: "/demo/groom",
    accent: "#C8956A",
    tag: "Ново",
    featured: false,
  },
];

export default function TemplatesSection() {
  return (
    <section id="templates" className="bg-[#EDE4D8] px-4 py-16 sm:px-6 md:py-24">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-12 border-b border-[#1A1A1A]/10 pb-8">
          <p className="text-[10px] font-black uppercase tracking-[0.45em] text-[#C9A84C]">
            Шаблони
          </p>
          <h2
            className="mt-3 text-3xl font-black text-[#1A1A1A] md:text-5xl"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            Избери своя стил.
          </h2>
          <p className="mt-3 max-w-xl text-sm text-[#1A1A1A]/50">
            Всеки шаблон е напълно готов с резервации, услуги и работно време. Кликни и виж как ще изглежда точно твоят салон.
          </p>
        </div>

        {/* Asymmetric grid — 4 cols: Bloom(2)+Luxe+Luxe2 / Bold+Zen+Groom(2) */}
        <div className="grid grid-cols-1 gap-[30px] sm:grid-cols-2 lg:grid-cols-4">
          {TEMPLATES.map((t) => (
            <Link
              key={t.slug}
              href={t.href}
              target="_blank"
              className={`group relative flex flex-col overflow-hidden rounded-xl bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl${
                t.featured ? " sm:col-span-2 lg:col-span-2" : ""
              }${
                t.slug === "groom" ? " sm:col-span-2 lg:col-span-2" : ""
              }`}
            >
              {/* Badge */}
              {t.tag && (
                <span
                  className="absolute right-3 top-3 z-10 rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest text-white shadow-sm"
                  style={{ background: t.accent }}
                >
                  {t.tag}
                </span>
              )}

              {/* Preview image — 65% of card height */}
              <div
                className={`relative overflow-hidden${
                  t.featured || t.slug === "groom" ? " h-[280px]" : " h-[200px]"
                }`}
              >
                <Image
                  src={`/previews/${t.slug}.jpg`}
                  alt={`${t.name} шаблон превю`}
                  fill
                  className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                {/* Subtle hover overlay */}
                <div className="absolute inset-0 bg-black/0 transition-all duration-300 group-hover:bg-black/10" />
              </div>

              {/* Card body */}
              <div className="flex flex-1 flex-col p-6">
                <p
                  className="text-[10px] font-black uppercase tracking-[0.35em]"
                  style={{ color: t.accent }}
                >
                  {t.type}
                </p>
                <h3
                  className="mt-1 text-xl font-black text-[#1A1A1A]"
                  style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
                >
                  {t.name}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-[#1A1A1A]/50">
                  {t.desc}
                </p>

                {/* Arrow link */}
                <div
                  className="mt-5 flex items-center gap-1.5 text-[12px] font-bold transition-colors duration-200"
                  style={{ color: t.accent }}
                >
                  <span className="border-b border-transparent transition-colors duration-200 group-hover:border-current">
                    Виж демото
                  </span>
                  <span className="transition-transform duration-200 group-hover:translate-x-1">
                    →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}
