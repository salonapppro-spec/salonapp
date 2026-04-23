"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const SLUG_HINT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Смяна на публичния path (`salonapp.pro/slug` и `slug.salonapp.pro`) — само super_admin, виж /api/super-admin/tenant/slug. */
export function SuperAdminSalonSlugForm(props: { currentSlug: string }) {
  const router = useRouter();
  const [val, setVal] = useState(props.currentSlug);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const canSubmit =
    val.trim() !== "" &&
    val.trim() !== props.currentSlug &&
    SLUG_HINT.test(val.trim()) &&
    !busy;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(null);
    if (!canSubmit) return;
    const oldSlug = props.currentSlug;
    const next = val.trim();
    if (
      !window.confirm(
        "Смяната на адреса променя URL на сайта, отметки и линкове. Старият път вече няма да сочи същия сайт, освен ако не е направено пренасочване. Продължи?"
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/super-admin/tenant/slug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ old_salon_slug: oldSlug, new_salon_slug: next }),
      });
      const json = (await res.json()) as { error?: string; new_salon_slug?: string; ok?: boolean };
      if (!res.ok) {
        setErr(json.error ?? "Неуспешна смяна.");
        return;
      }
      setOk("Адресът е сменен. Пренасочване…");
      router.refresh();
      const ns = json.new_salon_slug ?? next;
      window.location.assign(`/super-admin/${ns}`);
    } catch {
      setErr("Мрежова грешка. Опитай пак.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="mt-2 space-y-3">
      <p className="text-xs text-neutral-500">
        Публичният път:{" "}
        <span className="font-mono text-neutral-300">
          salonapp.pro/<span className="text-sky-300">{props.currentSlug}</span>
        </span>{" "}
        · субдомейн:{" "}
        <span className="font-mono text-neutral-300">
          {props.currentSlug}.salonapp.pro
        </span>
      </p>
      <div>
        <label htmlFor="sa-new-salon-slug" className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
          Нов адрес (латиница, тирета)
        </label>
        <div className="mt-1 flex items-center gap-1">
          <span className="shrink-0 text-xs text-neutral-600">…/</span>
          <input
            id="sa-new-salon-slug"
            className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100"
            value={val}
            onChange={(e) => setVal(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            placeholder="my-salon"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      </div>
      {err && (
        <p className="text-xs leading-relaxed text-red-300 break-words ring-1 ring-red-900/50 rounded-md bg-red-950/20 p-2">
          {err}
        </p>
      )}
      {ok && <p className="text-xs font-semibold text-emerald-400">{ok}</p>}
      <button
        type="submit"
        className="rounded-lg border border-amber-700/50 bg-amber-950/30 px-4 py-2.5 text-xs font-semibold text-amber-200 transition enabled:hover:bg-amber-900/50 disabled:opacity-50"
        disabled={!canSubmit}
      >
        {busy ? "Смяна…" : "Смени публичния адрес (slug)"}
      </button>
    </form>
  );
}
