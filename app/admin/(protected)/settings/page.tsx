import Link from "next/link";
import { notFound } from "next/navigation";

import { FinancialSettingsForm } from "@/components/admin/FinancialSettingsForm";
import { PremiumSmsSection } from "@/components/admin/PremiumSmsSection";
import { getFinancialSettings, getSpecialistsAdmin, getTenantBySalonSlug } from "@/lib/data";
import type { FinancialSettings } from "@/types";
import { requireAdminTenantSlugForPage } from "@/lib/admin-tenant-page";

import { SettingsForm } from "./settings-form";

const GOLD = "#C9A84C";
const ROSE = "#C8826A";

export default async function AdminSettingsPage() {
  const salonSlug = await requireAdminTenantSlugForPage();
  const [tenant, financial, specialists] = await Promise.all([
    getTenantBySalonSlug(salonSlug),
    getFinancialSettings(salonSlug),
    getSpecialistsAdmin(salonSlug),
  ]);
  if (!tenant) notFound();

  const isPremium = tenant.plan === "premium";

  return (
    <div className="admin-page-shell max-w-3xl">
      {/* Header */}
      <div>
        <span
          className="inline-block rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-white"
          style={{ background: `linear-gradient(135deg, ${GOLD}, ${ROSE})` }}
        >
          ⚙️ Настройки
        </span>
        <h1
          className="mt-2 text-2xl font-black tracking-tight text-[#1A1A1A] sm:text-3xl"
          style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
        >
          Настройки на салона
        </h1>
        <p className="mt-1 text-sm text-[#1A1A1A]/45">
          Профил, сайт, разписание и финансови настройки
        </p>
      </div>

      {/* Quick-nav cards */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: "🕐", label: "Работно време", href: "/admin/working-hours", desc: "График по дни" },
          { icon: "🖼️", label: "Галерия", href: "/admin/gallery", desc: "Снимки на салона" },
          { icon: "✂️", label: "Услуги", href: "/admin/services", desc: "Цени и описания" },
          { icon: "👥", label: "Специалисти", href: "#specialists", desc: "Екип и профили" },
        ].map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="flex flex-col gap-1 rounded-2xl p-4 transition hover:opacity-80"
            style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.18)" }}
          >
            <span className="text-2xl">{card.icon}</span>
            <span className="text-sm font-black text-[#1A1A1A]">{card.label}</span>
            <span className="text-[11px] text-[#1A1A1A]/40">{card.desc}</span>
          </Link>
        ))}
      </div>

      {/* Salon profile + specialists form */}
      <div className="mt-6">
        <SettingsForm tenant={tenant} specialists={specialists} />
      </div>

      {/* Financial settings */}
      <div className="mt-6">
        <FinancialSettingsForm settings={financial as FinancialSettings | null} variant="booking" />
      </div>

      {/* SMS (premium) */}
      {isPremium ? (
        <div className="mt-6">
          <PremiumSmsSection />
        </div>
      ) : null}

      {/* Account hint — изходът е в навигацията (сайдбар / моб. хедър), за да няма дублиран бутон */}
      <div
        className="mt-6 rounded-2xl p-5"
        style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)" }}
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl">🔐</span>
          <div>
            <h2 className="text-sm font-black text-[#1A1A1A]">Акаунт</h2>
            <p className="mt-0.5 text-xs leading-relaxed text-[#1A1A1A]/45">
              За изход използвай <span className="font-semibold text-[#1A1A1A]/60">«Изход от акаунта»</span> в лентата вляво на
              десктоп или <span className="font-semibold text-[#1A1A1A]/60">«Изход»</span> в горния лент на телефон. Ще трябва
              отново да влезеш с имейл и парола.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
