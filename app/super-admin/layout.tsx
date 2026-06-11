import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/admin/SignOutButton";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const metadata: Metadata = {
  title: "SalonApp Super Admin",
  robots: {
    index: false,
    follow: false,
  },
};

function isSuperAdminRole(user: { app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> }): boolean {
  return user.app_metadata?.role === "super_admin";
}

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/admin/login");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isSuperAdminRole(user)) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="sticky top-0 z-50 border-b border-neutral-800 bg-neutral-950/95 px-4 py-3 shadow-md shadow-black/20 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <p className="shrink-0 text-sm font-semibold tracking-tight text-white">SalonApp.pro — Супер админ</p>
          <div className="flex min-w-0 flex-col gap-3 sm:max-w-none sm:flex-row sm:items-center sm:justify-end">
            <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-neutral-300">
              <Link href="/super-admin" className="whitespace-nowrap hover:text-white">
                Табло
              </Link>
              <Link href="/super-admin/leads" className="whitespace-nowrap text-amber-300 hover:text-amber-100">
                Заявки
              </Link>
              <Link href="/super-admin/new" className="whitespace-nowrap hover:text-white">
                Нов тенант
              </Link>
            </nav>
            <SignOutButton className="hidden shrink-0 rounded-xl border-2 border-amber-500/90 bg-amber-500/15 px-4 py-2.5 text-center text-sm font-semibold text-amber-100 transition hover:bg-amber-500/25 md:inline-flex md:min-w-[9rem] md:items-center md:justify-center">
              Изход от акаунта
            </SignOutButton>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 pb-[max(6.5rem,env(safe-area-inset-bottom))] sm:px-6 md:pb-8">{children}</main>

      {/* Мобилен: фиксиран изход — desktop ползва бутона в header */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-800 bg-neutral-900/98 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
        <SignOutButton className="w-full rounded-xl border border-amber-600/80 bg-neutral-800 py-2.5 text-sm font-semibold text-amber-50 hover:bg-neutral-700">
          Изход от акаунта
        </SignOutButton>
      </div>
    </div>
  );
}
