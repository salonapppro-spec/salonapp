"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SignOutButton } from "@/components/admin/SignOutButton";

const primaryTabs = [
  { href: "/admin/dashboard", label: "Днес", short: "Дн", icon: "✦" },
  { href: "/admin/calendar", label: "Календар", short: "Кал", icon: "📅" },
  { href: "/admin/settings/services", label: "Услуги", short: "Ус", icon: "✂️" },
  { href: "/admin/clients", label: "Клиенти", short: "Кл", icon: "👤" },
  { href: "/admin/finances", label: "Финанси", short: "Фин", icon: "💰" },
] as const;

const secondaryLinks = [
  { href: "/admin/settings", label: "Настройки", icon: "⚙️" },
] as const;

const mobileHeaderLinks = [
  { href: "/admin/settings", label: "Настройки" },
] as const;

export function AdminChrome(props: {
  /**
   * URLs for „Утре / 7 дни / Календар“. Показва се **само** на мобилен, на страниците
   * „Днес“ и „Календар“ — не в настройки, услуги и т.н.
   */
  mobileScheduleQuickLinks?: { tomorrow: string; week: string; calendar: string };
}) {
  const { mobileScheduleQuickLinks } = props;
  const pathname = usePathname() ?? "";
  const isDashboardOrCalendar = pathname === "/admin/dashboard" || pathname === "/admin/calendar";

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed bottom-0 left-0 top-0 z-40 hidden h-[100dvh] w-56 flex-col border-r border-[#C9A84C]/15 bg-gradient-to-b from-[#FAF7F2] to-[#F3EBE0] shadow-[2px_0_20px_rgba(0,0,0,0.06)] backdrop-blur-md md:flex">
        {/* Logo */}
        <div className="shrink-0 border-b border-[#C9A84C]/15 px-4 py-4">
          <Link href="/admin/dashboard" className="group flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-lg text-sm font-black text-white shadow-sm"
              style={{ background: "linear-gradient(135deg, #C9A84C, #C8826A)" }}
            >
              S
            </span>
            <span className="text-sm font-bold tracking-tight text-[#1A1A1A]">
              Salon<span style={{ color: "#C9A84C" }}>App</span>
              <span className="text-[#C8826A]">.pro</span>
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto p-3" aria-label="Админ навигация">
          {primaryTabs.map((l) => {
            const active = isActive(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                prefetch={true}
                className="group relative flex min-h-[44px] items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-100 active:scale-[0.98] md:duration-150 md:hover:bg-[rgba(201,168,76,0.08)] md:active:scale-100"
                style={
                  active
                    ? {
                        background: "linear-gradient(135deg, rgba(201,168,76,0.15), rgba(200,130,106,0.15))",
                        color: "#1A1A1A",
                        boxShadow: "inset 0 0 0 1px rgba(201,168,76,0.3)",
                      }
                    : { color: "rgba(26,26,26,0.65)" }
                }
              >
                {active && (
                  <span
                    className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full"
                    style={{ background: "linear-gradient(180deg, #C9A84C, #C8826A)" }}
                  />
                )}
                <span className="text-base leading-none">{l.icon}</span>
                <span>{l.label}</span>
              </Link>
            );
          })}

          <div className="my-2 border-t border-[#C9A84C]/15 pt-2">
            <p className="px-3 pb-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-[#C9A84C]/70">Настройки</p>
            {secondaryLinks.map((l) => {
              const active = isActive(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  prefetch={true}
                  className="group relative mt-0.5 flex min-h-[44px] items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-100 active:scale-[0.98] md:duration-150 md:hover:bg-[rgba(201,168,76,0.08)] md:active:scale-100"
                  style={
                    active
                      ? {
                          background: "linear-gradient(135deg, rgba(201,168,76,0.15), rgba(200,130,106,0.15))",
                          color: "#1A1A1A",
                          boxShadow: "inset 0 0 0 1px rgba(201,168,76,0.3)",
                        }
                      : { color: "rgba(26,26,26,0.55)" }
                  }
                >
                  {active && (
                    <span
                      className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full"
                      style={{ background: "linear-gradient(180deg, #C9A84C, #C8826A)" }}
                    />
                  )}
                  <span className="text-sm leading-none">{l.icon}</span>
                  <span>{l.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Sign out */}
        <div className="shrink-0 border-t border-[#C9A84C]/15 p-3">
          <SignOutButton className="w-full rounded-xl border border-[#C9A84C]/25 bg-white/70 px-3 py-2.5 text-sm font-semibold text-[#1A1A1A]/70 shadow-sm transition active:scale-[0.98] md:hover:border-[#C9A84C]/40 md:hover:bg-white md:hover:text-[#1A1A1A] md:active:scale-100">
            Изход от акаунта
          </SignOutButton>
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-[#C9A84C]/20 bg-[#FAF7F2]/97 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur-md md:hidden"
        aria-label="Основна навигация"
      >
        {primaryTabs.map((l) => {
          const active = isActive(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              prefetch={true}
              className="flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 transition-transform duration-100 active:scale-95 md:duration-150"
            >
              <span
                className="flex h-11 w-11 items-center justify-center rounded-xl text-base transition-all duration-100 md:duration-200"
                style={
                  active
                    ? { background: "linear-gradient(135deg, #C9A84C, #C8826A)", fontSize: "16px" }
                    : {}
                }
              >
                {active ? <span className="text-white text-sm">{l.icon}</span> : <span className="text-lg opacity-50">{l.icon}</span>}
              </span>
              <span
                className="max-w-full truncate text-[10px] font-semibold leading-tight"
                style={{ color: active ? "#C9A84C" : "rgba(26,26,26,0.45)" }}
              >
                {l.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Mobile header: brand row + full-width day shortcuts (no horizontal squeeze) */}
      <header className="sticky top-0 z-30 border-b border-[#C9A84C]/20 bg-[#FAF7F2]/92 backdrop-blur-md md:hidden">
        <div className="flex items-center justify-between gap-2 px-3 py-2.5">
          <Link href="/admin/dashboard" className="flex min-w-0 shrink-0 items-center gap-1.5">
            <span
              className="flex h-6 w-6 items-center justify-center rounded-md text-xs font-black text-white"
              style={{ background: "linear-gradient(135deg, #C9A84C, #C8826A)" }}
            >
              S
            </span>
            <span className="truncate text-sm font-bold text-[#1A1A1A]">
              Salon<span style={{ color: "#C9A84C" }}>App</span>
            </span>
          </Link>
          <div className="flex shrink-0 items-center justify-end gap-1">
            {mobileHeaderLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                prefetch={true}
                className="shrink-0 rounded-lg px-2.5 py-2 text-xs font-medium transition duration-100 active:scale-95 md:duration-150 md:active:scale-100"
                style={
                  isActive(l.href)
                    ? { background: "rgba(201,168,76,0.15)", color: "#C9A84C" }
                    : { color: "rgba(26,26,26,0.55)" }
                }
              >
                {l.label.split(" ")[0]}
              </Link>
            ))}
            <SignOutButton className="shrink-0 rounded-lg px-2.5 py-2 text-xs font-medium text-[#1A1A1A]/55 transition active:scale-95 md:hover:bg-black/5 md:hover:text-[#1A1A1A] md:active:scale-100">
              Изход
            </SignOutButton>
          </div>
        </div>
        {mobileScheduleQuickLinks && isDashboardOrCalendar ? (
          <div
            className="grid grid-cols-3 gap-2 border-t border-[#C9A84C]/15 px-3 pb-3 pt-2.5"
            aria-label="График: други дни"
          >
            <Link
              href={mobileScheduleQuickLinks.tomorrow}
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl text-xs font-black text-white shadow-sm transition active:opacity-90"
              style={{ background: "linear-gradient(135deg, #C9A84C, #C8826A)" }}
            >
              Утре
            </Link>
            <Link
              href={mobileScheduleQuickLinks.week}
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-[#C9A84C]/40 bg-white text-xs font-bold text-[#1A1A1A]/80 shadow-sm transition active:bg-[#C9A84C]/5"
            >
              7 дни
            </Link>
            <Link
              href={mobileScheduleQuickLinks.calendar}
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-[#C9A84C]/30 bg-white/90 text-xs font-bold text-[#1A1A1A]/65 shadow-sm transition active:bg-white"
            >
              Календар
            </Link>
          </div>
        ) : null}
      </header>
    </>
  );
}
