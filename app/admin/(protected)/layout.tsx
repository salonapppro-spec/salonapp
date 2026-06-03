import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";

import { exitSalonAdminContextAction } from "@/app/super-admin/actions";
import { AdminChrome } from "@/components/admin/AdminChrome";
import { SUPER_ADMIN_SALON_COOKIE } from "@/lib/admin-tenant";
import { tomorrowDateISOInSofia } from "@/lib/booking-datetime";

async function AdminProtectedFrame(props: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) redirect("/admin/login");

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // read-only in some contexts
        }
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/admin/login");

  const isSuperAdmin = data.user.app_metadata?.role === "super_admin";
  const impersonatedSlug = isSuperAdmin
    ? cookieStore.get(SUPER_ADMIN_SALON_COOKIE)?.value?.trim() ?? null
    : null;

  const tomorrow = tomorrowDateISOInSofia();
  const mobileScheduleQuickLinks = {
    tomorrow: `/admin/calendar?date=${tomorrow}&view=day`,
    week: `/admin/calendar?view=week`,
    calendar: `/admin/calendar`,
  };

  return (
    <>
      {impersonatedSlug && (
        <div className="sticky top-0 z-[100] flex items-center justify-between gap-2 bg-amber-400 px-3 py-2 text-sm font-semibold text-neutral-900">
          <span className="min-w-0 flex-1 truncate">⚠ Супер-админ режим — преглеждаш салон: <strong>{impersonatedSlug}</strong></span>
          <form action={exitSalonAdminContextAction} className="shrink-0">
            <button type="submit" className="rounded bg-neutral-900/15 px-3 py-1 text-xs hover:bg-neutral-900/25">
              Изход
            </button>
          </form>
        </div>
      )}
      <AdminChrome mobileScheduleQuickLinks={mobileScheduleQuickLinks} />
      <div className="overflow-x-hidden md:pl-56">
        <div className="mx-auto max-w-6xl px-3 pb-[calc(8.5rem+env(safe-area-inset-bottom))] pt-2 md:px-6 md:pb-8 md:pt-6">{props.children}</div>
      </div>
    </>
  );
}

export default function AdminProtectedGroupLayout(props: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] text-[#1A1A1A]" style={{ background: "linear-gradient(160deg, #F8EBDD 0%, #F3EBE0 50%, #EAD5C4 100%)" }}>
      <AdminProtectedFrame>{props.children}</AdminProtectedFrame>
    </div>
  );
}
