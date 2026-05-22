"use client";

import { useEffect, useRef, useMemo, useState, type ReactNode } from "react";

import type { Specialist, Tenant } from "@/types";

type SpecialistDraft = Pick<Specialist, "id" | "name" | "role" | "bio" | "avatar_url" | "is_active" | "is_technical_admin">;

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

function FieldCard({ children }: { children: ReactNode }) {
  return (
    <div
      className="rounded-2xl bg-white p-5"
      style={{ border: "1px solid rgba(201,168,76,0.18)", boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.05)" }}
    >
      {children}
    </div>
  );
}

function Label({ children }: { children: ReactNode }) {
  return (
    <label className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: "rgba(26,26,26,0.4)" }}>
      {children}
    </label>
  );
}

/** Извлича Google Maps embed URL от пълен iframe HTML или го връща ако е вече URL. */
function parseMapsEmbedUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("<iframe") || trimmed.startsWith("<IFRAME")) {
    const match = trimmed.match(/src="([^"]+)"/i);
    return match?.[1] ?? trimmed;
  }
  return trimmed;
}

function sectionSaveClass(disabled: boolean) {
  return `w-full rounded-xl py-3 text-xs font-black text-white shadow-sm transition sm:w-auto sm:min-w-[12rem] disabled:opacity-50 ${
    disabled ? "" : "hover:opacity-90"
  }`;
}

export function SettingsForm(props: { tenant: Tenant; specialists: Specialist[] }) {
  const { tenant } = props;
  const sectionInitialRef = useRef<{ logo: string; contacts: string; social: string; maps: string; hero: string; about: string } | null>(null);

  const [logo, setLogo] = useState(tenant.logo_url ?? "");
  const [heroTitle, setHeroTitle] = useState(tenant.hero_title ?? "");
  const [heroSubtitle, setHeroSubtitle] = useState(tenant.hero_subtitle ?? "");
  const [heroImageUrl, setHeroImageUrl] = useState(tenant.hero_image_url ?? "");
  const [aboutText1, setAboutText1] = useState(tenant.about_text1 ?? "");
  const [aboutText2, setAboutText2] = useState(tenant.about_text2 ?? "");
  const [aboutImageUrl, setAboutImageUrl] = useState(tenant.about_image_url ?? "");
  const [address, setAddress] = useState(tenant.address ?? "");
  const [phone, setPhone] = useState(tenant.phone ?? "");
  const [email, setEmail] = useState(tenant.email ?? "");
  const [instagram, setInstagram] = useState(tenant.instagram_url ?? "");
  const [facebook, setFacebook] = useState(tenant.facebook_url ?? "");
  const [tiktok, setTiktok] = useState(tenant.tiktok_url ?? "");
  const [mapsEmbed, setMapsEmbed] = useState(tenant.google_maps_embed ?? "");
  const [mapsPinLat, setMapsPinLat] = useState(() => {
    const pin = (tenant.design_tokens as Record<string, unknown> | null | undefined)?.maps_pin;
    if (!pin || typeof pin !== "object" || Array.isArray(pin)) return "";
    const lat = (pin as Record<string, unknown>).lat;
    return lat != null ? String(lat) : "";
  });
  const [mapsPinLng, setMapsPinLng] = useState(() => {
    const pin = (tenant.design_tokens as Record<string, unknown> | null | undefined)?.maps_pin;
    if (!pin || typeof pin !== "object" || Array.isArray(pin)) return "";
    const lng = (pin as Record<string, unknown>).lng;
    return lng != null ? String(lng) : "";
  });

  const [savingSection, setSavingSection] = useState<"logo" | "contacts" | "social" | "maps" | "hero" | "about" | "all" | null>(null);
  const [savingSpecialists, setSavingSpecialists] = useState<string | null>(null);
  const [deletingSpecialist, setDeletingSpecialist] = useState<string | null>(null);
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
      is_technical_admin: s.is_technical_admin,
    }))
  );

  const stringOrNull = (v: string) => {
    const t = v.trim();
    return t === "" ? null : t;
  };

  const snapLogo = () => JSON.stringify([logo.trim()]);
  const snapHero = () => JSON.stringify([heroTitle.trim(), heroSubtitle.trim(), heroImageUrl.trim()]);
  const snapAbout = () => JSON.stringify([aboutText1.trim(), aboutText2.trim(), aboutImageUrl.trim()]);
  const snapContacts = () => JSON.stringify([address.trim(), phone.trim(), email.trim()]);
  const snapSocial = () => JSON.stringify([instagram.trim(), facebook.trim(), tiktok.trim()]);
  const snapMaps = () => JSON.stringify([mapsEmbed.trim(), mapsPinLat.trim(), mapsPinLng.trim()]);

  useEffect(() => {
    if (sectionInitialRef.current) return;
    sectionInitialRef.current = {
      logo: JSON.stringify([(tenant.logo_url ?? "").trim()]),
      hero: JSON.stringify([
        (tenant.hero_title ?? "").trim(),
        (tenant.hero_subtitle ?? "").trim(),
        (tenant.hero_image_url ?? "").trim(),
      ]),
      about: JSON.stringify([
        (tenant.about_text1 ?? "").trim(),
        (tenant.about_text2 ?? "").trim(),
        (tenant.about_image_url ?? "").trim(),
      ]),
      contacts: JSON.stringify([
        (tenant.address ?? "").trim(),
        (tenant.phone ?? "").trim(),
        (tenant.email ?? "").trim(),
      ]),
      social: JSON.stringify([
        (tenant.instagram_url ?? "").trim(),
        (tenant.facebook_url ?? "").trim(),
        (tenant.tiktok_url ?? "").trim(),
      ]),
      maps: JSON.stringify([
        (tenant.google_maps_embed ?? "").trim(),
        mapsPinLat.trim(),
        mapsPinLng.trim(),
      ]),
    };
  }, [tenant]);

  const hasUnsavedLogo = sectionInitialRef.current != null && snapLogo() !== sectionInitialRef.current.logo;
  const hasUnsavedHero = sectionInitialRef.current != null && snapHero() !== sectionInitialRef.current.hero;
  const hasUnsavedAbout = sectionInitialRef.current != null && snapAbout() !== sectionInitialRef.current.about;
  const hasUnsavedContacts =
    sectionInitialRef.current != null && snapContacts() !== sectionInitialRef.current.contacts;
  const hasUnsavedSocial = sectionInitialRef.current != null && snapSocial() !== sectionInitialRef.current.social;
  const hasUnsavedMaps = sectionInitialRef.current != null && snapMaps() !== sectionInitialRef.current.maps;
  const hasUnsavedChanges =
    hasUnsavedLogo || hasUnsavedHero || hasUnsavedAbout || hasUnsavedContacts || hasUnsavedSocial || hasUnsavedMaps;

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [hasUnsavedChanges]);

  const payload = useMemo(
    () => ({
      logo_url: logo.trim() === "" ? "" : logo.trim(),
      hero_title: heroTitle || undefined,
      hero_subtitle: heroSubtitle || undefined,
      hero_image_url: heroImageUrl || undefined,
      about_text1: aboutText1 || undefined,
      about_text2: aboutText2 || undefined,
      about_image_url: aboutImageUrl || undefined,
      address: address || undefined,
      phone: phone || undefined,
      email: email || undefined,
      instagram_url: stringOrNull(instagram),
      facebook_url: stringOrNull(facebook),
      tiktok_url: stringOrNull(tiktok),
      google_maps_embed: stringOrNull(mapsEmbed),
    }),
    [address, aboutText1, aboutText2, aboutImageUrl, email, facebook, heroTitle, heroSubtitle, heroImageUrl, instagram, logo, mapsEmbed, phone, tiktok]
  );

  function markProfileSaved() {
    if (!sectionInitialRef.current) return;
    sectionInitialRef.current = {
      logo: snapLogo(),
      hero: snapHero(),
      about: snapAbout(),
      contacts: snapContacts(),
      social: snapSocial(),
      maps: snapMaps(),
    };
  }

  async function postSettingsPartial(body: Record<string, unknown>) {
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error ?? "Неуспешно записване.");
  }

  async function saveLogo() {
    setSavingSection("logo");
    setError(null);
    setOk(null);
    try {
      const t = logo.trim();
      await postSettingsPartial({ logo_url: t === "" ? "" : t });
      if (sectionInitialRef.current) {
        sectionInitialRef.current = { ...sectionInitialRef.current, logo: snapLogo() };
      }
      setOk("✓ Логото е запазено.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка при запис.");
    } finally {
      setSavingSection(null);
    }
  }

  async function saveHero() {
    setSavingSection("hero");
    setError(null);
    setOk(null);
    try {
      await postSettingsPartial({
        hero_title: heroTitle || undefined,
        hero_subtitle: heroSubtitle || undefined,
        hero_image_url: heroImageUrl || undefined,
      });
      if (sectionInitialRef.current) {
        sectionInitialRef.current = { ...sectionInitialRef.current, hero: snapHero() };
      }
      setOk("✓ Началната секция е запазена.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка при запис.");
    } finally {
      setSavingSection(null);
    }
  }

  async function saveAbout() {
    setSavingSection("about");
    setError(null);
    setOk(null);
    try {
      await postSettingsPartial({
        about_text1: aboutText1 || undefined,
        about_text2: aboutText2 || undefined,
        about_image_url: aboutImageUrl || undefined,
      });
      if (sectionInitialRef.current) {
        sectionInitialRef.current = { ...sectionInitialRef.current, about: snapAbout() };
      }
      setOk('✓ Секцията „За нас" е запазена.');
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка при запис.");
    } finally {
      setSavingSection(null);
    }
  }

  async function saveContacts() {
    setSavingSection("contacts");
    setError(null);
    setOk(null);
    try {
      await postSettingsPartial({
        address: address || undefined,
        phone: phone || undefined,
        email: email || undefined,
      });
      if (sectionInitialRef.current) {
        sectionInitialRef.current = { ...sectionInitialRef.current, contacts: snapContacts() };
      }
      setOk("✓ Контактите са запазени.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка при запис.");
    } finally {
      setSavingSection(null);
    }
  }

  async function saveSocial() {
    setSavingSection("social");
    setError(null);
    setOk(null);
    try {
      await postSettingsPartial({
        instagram_url: stringOrNull(instagram),
        facebook_url: stringOrNull(facebook),
        tiktok_url: stringOrNull(tiktok),
      });
      if (sectionInitialRef.current) {
        sectionInitialRef.current = { ...sectionInitialRef.current, social: snapSocial() };
      }
      setOk("✓ Социалните мрежи са запазени.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка при запис.");
    } finally {
      setSavingSection(null);
    }
  }

  async function saveMapsSection() {
    setSavingSection("maps");
    setError(null);
    setOk(null);
    try {
      const latStr = mapsPinLat.trim();
      const lngStr = mapsPinLng.trim();
      const cleanedEmbed = parseMapsEmbedUrl(mapsEmbed);
      await postSettingsPartial({
        google_maps_embed: stringOrNull(cleanedEmbed),
        ...(latStr && lngStr
          ? { maps_pin_lat: Number(latStr), maps_pin_lng: Number(lngStr) }
          : latStr === "" && lngStr === ""
            ? { maps_pin_lat: undefined, maps_pin_lng: undefined }
            : {}),
      });
      if (sectionInitialRef.current) {
        sectionInitialRef.current = { ...sectionInitialRef.current, maps: snapMaps() };
      }
      setOk("✓ Картата е запазена.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка при запис.");
    } finally {
      setSavingSection(null);
    }
  }

  async function save() {
    setSavingSection("all");
    setError(null);
    setOk(null);
    try {
      await postSettingsPartial(payload);
      markProfileSaved();
      setOk("✓ Всички настройки от страницата са запазени.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка при запис.");
    } finally {
      setSavingSection(null);
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
        setSpecialists((curr) => [
          ...curr,
          {
            id: created.id,
            name: created.name ?? "Нов специалист",
            role: created.role ?? "",
            bio: created.bio ?? "",
            avatar_url: created.avatar_url ?? "",
            is_active: created.is_active ?? true,
            is_technical_admin: created.is_technical_admin ?? false,
          },
        ]);
      }
      setOk("✓ Добавен нов специалист.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка при запис.");
    } finally {
      setAddingSpecialist(false);
    }
  }

  async function deleteSpecialist(id: string) {
    const s = specialists.find((x) => x.id === id);
    if (!s || s.is_technical_admin) return;
    if (!window.confirm("Да се изтрие този специалист? Тази стъпка не може да бъде отменена.")) return;
    setDeletingSpecialist(id);
    setError(null);
    setOk(null);
    try {
      const res = await fetch(`/api/admin/specialists/${id}`, { method: "DELETE" });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json?.error ?? "Неуспешно изтриване.");
      setSpecialists((curr) => curr.filter((x) => x.id !== id));
      setOk("✓ Специалистът е премахнат.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка при изтриване.");
    } finally {
      setDeletingSpecialist(null);
    }
  }

  return (
    <div className="space-y-4">
      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{error}</div>}
      {ok && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{ok}</div>}
      {hasUnsavedChanges && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          Имате незапазени промени в някоя секция по-долу — ползвай съответния бутон „Запази“.
        </div>
      )}

      {/* ── Специалисти (най-отгоре) ── */}
      <FieldCard>
        <div id="specialists">
          <div className="mb-4 flex items-center justify-between border-b pb-4" style={{ borderColor: "rgba(201,168,76,0.12)" }}>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg" style={{ background: "linear-gradient(135deg, rgba(201,168,76,0.15), rgba(200,130,106,0.15))" }}>
                👥
              </div>
              <div>
                <h2 className="text-sm font-black text-[#1A1A1A]">Специалисти</h2>
                <p className="mt-0.5 text-xs text-[#1A1A1A]/45">Екипът на салона с профили и снимки. Всеки ред се запазва отделно.</p>
              </div>
            </div>
            <button
              type="button"
              className="rounded-xl px-3 py-2 text-xs font-black text-white transition hover:opacity-90"
              style={{ background: `linear-gradient(135deg, ${GOLD}, ${ROSE})` }}
              onClick={addSpecialist}
              disabled={addingSpecialist || savingSection != null}
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
                  <div className="mb-3 flex items-center gap-3">
                    {s.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.avatar_url} alt={s.name} className="h-10 w-10 shrink-0 rounded-xl object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white" style={{ background: `linear-gradient(135deg, ${GOLD}, ${ROSE})` }}>
                        {s.name.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-black text-[#1A1A1A]">{s.name || "Нов специалист"}</div>
                      <div className="text-xs text-[#1A1A1A]/40">{s.role || "Без роля"}</div>
                    </div>
                    <label className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-[#1A1A1A]/55 cursor-pointer">
                      <input type="checkbox" checked={s.is_active} onChange={(e) => patchSpecialistLocal(s.id, { is_active: e.target.checked })} className="rounded" />
                      Активен
                    </label>
                  </div>
                  {s.is_technical_admin && (
                    <p className="mb-2 text-[11px] text-[#1A1A1A]/45">Свързан с администраторския акаунт — изтриване не е възможно от тук.</p>
                  )}

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
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      className="w-full rounded-xl py-2.5 text-xs font-black text-white transition hover:opacity-90 disabled:opacity-50 sm:w-auto sm:min-w-[12rem]"
                      style={{ background: `linear-gradient(135deg, ${GOLD}, ${ROSE})` }}
                      onClick={() => void saveSpecialist(s.id)}
                      disabled={savingSpecialists === s.id || savingSection != null}
                    >
                      {savingSpecialists === s.id ? "Запазване…" : "✓ Запази специалиста"}
                    </button>
                    <button
                      type="button"
                      className="w-full rounded-xl border border-red-200 bg-white py-2.5 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-50 sm:w-auto sm:min-w-[10rem]"
                      onClick={() => void deleteSpecialist(s.id)}
                      disabled={s.is_technical_admin || deletingSpecialist != null || savingSection != null}
                    >
                      {deletingSpecialist === s.id ? "Премахване…" : "Изтрий специалиста"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </FieldCard>

      {/* ── Лого (публичен сайт) — салонският /admin, без super-admin ── */}
      <FieldCard>
        <div id="salon-logo">
          <SectionHeader icon="🏷️" title="Лого на салона" desc="Показва се в шапката на публичния сайт на салона" />
          {hasUnsavedLogo && <p className="mb-3 text-xs font-semibold text-amber-800">Промените още не са запазени.</p>}
          <ImageUpload
            label="Качи лого (PNG, JPG, WebP)"
            value={logo}
            onChange={setLogo}
            aspect="wide"
            hint="По възможност хоризонтално лого. „Премахни“ маха логото от сайта."
          />
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              className={sectionSaveClass(!!savingSection)}
              style={{ background: savingSection === "logo" ? "rgba(201,168,76,0.5)" : `linear-gradient(135deg, ${GOLD}, ${ROSE})` }}
              onClick={() => void saveLogo()}
              disabled={savingSection != null}
            >
              {savingSection === "logo" ? "Запазване…" : "✓ Запази логото"}
            </button>
          </div>
        </div>
      </FieldCard>

      {/* ── Начална секция (Hero) ── */}
      <FieldCard>
        <SectionHeader icon="🏠" title="Начална секция" desc="Заглавие, подзаглавие и главна снимка на сайта" />
        {hasUnsavedHero && <p className="mb-3 text-xs font-semibold text-amber-800">Промените още не са запазени.</p>}
        <div className="grid gap-4">
          <div>
            <Label>Заглавие</Label>
            <input
              className="input-admin"
              placeholder="Красота, която говори за теб"
              value={heroTitle}
              onChange={(e) => setHeroTitle(e.target.value)}
              maxLength={120}
            />
            <p className="mt-1 text-[10px] text-[#1A1A1A]/30">{heroTitle.length}/120</p>
          </div>
          <div>
            <Label>Подзаглавие</Label>
            <input
              className="input-admin"
              placeholder="Запази час онлайн, без чакане"
              value={heroSubtitle}
              onChange={(e) => setHeroSubtitle(e.target.value)}
              maxLength={200}
            />
            <p className="mt-1 text-[10px] text-[#1A1A1A]/30">{heroSubtitle.length}/200</p>
          </div>
          <ImageUpload
            label="Главна снимка"
            value={heroImageUrl}
            onChange={setHeroImageUrl}
            aspect="wide"
            hint="Снимка с висока разделителна способност, 16:9 или по-широка."
          />
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className={sectionSaveClass(!!savingSection)}
            style={{ background: savingSection === "hero" ? "rgba(201,168,76,0.5)" : `linear-gradient(135deg, ${GOLD}, ${ROSE})` }}
            onClick={() => void saveHero()}
            disabled={savingSection != null}
          >
            {savingSection === "hero" ? "Запазване…" : "✓ Запази началната секция"}
          </button>
        </div>
      </FieldCard>

      {/* ── За нас (About) ── */}
      <FieldCard>
        <SectionHeader icon="💬" title="За нас" desc={'Текст и снимка за секцията „За нас"'} />
        {hasUnsavedAbout && <p className="mb-3 text-xs font-semibold text-amber-800">Промените още не са запазени.</p>}
        <div className="grid gap-4">
          <div>
            <Label>Параграф 1</Label>
            <textarea
              className="textarea-admin min-h-[5rem]"
              rows={4}
              placeholder="Нашият салон е място, където…"
              value={aboutText1}
              onChange={(e) => setAboutText1(e.target.value)}
              maxLength={1200}
            />
            <p className="mt-1 text-[10px] text-[#1A1A1A]/30">{aboutText1.length}/1200</p>
          </div>
          <div>
            <Label>Параграф 2</Label>
            <textarea
              className="textarea-admin min-h-[5rem]"
              rows={4}
              placeholder="Нашият опит и ценности…"
              value={aboutText2}
              onChange={(e) => setAboutText2(e.target.value)}
              maxLength={1200}
            />
            <p className="mt-1 text-[10px] text-[#1A1A1A]/30">{aboutText2.length}/1200</p>
          </div>
          <ImageUpload
            label={'Снимка за „За нас"'}
            value={aboutImageUrl}
            onChange={setAboutImageUrl}
            aspect="wide"
            hint="Снимка на екипа или интериора на салона."
          />
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className={sectionSaveClass(!!savingSection)}
            style={{ background: savingSection === "about" ? "rgba(201,168,76,0.5)" : `linear-gradient(135deg, ${GOLD}, ${ROSE})` }}
            onClick={() => void saveAbout()}
            disabled={savingSection != null}
          >
            {savingSection === "about" ? "Запазване…" : '✓ Запази „За нас"'}
          </button>
        </div>
      </FieldCard>

      {/* ── Контакти ── */}
      <FieldCard>
        <SectionHeader icon="📍" title="Контакти" desc="Адрес, телефон и имейл за контакт" />
        {hasUnsavedContacts && <p className="mb-3 text-xs font-semibold text-amber-800">Промените още не са запазени.</p>}
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
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className={sectionSaveClass(!!savingSection)}
            style={{ background: savingSection === "contacts" ? "rgba(201,168,76,0.5)" : `linear-gradient(135deg, ${GOLD}, ${ROSE})` }}
            onClick={() => void saveContacts()}
            disabled={savingSection != null}
          >
            {savingSection === "contacts" ? "Запазване…" : "✓ Запази контактите"}
          </button>
        </div>
      </FieldCard>

      {/* ── Социални мрежи ── */}
      <FieldCard>
        <SectionHeader icon="📱" title="Социални мрежи" desc="Instagram, Facebook и TikTok линкове" />
        {hasUnsavedSocial && <p className="mb-3 text-xs font-semibold text-amber-800">Промените още не са запазени.</p>}
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
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className={sectionSaveClass(!!savingSection)}
            style={{ background: savingSection === "social" ? "rgba(201,168,76,0.5)" : `linear-gradient(135deg, ${GOLD}, ${ROSE})` }}
            onClick={() => void saveSocial()}
            disabled={savingSection != null}
          >
            {savingSection === "social" ? "Запазване…" : "✓ Запази социалните мрежи"}
          </button>
        </div>
      </FieldCard>

      {/* ── Google Maps ── */}
      <FieldCard>
        <SectionHeader icon="🗺️" title="Google Maps embed" desc="Поставете само embed URL (не iframe код)" />
        {hasUnsavedMaps && <p className="mb-3 text-xs font-semibold text-amber-800">Промените още не са запазени.</p>}
        <div className="mb-5 rounded-xl border px-4 py-3" style={{ borderColor: "rgba(201,168,76,0.25)", backgroundColor: "rgba(201,168,76,0.06)" }}>
          <p className="mb-2 text-xs font-semibold text-[#1A1A1A]/85">Точна локация (latitude / longitude)</p>
          <p className="mb-3 text-xs text-[#1A1A1A]/40">
            Отвори мястото в Google Maps → кликни върху пина → координатите са в линка или под адреса. Попълни{" "}
            <strong>и двете</strong>, или изчисти двете за да се ползва само адресът от контактите.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Latitude</Label>
              <input
                type="text"
                inputMode="decimal"
                className="input-admin mt-2"
                value={mapsPinLat}
                onChange={(e) => setMapsPinLat(e.target.value)}
                placeholder="42.4924703"
                autoComplete="off"
              />
            </div>
            <div>
              <Label>Longitude</Label>
              <input
                type="text"
                inputMode="decimal"
                className="input-admin mt-2"
                value={mapsPinLng}
                onChange={(e) => setMapsPinLng(e.target.value)}
                placeholder="27.4625005"
                autoComplete="off"
              />
            </div>
          </div>
        </div>
        <p className="mb-3 text-xs text-[#1A1A1A]/40">
          Google Maps → Сподели → Embed → копирай само <code className="text-[10px]">src</code> URL, напр.{" "}
          <code className="text-[10px]">https://www.google.com/maps/embed?pb=…</code>
        </p>
        <textarea
          className="textarea-admin-mono min-h-[7rem]"
          rows={5}
          value={mapsEmbed}
          onChange={(e) => setMapsEmbed(e.target.value)}
          onBlur={(e) => {
            // Автоматично извлича src URL ако е поставен пълен iframe код
            const parsed = parseMapsEmbedUrl(e.target.value);
            if (parsed !== e.target.value) setMapsEmbed(parsed);
          }}
          placeholder="https://www.google.com/maps/embed?pb=..."
        />
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className={sectionSaveClass(!!savingSection)}
            style={{ background: savingSection === "maps" ? "rgba(201,168,76,0.5)" : `linear-gradient(135deg, ${GOLD}, ${ROSE})` }}
            onClick={() => void saveMapsSection()}
            disabled={savingSection != null}
          >
            {savingSection === "maps" ? "Запазване…" : "✓ Запази картата"}
          </button>
        </div>
      </FieldCard>

      <p className="text-center text-xs text-[#1A1A1A]/40">По избор: един бутон за лого, контакти, социални мрежи и карта наведнъж.</p>
      <div className="flex justify-center">
        <button
          type="button"
          className="w-full max-w-md rounded-xl py-4 text-sm font-black text-white shadow-md transition hover:opacity-90 disabled:opacity-50"
          style={{ background: savingSection === "all" ? "rgba(201,168,76,0.5)" : `linear-gradient(135deg, ${GOLD}, ${ROSE})` }}
          onClick={save}
          disabled={savingSection != null}
        >
          {savingSection === "all" ? "Запазване…" : "✓ Запази всичко наведнъж"}
        </button>
      </div>
    </div>
  );
}
