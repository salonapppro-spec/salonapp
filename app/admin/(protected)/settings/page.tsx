import Link from "next/link";
import { notFound } from "next/navigation";

import { FinancialSettingsForm } from "@/components/admin/FinancialSettingsForm";
import { PremiumSmsSection } from "@/components/admin/PremiumSmsSection";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { getFinancialSettings, getSpecialistsAdmin, getTenantBySalonSlug } from "@/lib/data";
import type { FinancialSettings } from "@/types";
import { requireAdminTenantSlugForPage } from "@/lib/admin-tenant-page";

import { SettingsForm } from "./settings-form";

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
      <h1 className="text-2xl font-semibold tracking-tight text-brand-900 sm:text-3xl">Настройки</h1>
      <p className="mt-2 max-w-2xl text-pretty text-sm leading-relaxed text-brand-800/85 sm:text-base">
        Публична информация, график на резервациите и сайтът на салона.
      </p>

      <div className="mt-6 rounded-2xl border border-brand-200/80 bg-white/80 p-4 shadow-card sm:p-5">
        <h2 className="text-sm font-semibold text-brand-900">Работно време</h2>
        <p className="mt-1 text-sm text-brand-800/85">Редактирайте седмичния график на салона.</p>
        <Link href="/admin/working-hours" className="btn-admin-primary mt-3 inline-block text-center">
          Отвори график
        </Link>
      </div>

      <div className="mt-8">
        <SettingsForm tenant={tenant} specialists={specialists} />
      </div>

      <div className="mt-8">
        <FinancialSettingsForm settings={financial as FinancialSettings | null} variant="booking" />
      </div>

      {isPremium ? (
        <div className="mt-8">
          <PremiumSmsSection />
        </div>
      ) : null}

      <div className="mt-10 rounded-2xl border border-brand-200/80 bg-white/80 p-4 shadow-card sm:p-5">
        <h2 className="text-sm font-semibold text-brand-900">Акаунт</h2>
        <p className="mt-1 text-sm text-brand-800/85">Изход от админ панела на салона. Ще трябва отново да въведеш имейл и парола.</p>
        <SignOutButton className="btn-admin-primary mt-4 inline-flex items-center justify-center text-center text-sm">
          Изход от акаунта
        </SignOutButton>
      </div>
    </div>
  );
}
