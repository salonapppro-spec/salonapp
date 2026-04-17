import type { GalleryItem, Service, Tenant } from "@/types";
import Link from "next/link";

export function LuxeTemplate(props: { tenant: Tenant; services: Service[]; gallery: GalleryItem[] }) {
  const { tenant, services } = props;
  const gold = tenant.primary_color ?? "#C9A84C";

  return (
    <div className="min-h-screen" style={{ background: "#F5F5F0", color: "#1A1A1A" }}>
      <header className="border-b" style={{ borderColor: "#E8E0D0" }}>
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div className="text-lg font-semibold tracking-wide">{tenant.salon_name}</div>
          <Link
            href={`/${tenant.salon_slug}/booking`}
            className="rounded-md border px-4 py-2 text-sm font-medium"
            style={{ borderColor: gold, color: gold }}
          >
            Запази час
          </Link>
        </div>
        <div className="mx-auto max-w-4xl px-4">
          <div className="h-px w-full" style={{ background: gold, opacity: 0.6 }} />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 pb-12 pt-10">
        <h1 className="text-4xl font-semibold">Luxury experience</h1>
        <p className="mt-3 max-w-prose text-sm opacity-80">
          Минималистичен, луксозен шаблон. Ще го довършим 1:1 по описанието (whitespace, outline бутони, списъчни услуги).
        </p>

        <section className="mt-10">
          <h2 className="text-lg font-semibold">Услуги</h2>
          <div className="mt-4 divide-y" style={{ borderColor: "#E8E0D0" }}>
            {services.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-4">
                <div className="font-medium">{s.name}</div>
                <div className="text-sm" style={{ color: gold }}>
                  {Number(s.price_eur).toFixed(0)}€
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

