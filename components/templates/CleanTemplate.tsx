import Link from "next/link";
import type { GalleryItem, Service, Tenant } from "@/types";

export function CleanTemplate(props: { tenant: Tenant; services: Service[]; gallery: GalleryItem[] }) {
  const { tenant, services } = props;

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="text-lg font-semibold">{tenant.salon_name}</div>
          <Link
            href={`/${tenant.salon_slug}/booking`}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
          >
            Запази час
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-12 pt-10">
        <h1 className="text-4xl font-semibold">Clean & Professional</h1>
        <p className="mt-3 max-w-prose text-sm text-neutral-600">
          Модерен шаблон за фризьорски салони (Inter, grid, таблица с услуги). Довършване 1:1 по спецификацията.
        </p>

        <section className="mt-10">
          <h2 className="text-lg font-semibold">Услуги</h2>
          <div className="mt-4 overflow-hidden rounded-lg border">
            <div className="grid grid-cols-3 bg-neutral-50 px-3 py-2 text-xs font-semibold text-neutral-700">
              <div>Услуга</div>
              <div>Време</div>
              <div className="text-right">Цена</div>
            </div>
            <div className="divide-y">
              {services.map((s) => (
                <div key={s.id} className="grid grid-cols-3 px-3 py-3 text-sm">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-neutral-600">{s.is_complex ? "Сложна" : `${s.duration_minutes ?? 0} мин`}</div>
                  <div className="text-right font-semibold">{Number(s.price_eur).toFixed(0)}€</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

