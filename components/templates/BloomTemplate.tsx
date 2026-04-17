import Link from "next/link";

import type { GalleryItem, Service, Tenant } from "@/types";

export function BloomTemplate(props: { tenant: Tenant; services: Service[]; gallery: GalleryItem[] }) {
  const { tenant, services, gallery } = props;

  const primary = tenant.primary_color ?? "#C8826A";

  return (
    <div className="min-h-screen" style={{ background: "#FFF8F5", color: "#3D2B1F" }}>
      <header className="sticky top-0 z-10 border-b" style={{ borderColor: "#E8D5CC", background: "#FFF8F5CC" }}>
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="text-lg font-semibold">{tenant.salon_name}</div>
          <Link
            href={`/${tenant.salon_slug}/booking`}
            className="rounded-xl px-4 py-2 text-sm font-medium text-white"
            style={{ background: primary }}
          >
            Запази час
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-12 pt-8">
        <section className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight" style={{ fontFamily: "serif" }}>
            {tenant.salon_name}
          </h1>
          <p className="mx-auto mt-3 max-w-prose text-sm" style={{ color: "#7A5C4F" }}>
            Beauty. Business. Elevated.
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              href={`/${tenant.salon_slug}/booking`}
              className="rounded-xl px-6 py-3 text-sm font-medium text-white shadow-sm"
              style={{ background: primary }}
            >
              Запази час онлайн
            </Link>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">Услуги</h2>
          <div className="mt-4 grid gap-3">
            {services.length === 0 ? (
              <div className="rounded-xl border p-4 text-sm" style={{ borderColor: "#E8D5CC", color: "#7A5C4F" }}>
                Няма активни услуги.
              </div>
            ) : (
              services.map((s) => (
                <div
                  key={s.id}
                  className="rounded-xl border bg-white/40 p-4 shadow-sm"
                  style={{ borderColor: "#E8D5CC" }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{s.name}</div>
                      <div className="mt-1 text-xs" style={{ color: "#7A5C4F" }}>
                        {s.is_complex ? "Сложна услуга" : `${s.duration_minutes ?? s.active_start_max ?? 0} мин`}
                      </div>
                    </div>
                    <div className="text-sm font-semibold">{Number(s.price_eur).toFixed(0)}€</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">Галерия</h2>
          <div className="mt-4 columns-2 gap-3 [column-fill:_balance] sm:columns-3">
            {gallery.map((g) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={g.id}
                src={g.url}
                alt=""
                className="mb-3 w-full break-inside-avoid rounded-xl border bg-white/40 object-cover shadow-sm"
                style={{ borderColor: "#E8D5CC" }}
                loading="lazy"
              />
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-xl border bg-white/40 p-4" style={{ borderColor: "#E8D5CC" }}>
          <h2 className="text-xl font-semibold">Контакти</h2>
          <p className="mt-2 text-sm" style={{ color: "#7A5C4F" }}>
            Скоро: адрес, телефон, имейл и Google карта (ще ги вържем от настройките на тенанта).
          </p>
        </section>
      </main>

      <footer className="border-t" style={{ borderColor: "#E8D5CC" }}>
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-6 text-xs" style={{ color: "#7A5C4F" }}>
          <div>© {new Date().getFullYear()} {tenant.salon_name}</div>
          <div className="opacity-80">Powered by SalonApp.pro</div>
        </div>
      </footer>
    </div>
  );
}

