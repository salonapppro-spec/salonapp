import Link from "next/link";
import { Inter } from "next/font/google";

import type { SalonData } from "@/types/database";
import { SalonSiteBrand } from "@/components/templates/SalonSiteBrand";
import { SalonWorkingHours } from "@/components/templates/SalonWorkingHours";
import {
  activeSpecialists,
  servicesFlatForPublic,
  servicesForSpecialist,
  useSpecialistSectionsOnPublicSite,
} from "@/components/templates/salon-shared";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-clean",
});

const ACCENT = "#0066CC";
const MUTED = "#F8F8F8";

export function Clean(props: { data: SalonData }) {
  const { data } = props;
  const { tenant, gallery } = data;
  const multi = useSpecialistSectionsOnPublicSite(data);
  const specs = activeSpecialists(data);
  const title = tenant.hero_title ?? tenant.salon_name;

  return (
    <div className={`${inter.variable} min-h-screen bg-white text-neutral-900`} style={{ fontFamily: "var(--font-clean), system-ui, sans-serif" }}>
      <header className="border-b border-neutral-200">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <SalonSiteBrand data={data} nameClassName="text-lg font-semibold" />
          <Link href={`/${tenant.salon_slug}/booking`} className="rounded-md px-4 py-2 text-sm font-medium text-white" style={{ background: "#333" }}>
            Запази час
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-16 pt-10">
        <h1 className="text-4xl font-semibold">{title}</h1>
        {tenant.description ? <p className="mt-3 max-w-prose text-sm text-neutral-600">{tenant.description}</p> : null}

        <section className="mt-12">
          <h2 className="text-lg font-semibold">Услуги</h2>
          <div className="mt-4 overflow-hidden rounded-lg border border-neutral-200">
            <div className="grid grid-cols-3 px-3 py-2 text-xs font-semibold text-neutral-700" style={{ background: MUTED }}>
              <div>Услуга</div>
              <div>Време</div>
              <div className="text-right">Цена</div>
            </div>
            {multi ? (
              specs.map((sp) => {
                const list = servicesForSpecialist(data, sp.id);
                if (list.length === 0) return null;
                return (
                  <div key={sp.id}>
                    <div className="bg-neutral-100 px-3 py-2 text-xs font-bold uppercase tracking-wide text-neutral-800">{sp.name}</div>
                    {list.map((s, i) => (
                      <div key={s.id} className={`grid grid-cols-3 px-3 py-3 text-sm ${i % 2 === 0 ? "bg-white" : ""}`} style={i % 2 === 1 ? { background: MUTED } : undefined}>
                        <div className="font-medium">{s.name}</div>
                        <div className="text-neutral-600">{s.is_complex ? "По записване" : `${s.duration_minutes ?? 0} мин`}</div>
                        <div className="text-right font-semibold">{Number(s.price_eur).toFixed(0)}€</div>
                      </div>
                    ))}
                  </div>
                );
              })
            ) : (
              servicesFlatForPublic(data).map((s, i) => (
                <div key={s.id} className="grid grid-cols-3 px-3 py-3 text-sm" style={{ background: i % 2 === 0 ? "#fff" : MUTED }}>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-neutral-600">{s.is_complex ? "По записване" : `${s.duration_minutes ?? 0} мин`}</div>
                  <div className="text-right font-semibold">{Number(s.price_eur).toFixed(0)}€</div>
                </div>
              ))
            )}
          </div>
        </section>

        <SalonWorkingHours data={data} headingClassName="text-lg font-semibold" rowClassName="text-sm text-neutral-700" />

        {gallery.length > 0 ? (
          <section className="mt-12">
            <h2 className="text-lg font-semibold">Галерия</h2>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {gallery.map((g) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={g.id} src={g.url} alt="" className="aspect-square w-full object-cover" loading="lazy" />
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-12 rounded-lg border border-neutral-200 p-5" style={{ background: MUTED }}>
          <h2 className="text-lg font-semibold">Контакти</h2>
          <div className="mt-2 space-y-1 text-sm text-neutral-700">
            {tenant.address ? <div>{tenant.address}</div> : null}
            {tenant.phone ? <div>{tenant.phone}</div> : null}
            {tenant.email ? <div>{tenant.email}</div> : null}
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-200 py-6 text-center text-xs text-neutral-500">
        © {new Date().getFullYear()} {tenant.salon_name} · <span style={{ color: ACCENT }}>SalonApp.pro</span>
      </footer>
    </div>
  );
}
