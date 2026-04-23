"use client";

import { useEffect, useRef, useMemo, useState } from "react";

import type { Specialist, Tenant } from "@/types";

type SpecialistDraft = Pick<Specialist, "id" | "name" | "role" | "bio" | "avatar_url" | "is_active">;

const GOLD = "#C9A84C";
const ROSE = "#C8826A";

/** Reusable image upload widget — shows preview + file button */
function ImageUpload({
  value,
  onChange,
  label,
  hint,
  aspect = "square",
}: {
  value: string;
  onChange: (url: string) => void;
  label: string;
  hint?: string;
  aspect?: "square" | "wide";
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function upload(file: File) {
    setUploading(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const json = await res.json() as { url?: string; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Грешка при качване");
      if (json.url) onChange(json.url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Грешка");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: "rgba(26,26,26,0.4)" }}>{label}</label>
      <div className="mt-2 flex items-start gap-3">
        <div
          className="shrink-0 overflow-hidden rounded-xl border flex items-center justify-center bg-[#FAF7F2]"
          style={{
            width: aspect === "wide" ? 96 : 56,
            height: 56,
            borderColor: "rgba(201,168,76,0.2)",
          }}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
          ) : (
            <span className="text-xl opacity-25">🖼️</span>
          )}
        </div>

        <div className="flex-1 space-y-1.5">
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-xl px-3 py-2 text-xs font-black text-white transition hover:opacity-90 disabled:opacity-50"
              style={{ background: `linear-gradient(135deg, ${GOLD}, ${ROSE})` }}
              disabled={uploading}
              onClick={() => ref.current?.click()}
            >
              {uploading ? "Качване…" : "📁 Избери снимка"}
            </button>
            {value && (
              <button
                type="button"
                className="rounded-xl border px-3 py-2 text-xs font-semibold text-[#1A1A1A]/40 transition hover:text-red-600"
                style={{ borderColor: "rgba(201,168,76,0.2)" }}
                onClick={() => onChange("")}
              >
                ✕ Премахни
              </button>
            )}
          </div>
          {hint && <p className="text-[10px] text-[#1A1A1A]/30">{hint}</p>}
          {err && <p className="text-[10px] text-red-600">{err}</p>}
        </div>
      </div>

      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void upload(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function SectionHeader({ icon, title, desc }: { icon: string; title: string; desc?: string }) {
  return (
    <div className="mb-4 flex items-center gap-3 border-b pb-4" style={{ borderColor: "rgba(201,168,76,0.12)" }}>
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg"
        style={{ background: "linear-gradient(135deg, rgba(201,168,76,0.15), rgba(200,130,106,0.15))" }}
      >
        {icon}
      </div>
      <div>
        <h2 className="text-sm font-black text-[#1A1A1A]">{title}</h2>
        {desc && <p className="mt-0.5 text-xs text-[#1A1A1A]/45">{desc}</p>}
      </div>
    </div>
  );
}

function FieldCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl bg-white p-5"
      style={{ border: "1px solid rgba(201,168,76,0.18)", boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.05)" }}
    >
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: "rgba(26,26,26,0.4)" }}>
      {children}
    </label>
  );
}

export function SettingsForm(props: { tenant: Tenant; specialists: Specialist[] }) {
  const { tenant } = props;
  const initialSerializedRef = useRef<string>("");

  const [address, setAddress] = useState(tenant.address ?? "");
  const [phone, setPhone] = useState(tenant.phone ?? "");
  const [email, setEmail] = useState(tenant.email ?? "");
  const [instagram, setInstagram] = useState(tenant.instagram_url ?? "");
  const [facebook, setFacebook] = useState(tenant.facebook_url ?? "");
  const [tiktok, setTiktok] = useState(tenant.tiktok_url ?? "");
  const [mapsEmbed, setMapsEmbed] = useState(tenant.google_maps_embed ?? "");

  const [saving, setSaving] = useState(false);
  const [savingSpecialists, setSavingSpecialists] = useState<string | null>(null);
  const [addingSpecialist, setAddingSpecialist] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [specialists, setSpecialists] = useState<SpecialistDraft[]>(
    props.specialists.map((s) => ({
      id: s.id,
      name: s.name ?? "",
      role: s.role ?? "",
      bio: s.bio ?? "",
      avatar_url: s.avatar_url ?? "",
      is_active: s.is_active,
    }))
  );

  const stringOrNull = (v: string) => {
    const t = v.trim();
    return t === "" ? null : t;
  };

  const payload = useMemo(
    () => ({
      address: address || undefined,
      phone: phone || undefined,
      email: email || undefined,
      instagram_url: stringOrNull(instagram),
      facebook_url: stringOrNull(facebook),
      tiktok_url: stringOrNull(tiktok),
      google_maps_embed: stringOrNull(mapsEmbed),
    }),
    [address, email, facebook, instagram, mapsEmbed, phone, tiktok]
  );
  const serializedPayload = JSON.stringify(payload);

  useEffect(() => {
    if (!initialSerializedRef.current) {
      initialSerializedRef.current = serializedPayload;
    }
  }, [serializedPayload]);

  const hasUnsavedChanges = initialSerializedRef.current !== "" && serializedPayload !== initialSerializedRef.current;

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [hasUnsavedChanges]);

  async function save() {
    setSaving(true); setError(null); setOk(null);
    try {
      const res = await fetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Неуспешно записване.");
      setOk("✓ Промените са запазени успешно.");
      initialSerializedRef.current = JSON.stringify(payload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка при запис.");
    } finally {
      setSaving(false);
    }
  }

  function patchSpecialistLocal(id: string, patch: Partial<SpecialistDraft>) {
    setSpecialists((curr) => curr.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  async function saveSpecialist(id: string) {
    const s = specialists.find((x) => x.id === id);
    if (!s) return;
    setSavingSpecialists(id); setError(null); setOk(null);
    try {
      const res = await fetch(`/api/admin/specialists/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: s.name.trim(), role: s.role || null, bio: s.bio || null, avatar_url: s.avatar_url || null, is_active: s.is_active }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Неуспешно записване.");
      setOk("✓ Специалистът е запазен.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка при запис.");
    } finally {
      setSavingSpecialists(null);
    }
  }

  async function addSpecialist() {
    setAddingSpecialist(true); setError(null); setOk(null);
    try {
      const res = await fetch("/api/admin/specialists", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "Нов специалист" }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Неуспешно добавяне.");
      const created = json?.specialist as SpecialistDraft | undefined;
      if (created?.id) {
        setSpecialists((curr) => [...curr, { id: created.id, name: created.name ?? "Нов специалист", role: created.role ?? "", bio: created.bio ?? "", avatar_url: created.avatar_url ?? "", is_active: created.is_active ?? true }]);
      }
      setOk("✓ Добавен нов специалист.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка при запис.");
    } finally {
      setAddingSpecialist(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{error}</div>}
      {ok && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{ok}</div>}
      {hasUnsavedChanges && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          Имате незапазени промени.
        </div>
      )}

      {/* ── Специалисти ── */}
      <FieldCard>
        <div id="specialists">
          <div className="mb-4 flex items-center justify-between border-b pb-4" style={{ borderColor: "rgba(201,168,76,0.12)" }}>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg" style={{ background: "linear-gradient(135deg, rgba(201,168,76,0.15), rgba(200,130,106,0.15))" }}>
                👥
              </div>
              <div>
                <h2 className="text-sm font-black text-[#1A1A1A]">Специалисти</h2>
                <p className="mt-0.5 text-xs text-[#1A1A1A]/45">Екипът на салона с профили и снимки</p>
              </div>
            </div>
            <button
              type="button"
              className="rounded-xl px-3 py-2 text-xs font-black text-white transition hover:opacity-90"
              style={{ background: `linear-gradient(135deg, ${GOLD}, ${ROSE})` }}
              onClick={addSpecialist}
              disabled={addingSpecialist}
            >
              {addingSpecialist ? "…" : "+ Добави"}
            </button>
          </div>

          <div className="space-y-3">
            {specialists.length === 0 ? (
              <div className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-[#1A1A1A]/35" style={{ borderColor: "rgba(201,168,76,0.25)" }}>
                Няма специалисти. Добави с бутона горе.
              </div>
            ) : (
              specialists.map((s) => (
                <div key={s.id} className="rounded-xl p-4" style={{ background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.12)" }}>
                  <div className="flex items-center gap-3 mb-3">
                    {s.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.avatar_url} alt={s.name} className="h-10 w-10 rounded-xl object-cover shrink-0" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white" style={{ background: `linear-gradient(135deg, ${GOLD}, ${ROSE})` }}>
                        {s.name.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-black text-[#1A1A1A]">{s.name || "Нов специалист"}</div>
                      <div className="text-xs text-[#1A1A1A]/40">{s.role || "Без роля"}</div>
                    </div>
                    <label className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-[#1A1A1A]/55 cursor-pointer">
                      <input type="checkbox" checked={s.is_active} onChange={(e) => patchSpecialistLocal(s.id, { is_active: e.target.checked })} className="rounded" />
                      Активен
                    </label>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>Име</Label>
                      <input className="input-admin" value={s.name} onChange={(e) => patchSpecialistLocal(s.id, { name: e.target.value })} />
                    </div>
                    <div>
                      <Label>Роля</Label>
                      <input className="input-admin" placeholder="Фризьор, козметолог…" value={s.role ?? ""} onChange={(e) => patchSpecialistLocal(s.id, { role: e.target.value })} />
                    </div>
                    <div className="sm:col-span-2">
                      <ImageUpload
                        label="Снимка на специалиста"
                        value={s.avatar_url ?? ""}
                        onChange={(url) => patchSpecialistLocal(s.id, { avatar_url: url })}
                        aspect="square"
                        hint="Квадратна снимка на специалиста."
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Описание</Label>
                      <textarea className="textarea-admin min-h-[4rem]" rows={3} value={s.bio ?? ""} onChange={(e) => patchSpecialistLocal(s.id, { bio: e.target.value })} />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="mt-3 w-full rounded-xl py-2.5 text-xs font-black text-white transition hover:opacity-90 disabled:opacity-50"
                    style={{ background: `linear-gradient(135deg, ${GOLD}, ${ROSE})` }}
                    onClick={() => void saveSpecialist(s.id)}
                    disabled={savingSpecialists === s.id}
                  >
                    {savingSpecialists === s.id ? "Запазване…" : "✓ Запази специалиста"}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </FieldCard>

      {/* ── Контакти ── */}
      <FieldCard>
        <SectionHeader icon="📍" title="Контакти" desc="Адрес, телефон и имейл за контакт" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label>Адрес</Label>
            <input className="input-admin" placeholder="бул. Витоша 42, София" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div>
            <Label>Телефон</Label>
            <input className="input-admin" placeholder="+359 88 …" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <Label>Имейл</Label>
            <input className="input-admin" type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
      </FieldCard>

      {/* ── Социални мрежи ── */}
      <FieldCard>
        <SectionHeader icon="📱" title="Социални мрежи" desc="Instagram, Facebook и TikTok линкове" />
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label>📸 Instagram</Label>
            <input className="input-admin" type="url" inputMode="url" placeholder="https://instagram.com/…" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
          </div>
          <div>
            <Label>👍 Facebook</Label>
            <input className="input-admin" type="url" inputMode="url" placeholder="https://facebook.com/…" value={facebook} onChange={(e) => setFacebook(e.target.value)} />
          </div>
          <div>
            <Label>🎵 TikTok</Label>
            <input className="input-admin" type="url" inputMode="url" placeholder="https://tiktok.com/…" value={tiktok} onChange={(e) => setTiktok(e.target.value)} />
          </div>
        </div>
      </FieldCard>

      {/* ── Google Maps ── */}
      <FieldCard>
        <SectionHeader icon="🗺️" title="Google Maps embed" desc="Поставете само embed URL (не iframe код)" />
        <p className="mb-3 text-xs text-[#1A1A1A]/40">Google Maps → Сподели → Embed → копирай само `src` URL, напр. `https://www.google.com/maps/embed?...`</p>
        <textarea className="textarea-admin-mono min-h-[7rem]" rows={5} value={mapsEmbed} onChange={(e) => setMapsEmbed(e.target.value)} placeholder="https://www.google.com/maps/embed?pb=..." />
      </FieldCard>

      {/* Save button */}
      <button
        type="button"
        className="w-full rounded-xl py-4 text-sm font-black text-white shadow-md transition hover:opacity-90 disabled:opacity-50 sm:w-auto sm:min-w-[14rem]"
        style={{ background: saving ? "rgba(201,168,76,0.5)" : `linear-gradient(135deg, ${GOLD}, ${ROSE})` }}
        onClick={save}
        disabled={saving}
      >
        {saving ? "Запазване…" : "✓ Запази всички промени"}
      </button>
    </div>
  );
}
