import Link from "next/link";

const LINKS = [
  { label: "Начало", href: "/" },
  { label: "Цени", href: "/#plans" },
  { label: "Блог", href: "/blog" },
  { label: "Условия", href: "/legal/terms" },
  { label: "Поверителност", href: "/legal/privacy" },
];

export default function BlogFooter() {
  return (
    <footer className="border-t border-[#E8DDD0] bg-[#F8EBDD]">
      <div className="mx-auto max-w-5xl px-6 py-10 lg:px-8">
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-3">
          {LINKS.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6E6A63] transition-colors hover:text-[#C79A4B]"
            >
              {label}
            </Link>
          ))}
        </nav>
        <p className="mt-6 text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-[#6E6A63]/60">
          © 2026 SalonApp.pro — Всички права запазени.
        </p>
      </div>
    </footer>
  );
}
