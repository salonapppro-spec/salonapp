"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAdminBasePath } from "@/lib/admin-base-path";

const GOLD = "#C9A84C";
const ROSE = "#C8826A";

const tabDefs = [
  { path: "/finances",          label: "Обзор",             icon: "📊", exact: true },
  { path: "/finances/overhead", label: "Постоянни разходи", icon: "🏷️", exact: false },
] as const;

export function FinancesTabNav() {
  const pathname = usePathname() ?? "";
  const basePath = useAdminBasePath();
  const tabs = tabDefs.map((t) => ({ ...t, href: `${basePath}${t.path}` }));

  return (
    <nav
      className="mt-5 flex gap-1.5 overflow-x-auto pb-1"
      style={{ scrollbarWidth: "none" }}
      aria-label="Бизнес калкулатор навигация"
    >
      {tabs.map((tab) => {
        const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
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
