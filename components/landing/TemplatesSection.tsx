"use client";

import Link from "next/link";

const TEMPLATES = [
  {
    slug: "bloom",
    name: "Bloom",
    type: "Нокти & Маникюр",
    desc: "Нежен, розов дизайн за nail студия и козметични салони.",
    href: "/demo/bloom",
    bg: "linear-gradient(145deg, #FDF0F0 0%, #F5D6D6 40%, #EEC4C4 100%)",
    accent: "#C8826A",
    dots: ["#E8B4B4", "#F0C8C8", "#D4848A"],
    tag: "Най-популярен",
  },
  {
    slug: "luxe",
    name: "Luxe",
    type: "Луксозен Козметичен",
    desc: "Тъмен, елегантен стил за премиум козметични салони.",
    href: "/demo/luxe",
    bg: "linear-gradient(145deg, #1A0F0D 0%, #2C1B18 50%, #3D2820 100%)",
    accent: "#C9A84C",
    dots: ["#C9A84C", "#8B6914", "#E8C870"],
    tag: null,
  },
  {
    slug: "luxe2",
    name: "Luxe 2",
    type: "Фризьорски Салон",
    desc: "Светъл, класически дизайн за фризьорски студия.",
    href: "/demo/luxe2",
    bg: "linear-gradient(145deg, #FDFAF3 0%, #F5EED8 50%, #EDE0C0 100%)",
    accent: "#B8973A",
    dots: ["#B8973A", "#D4AF60", "#8B7028"],
    tag: null,
  },
  {
    slug: "bold",
    name: "Bold",
    type: "Барбершоп",
    desc: "Дързък, тъмен дизайн за барбершопове и мъжки салони.",
    href: "/demo/bold",
    bg: "linear-gradient(145deg, #0D1117 0%, #161B22 50%, #1F2937 100%)",
    accent: "#F97316",
    dots: ["#F97316", "#EA6010", "#FBB06C"],
    tag: null,
  },
  {
    slug: "zen",
    name: "Zen",
    type: "Масаж & Уелнес",
    desc: "Спокоен, зелен дизайн за спа и масажни студия.",
    href: "/demo/zen",
    bg: "linear-gradient(145deg, #F0F7F0 0%, #D8EDDA 50%, #C0E0C4 100%)",
    accent: "#5A8A5E",
    dots: ["#5A8A5E", "#7AAA7E", "#3D6E41"],
    tag: null,
  },
  {
    slug: "groom",
    name: "Groom",
    type: "Pet Grooming",
    desc: "Топъл, игрив дизайн за груминг салони за домашни любимци.",
    href: "/demo/groom",
    bg: "linear-gradient(145deg, #FDF5EE 0%, #F5DFC8 50%, #EAC9A8 100%)",
    accent: "#C8956A",
    dots: ["#C8956A", "#A8754A", "#E0B090"],
    tag: "Ново",
  },
];

export default function TemplatesSection() {
  return (
    <section className="bg-[#EAD5C4] px-4 py-16 sm:px-6 md:py-24">
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

        {/* Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TEMPLATES.map((t) => (
            <div
              key={t.slug}
              className="group relative flex flex-col overflow-hidden border border-[#1A1A1A]/10 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              {/* Tag */}
              {t.tag && (
                <span
                  className="absolute left-3 top-3 z-10 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-white"
                  style={{ background: t.accent }}
                >
                  {t.tag}
                </span>
              )}

              {/* Browser mock preview */}
              <div className="relative h-44 overflow-hidden" style={{ background: t.bg }}>
                {/* Browser chrome */}
                <div className="absolute inset-x-0 top-0 flex h-6 items-center gap-1.5 border-b border-white/10 bg-black/20 px-3">
                  {t.dots.map((c, i) => (
                    <span key={i} className="h-2 w-2 rounded-full" style={{ background: c }} />
                  ))}
                  <span className="ml-2 h-2.5 flex-1 rounded-sm bg-white/10" />
                </div>

                {/* Mock page content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pt-6">
                  <div
                    className="h-5 w-20 rounded-sm opacity-60"
                    style={{ background: t.accent }}
                  />
                  <div className="h-2 w-28 rounded-sm bg-white/20" />
                  <div className="h-2 w-20 rounded-sm bg-white/15" />
                  <div
                    className="mt-2 h-7 w-24 rounded-sm opacity-80"
                    style={{ background: t.accent }}
                  />
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-300 group-hover:bg-black/30">
                  <span className="translate-y-2 scale-90 rounded-sm bg-white px-4 py-2 text-[11px] font-black uppercase tracking-widest text-[#1A1A1A] opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100">
                    Виж демото →
                  </span>
                </div>
              </div>

              {/* Card body */}
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p
                      className="text-[10px] font-black uppercase tracking-[0.3em]"
                      style={{ color: t.accent }}
                    >
                      {t.type}
                    </p>
                    <h3 className="mt-0.5 text-lg font-black text-[#1A1A1A]">{t.name}</h3>
                  </div>
                </div>
                <p className="mt-2 flex-1 text-xs leading-relaxed text-[#1A1A1A]/50">{t.desc}</p>
                <Link
                  href={t.href}
                  target="_blank"
                  className="mt-4 flex items-center justify-center border py-2.5 text-[11px] font-black uppercase tracking-widest transition-all duration-200 hover:text-white"
                  style={{
                    borderColor: t.accent,
                    color: t.accent,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background = t.accent;
                    (e.currentTarget as HTMLAnchorElement).style.color = "white";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                    (e.currentTarget as HTMLAnchorElement).style.color = t.accent;
                  }}
                >
                  Виж демото
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
