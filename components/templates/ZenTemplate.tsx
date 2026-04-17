import Link from "next/link";
import type { GalleryItem, Service, Tenant } from "@/types";

export function ZenTemplate(props: { tenant: Tenant; services: Service[]; gallery: GalleryItem[] }) {
  const { tenant, services } = props;
  const primary = tenant.primary_color ?? "#8B9D77";

  return (
    <div className="min-h-screen" style={{ background: "#F5EFE6", color: "#3D3728" }}>
      <header className="mx-auto max-w-4xl px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">{tenant.salon_name}</div>
          <Link
            href={`/${tenant.salon_slug}/booking`}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ background: primary }}
          >
            Запази час
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 pb-12">
        <div className="rounded-2xl bg-white/50 p-6">
          <h1 className="text-3xl font-semibold">Wellness & Calm</h1>
          <p className="mt-2 text-sm opacity-80">Шаблон ZEN (whitespace, природни снимки). Довършване 1:1 по описанието.</p>
        </div>

        <section className="mt-10">
          <h2 className="text-lg font-semibold">Услуги</h2>
          <div className="mt-4 grid gap-3">
            {services.map((s) => (
              <div key={s.id} className="rounded-2xl bg-white/50 p-4">
                <div className="flex items-start justify-between">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-sm font-semibold">{Number(s.price_eur).toFixed(0)}€</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

