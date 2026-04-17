"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import type { GalleryItem } from "@/types";

export function GalleryClient(props: { initialItems: GalleryItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState<GalleryItem[]>(props.initialItems);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/admin/gallery");
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error ?? "Грешка");
    setItems(json.items ?? []);
  }

  async function addUrl() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Неуспешно");
      setUrl("");
      await refresh();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка");
    } finally {
      setLoading(false);
    }
  }

  async function uploadFiles(files: File[]) {
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) {
      setError("Моля изберете файлове снимки (JPG, PNG, WebP…).");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      for (const file of images) {
        const fd = new FormData();
        fd.set("file", file);
        const res = await fetch("/api/admin/gallery/upload", { method: "POST", body: fd });
        const json = (await res.json()) as { error?: string };
        if (!res.ok) {
          throw new Error(
            json?.error ??
              "Качването не успя. Нужен е публичен Storage bucket „gallery“ в Supabase (или env ADMIN_GALLERY_BUCKET)."
          );
        }
      }
      await refresh();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка");
    } finally {
      setLoading(false);
    }
  }

  async function toggleVisible(g: GalleryItem) {
    setError(null);
    const res = await fetch(`/api/admin/gallery/${g.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_visible: !g.is_visible }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json?.error ?? "Грешка");
      return;
    }
    await refresh();
    router.refresh();
  }

  async function remove(id: string) {
    setError(null);
    const res = await fetch(`/api/admin/gallery/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) {
      setError(json?.error ?? "Грешка");
      return;
    }
    await refresh();
    router.refresh();
  }

  const reorder = useCallback(
    async (ordered: GalleryItem[]) => {
      setItems(ordered);
      const res = await fetch("/api/admin/gallery/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: ordered.map((x) => x.id) }),
      });
      if (!res.ok) {
        await refresh();
        return;
      }
      router.refresh();
    },
    [router]
  );

  function onDrop(targetId: string) {
    if (!dragId || dragId === targetId) return;
    const ix = items.findIndex((x) => x.id === dragId);
    const iy = items.findIndex((x) => x.id === targetId);
    if (ix < 0 || iy < 0) return;
    const next = [...items];
    const [m] = next.splice(ix, 1);
    next.splice(iy, 0, m!);
    void reorder(next);
    setDragId(null);
  }

  return (
    <div className="mt-8 space-y-6">
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-900">{error}</div>
      ) : null}

      <div
        className="admin-card flex min-h-[220px] flex-col items-center justify-center border-2 border-dashed border-brand-400/70 bg-brand-50/40 px-6 py-10 text-center"
        onDragOver={(e) => {
          e.preventDefault();
          e.currentTarget.classList.add("border-brand-500", "bg-brand-50");
        }}
        onDragLeave={(e) => {
          e.currentTarget.classList.remove("border-brand-500", "bg-brand-50");
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.currentTarget.classList.remove("border-brand-500", "bg-brand-50");
          const list = e.dataTransfer.files;
          if (list?.length) void uploadFiles(Array.from(list));
        }}
      >
        <h2 className="text-lg font-semibold tracking-tight text-brand-900">Качи снимки</h2>
        <p className="mt-2 max-w-md text-sm text-brand-800/90">
          Влачете файлове тук или натисмете бутона. Препоръчително до 5 MB на файл. Форматите са стандартни изображения.
        </p>
        <label className="btn-admin-primary mt-6 cursor-pointer px-8">
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            disabled={loading}
            onChange={(e) => {
              const list = e.target.files;
              if (!list?.length) return;
              void uploadFiles(Array.from(list)).then(() => {
                e.target.value = "";
              });
            }}
          />
          {loading ? "Качване…" : "Избери снимки"}
        </label>
      </div>

      <details className="admin-card group">
        <summary className="cursor-pointer text-sm font-semibold text-brand-800 marker:text-brand-600">
          Външен линк към снимка <span className="font-normal text-brand-600/90">(по изключение)</span>
        </summary>
        <p className="mt-2 text-xs text-brand-700/85">
          Само ако снимката вече е качена другаде (CDN, социални мрежи). Нормалният начин е качването отгоре.
        </p>
        <input
          className="input-admin mt-3"
          placeholder="https://..."
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button
          type="button"
          className="btn-admin-ghost mt-3"
          disabled={!url || loading}
          onClick={() => void addUrl()}
        >
          Добави от линк
        </button>
      </details>

      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((g) => (
          <div
            key={g.id}
            draggable
            onDragStart={() => setDragId(g.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(g.id)}
            className="overflow-hidden rounded-2xl border border-brand-200/80 bg-white shadow-card"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={g.url} alt="" className="aspect-[4/3] h-auto w-full object-cover opacity-100 sm:h-44 sm:aspect-auto" />
            <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center gap-2 text-xs text-brand-800">
                <input type="checkbox" checked={g.is_visible} onChange={() => void toggleVisible(g)} />
                Видима на сайта
              </label>
              <button
                type="button"
                className="btn-admin-ghost shrink-0 border-red-200 text-red-700 hover:bg-red-50"
                onClick={() => remove(g.id)}
              >
                Изтрий
              </button>
            </div>
            <p className="truncate px-3 pb-2 text-[10px] text-brand-600">Влачете картата за пренареждане</p>
          </div>
        ))}
      </div>
    </div>
  );
}
