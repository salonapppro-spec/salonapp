"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import type { GalleryItem } from "@/types";

const GOLD = "#C9A84C";
const ROSE = "#C8826A";

export function GalleryClient(props: { initialItems: GalleryItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState<GalleryItem[]>(props.initialItems);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);

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
      setShowUrlInput(false);
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
    // Проверка преди изпращане — Vercel отхвърля > 4.5 MB преди сървъра
    const tooBig = images.find((f) => f.size > 4 * 1024 * 1024);
    if (tooBig) {
      setError(`„${tooBig.name}" е твърде голяма (${(tooBig.size / 1024 / 1024).toFixed(1)} MB). Моля компресирай снимката до под 4 MB преди качване.`);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      for (const file of images) {
        const fd = new FormData();
        fd.set("file", file);
        const res = await fetch("/api/admin/gallery/upload", { method: "POST", body: fd });
        // Сървърът може да върне plain-text 413 преди route handler-а — catch gracefully
        const json = await res.json().catch(() => null) as { error?: string } | null;
        if (!res.ok) {
          if (res.status === 413) {
            throw new Error("Снимката е твърде голяма. Компресирай я до под 4 MB и опитай отново.");
          }
          throw new Error(json?.error ?? "Качването не успя. Нужен е публичен Storage bucket 'gallery' в Supabase.");
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
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { setError(json?.error ?? "Грешка"); return; }
    await refresh();
    router.refresh();
  }

  async function remove(id: string) {
    setError(null);
    const res = await fetch(`/api/admin/gallery/${id}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { setError(json?.error ?? "Грешка"); return; }
    await refresh();
    router.refresh();
  }

  const reorder = useCallback(async (ordered: GalleryItem[]) => {
    setItems(ordered);
    const res = await fetch("/api/admin/gallery/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: ordered.map((x) => x.id) }),
    });
    if (!res.ok) { await refresh(); return; }
    router.refresh();
  }, [router]);

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
    <div className="mt-6 space-y-4">
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{error}</div>
      )}

      {/* Upload zone */}
      <div
        className="relative overflow-hidden rounded-2xl border-2 border-dashed transition-colors"
        style={{ borderColor: "rgba(201,168,76,0.4)", background: "rgba(201,168,76,0.04)" }}
        onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.background = "rgba(201,168,76,0.08)"; }}
        onDragLeave={(e) => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.4)"; e.currentTarget.style.background = "rgba(201,168,76,0.04)"; }}
        onDrop={(e) => {
          e.preventDefault();
          e.currentTarget.style.borderColor = "rgba(201,168,76,0.4)";
          e.currentTarget.style.background = "rgba(201,168,76,0.04)";
          const list = e.dataTransfer.files;
          if (list?.length) void uploadFiles(Array.from(list));
        }}
      >
        <div className="flex flex-col items-center px-6 py-10 text-center">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl shadow-sm"
            style={{ background: `linear-gradient(135deg, rgba(201,168,76,0.15), rgba(200,130,106,0.15))` }}
          >
            📷
          </div>
          <h2 className="mt-3 text-base font-black text-[#1A1A1A]">Качи снимки</h2>
          <p className="mt-1 max-w-xs text-xs text-[#1A1A1A]/40">
            Влачи файлове тук или натисни бутона. До 5 MB на снимка.
          </p>
          <label
            className="mt-5 cursor-pointer rounded-xl px-5 py-2.5 text-sm font-black text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
            style={{ background: loading ? "rgba(201,168,76,0.5)" : `linear-gradient(135deg, ${GOLD}, ${ROSE})` }}
          >
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              disabled={loading}
              onChange={(e) => {
                const list = e.target.files;
                if (!list?.length) return;
                void uploadFiles(Array.from(list)).then(() => { e.target.value = ""; });
              }}
            />
            {loading ? "Качване…" : "📁 Избери снимки"}
          </label>
        </div>
      </div>

      {/* External URL (collapsed) */}
      <div className="rounded-2xl bg-white p-4" style={{ border: "1px solid rgba(201,168,76,0.18)" }}>
        <button
          type="button"
          className="flex items-center gap-2 text-xs font-semibold text-[#1A1A1A]/50 hover:text-[#1A1A1A]/80 transition"
          onClick={() => setShowUrlInput((v) => !v)}
        >
          <span>{showUrlInput ? "▾" : "▸"}</span>
          Добави от външен линк <span className="font-normal opacity-60">(по изключение)</span>
        </button>
        {showUrlInput && (
          <div className="mt-3 flex gap-2">
            <input
              className="flex-1 rounded-xl border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-[#C9A84C]/30"
              style={{ borderColor: "rgba(201,168,76,0.3)", background: "#F8EBDD" }}
              placeholder="https://..."
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <button
              type="button"
              className="rounded-xl px-4 py-2 text-sm font-black text-white transition hover:opacity-90 disabled:opacity-50"
              style={{ background: `linear-gradient(135deg, ${GOLD}, ${ROSE})` }}
              disabled={!url || loading}
              onClick={() => void addUrl()}
            >
              Добави
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      {items.length > 0 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-[#1A1A1A]/40">
            {items.length} снимки · {items.filter((x) => x.is_visible).length} видими
          </p>
          <p className="text-[10px] text-[#1A1A1A]/30">Влачи картите за пренареждане</p>
        </div>
      )}

      {/* Grid */}
      {items.length === 0 ? (
        <div
          className="rounded-2xl px-6 py-12 text-center text-sm text-[#1A1A1A]/35"
          style={{ border: "1px dashed rgba(201,168,76,0.25)" }}
        >
          Все още няма снимки. Качи първата от бутона горе.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((g) => (
            <div
              key={g.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(g.id)}
              className="relative overflow-hidden rounded-2xl bg-white"
              style={{
                border: dragId === g.id ? `2px solid ${GOLD}` : "1px solid rgba(201,168,76,0.18)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                opacity: dragId === g.id ? 0.6 : 1,
              }}
            >
              {/* Drag + preview only на снимката — без overlay над бутони */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <div
                className="group relative cursor-grab select-none overflow-hidden bg-[#faf7f2] active:cursor-grabbing"
                draggable
                onDragStart={() => setDragId(g.id)}
              >
                <img
                  src={g.url}
                  alt=""
                  className="pointer-events-none aspect-[4/3] w-full object-cover"
                  draggable={false}
                />
                {/* Подсказка „Влачи“ само над снимката; не прихваща клика */}
                <div className="pointer-events-none absolute inset-0 flex items-end bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="flex w-full px-3 pb-2">
                    <span className="text-[10px] font-semibold text-white/80">⠿ Влачи по снимката</span>
                  </div>
                </div>
              </div>

              {/* Контроли — извън drag layer, винаги кликаеми */}
              <div className="relative z-10 flex items-center justify-between border-t px-3 py-2.5" style={{ borderColor: "rgba(201,168,76,0.12)", background: "#fff" }}>
                <label className="flex cursor-pointer items-center gap-2">
                  <div
                    className="relative h-4 w-7 rounded-full transition-colors"
                    style={{ background: g.is_visible ? `linear-gradient(135deg, ${GOLD}, ${ROSE})` : "rgba(0,0,0,0.12)" }}
                  >
                    <span
                      className="absolute top-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-transform"
                      style={{ left: g.is_visible ? "14px" : "2px" }}
                    />
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={g.is_visible}
                      draggable={false}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => void toggleVisible(g)}
                    />
                  </div>
                  <span className="text-xs font-semibold text-[#1A1A1A]/60">
                    {g.is_visible ? "Видима" : "Скрита"}
                  </span>
                </label>
                <button
                  type="button"
                  draggable={false}
                  className="rounded-lg px-2 py-1 text-xs font-semibold text-red-500 transition hover:bg-red-50"
                  onMouseDown={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    void remove(g.id);
                  }}
                >
                  Изтрий
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
