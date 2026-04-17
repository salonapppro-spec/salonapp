import Link from "next/link";
import type { GalleryItem, Service, Tenant } from "@/types";

export function BoldTemplate(props: { tenant: Tenant; services: Service[]; gallery: GalleryItem[] }) {
  const { tenant, services } = props;
  const primary = tenant.primary_color ?? "#FF385C";

  return (
    <div className="min-h-screen" style={{ background: "#1C1C1E", color: "#FFFFFF" }}>
      <header className="border-b" style={{ borderColor: "#2C2C2E" }}>
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="text-lg font-semibold tracking-wide">{tenant.salon_name}</div>
          <Link href={`/${tenant.salon_slug}/booking`} className="px-4 py-2 text-sm font-semibold" style={{ background: primary }}>
            Запази час
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-12 pt-10">
        <h1 className="text-4xl font-semibold">Bold & Energetic</h1>
        <p className="mt-3 max-w-prose text-sm opacity-80">Тъмен енергичен шаблон (компактни тъмни карти). Довършване 1:1 по описанието.</p>

        <section className="mt-10">
          <h2 className="text-lg font-semibold">Услуги</h2>
          <div className="mt-4 grid gap-3">
            {services.map((s) => (
              <div key={s.id} className="border p-4" style={{ borderColor: "#2C2C2E", background: "#2C2C2E" }}>
                <div className="flex items-start justify-between">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-sm font-semibold" style={{ color: primary }}>
                    {Number(s.price_eur).toFixed(0)}€
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

