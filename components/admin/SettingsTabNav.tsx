"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const GOLD = "#C9A84C";
const ROSE = "#C8826A";

const tabs = [
  { href: "/admin/settings/logo-images", label: "Лого и снимки", icon: "🖼️" },
  { href: "/admin/settings/contacts",    label: "Контакти",       icon: "📍" },
  { href: "/admin/settings/services",    label: "Услуги",         icon: "✂️" },
  { href: "/admin/settings/costs",       label: "Разходи",        icon: "💰" },
  { href: "/admin/settings/hours",       label: "Раб. Време",     icon: "🕐" },
  { href: "/admin/settings/password",    label: "Парола",         icon: "🔑" },
] as const;

export function SettingsTabNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav
      className="mt-5 flex gap-1.5 overflow-x-auto pb-1"
      style={{ scrollbarWidth: "none" }}
      aria-label="Настройки навигация"
    >
      {tabs.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            prefetch={true}
            className="flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-100 whitespace-nowrap active:scale-95"
            style={
              active
                ? {
                    background: `linear-gradient(135deg, ${GOLD}, ${ROSE})`,
                    color: "white",
                    boxShadow: "0 2px 8px rgba(201,168,76,0.35)",
                  }
                : {
                    background: "rgba(201,168,76,0.08)",
                    color: "rgba(26,26,26,0.6)",
                    border: "1px solid rgba(201,168,76,0.15)",
                  }
            }
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
