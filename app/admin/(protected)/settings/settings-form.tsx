"use client";

import { useEffect, useRef, useMemo, useState } from "react";

import type { Specialist, Tenant } from "@/types";

type OwnerProfileDraft = {
  id: string | null;
  name: string;
  role: string;
  bio: string;
  avatar_url: string;
};

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

function sectionSaveClass(disabled: boolean) {
  return `w-full rounded-xl py-3 text-xs font-black text-white shadow-sm transition sm:w-auto sm:min-w-[12rem] disabled:opacity-50 ${
    disabled ? "" : "hover:opacity-90"
  }`;
}

function readMapsPinStringsFromTenant(tenant: Tenant): { lat: string; lng: string } {
  const dt = tenant.design_tokens;
  if (!dt || typeof dt !== "object" || Array.isArray(dt)) return { lat: "", lng: "" };
  const tok = dt as Record<string, unknown>;
  const mp = tok.maps_pin;
  if (!mp || typeof mp !== "object" || Array.isArray(mp)) return { lat: "", lng: "" };
  const o = mp as Record<string, unknown>;
  const la = o.lat;
  const ln = o.lng;
  const latStr =
    typeof la === "number" && Number.isFinite(la) ? String(la) : typeof la === "string" ? la.trim() : "";
  const lngStr =
    typeof ln === "number" && Number.isFinite(ln) ? String(ln) : typeof ln === "string" ? ln.trim() : "";
  return { lat: latStr, lng: lngStr };
}

export function SettingsForm(props: { tenant: Tenant; specialists: Specialist[] }) {
  const { tenant } = props;
  const sectionInitialRef = useRef<{ logo: string; hero: string; about: string; contacts: string; social: string; maps: string } | null>(null);

  const [logo, setLogo] = useState(tenant.logo_url ?? "");
  const [heroImage, setHeroImage] = useState(tenant.hero_image_url ?? "");
  const [aboutImage, setAboutImage] = useState(tenant.about_image_url ?? "");
  const [address, setAddress] = useState(tenant.address ?? "");
  const [phone, setPhone] = useState(tenant.phone ?? "");
  const [email, setEmail] = useState(tenant.email ?? "");
  const [instagram, setInstagram] = useState(tenant.instagram_url ?? "");
  const [facebook, setFacebook] = useState(tenant.facebook_url ?? "");
  const [tiktok, setTiktok] = useState(tenant.tiktok_url ?? "");
  const [mapsEmbed, setMapsEmbed] = useState(tenant.google_maps_embed ?? "");
  const initialMapsPins = readMapsPinStringsFromTenant(tenant);
  const [mapsPinLat, setMapsPinLat] = useState(initialMapsPins.lat);
  const [mapsPinLng, setMapsPinLng] = useState(initialMapsPins.lng);

  const [savingSection, setSavingSection] = useState<"logo" | "hero" | "about" | "contacts" | "social" | "maps" | "all" | null>(null);
  const [savingOwnerProfile, setSavingOwnerProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const initialOwnerProfile = useMemo(() => {
    const seeded = props.specialists.find((s) => !s.is_technical_admin) ?? props.specialists[0] ?? null;
    return {
      id: seeded?.id ?? null,
      name: seeded?.name ?? tenant.salon_name ?? "Собственик",
      role: seeded?.role ?? "Собственик",
      bio: seeded?.bio ?? "",
      avatar_url: seeded?.avatar_url ?? "",
    } satisfies OwnerProfileDraft;
  }, [props.specialists, tenant.salon_name]);
  const [ownerProfile, setOwnerProfile] = useState<OwnerProfileDraft>(initialOwnerProfile);

  const stringOrNull = (v: string) => {
    const t = v.trim();
    return t === "" ? null : t;
  };

  const snapLogo = () => JSON.stringify([logo.trim()]);
  const snapHero = () => JSON.stringify([heroImage.trim()]);
  const snapAbout = () => JSON.stringify([aboutImage.trim()]);
  const snapContacts = () => JSON.stringify([address.trim(), phone.trim(), email.trim()]);
  const snapSocial = () => JSON.stringify([instagram.trim(), facebook.trim(), tiktok.trim()]);
  const snapMaps = () => JSON.stringify([mapsEmbed.trim(), mapsPinLat.trim(), mapsPinLng.trim()]);

  useEffect(() => {
    if (sectionInitialRef.current) return;
    sectionInitialRef.current = {
      logo: JSON.stringify([(tenant.logo_url ?? "").trim()]),
      hero: JSON.stringify([(tenant.hero_image_url ?? "").trim()]),
      about: JSON.stringify([(tenant.about_image_url ?? "").trim()]),
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
        readMapsPinStringsFromTenant(tenant).lat,
        readMapsPinStringsFromTenant(tenant).lng,
      ]),
    };
  }, [tenant]);

  const hasUnsavedLogo = sectionInitialRef.current != null && snapLogo() !== sectionInitialRef.current.logo;
  const hasUnsavedHero = sectionInitialRef.current != null && snapHero() !== sectionInitialRef.current.hero;
  const hasUnsavedAbout = sectionInitialRef.current != null && snapAbout() !== sectionInitialRef.current.about;
  const hasUnsavedContacts = sectionInitialRef.current != null && snapContacts() !== sectionInitialRef.current.contacts;
  const hasUnsavedSocial = sectionInitialRef.current != null && snapSocial() !== sectionInitialRef.current.social;
  const hasUnsavedMaps = sectionInitialRef.current != null && snapMaps() !== sectionInitialRef.current.maps;
  const hasUnsavedChanges = hasUnsavedLogo || hasUnsavedHero || hasUnsavedAbout || hasUnsavedContacts || hasUnsavedSocial || hasUnsavedMaps;

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
      address: address || undefined,
      phone: phone || undefined,
      email: email || undefined,
      instagram_url: stringOrNull(instagram),
      facebook_url: stringOrNull(facebook),
      tiktok_url: stringOrNull(tiktok),
      google_maps_embed: stringOrNull(mapsEmbed),
      maps_pin_lat: mapsPinLat.trim() === "" ? "" : mapsPinLat.trim(),
      maps_pin_lng: mapsPinLng.trim() === "" ? "" : mapsPinLng.trim(),
    }),
    [address, email, facebook, instagram, logo, mapsEmbed, mapsPinLat, mapsPinLng, phone, tiktok]
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

  async function saveHeroImage() {
    setSavingSection("hero"); setError(null); setOk(null);
    try {
      await postSettingsPartial({ hero_image_url: heroImage.trim() || null });
      if (sectionInitialRef.current) sectionInitialRef.current = { ...sectionInitialRef.current, hero: snapHero() };
      setOk("✓ Hero снимката е запазена.");
    } catch (e) { setError(e instanceof Error ? e.message : "Грешка при запис."); }
    finally { setSavingSection(null); }
  }

  async function saveAboutImage() {
    setSavingSection("about"); setError(null); setOk(null);
    try {
      await postSettingsPartial({ about_image_url: aboutImage.trim() || null });
      if (sectionInitialRef.current) sectionInitialRef.current = { ...sectionInitialRef.current, about: snapAbout() };
      setOk("✓ Снимката 'За мен' е запазена.");
    } catch (e) { setError(e instanceof Error ? e.message : "Грешка при запис."); }
    finally { setSavingSection(null); }
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
      await postSettingsPartial({
        google_maps_embed: stringOrNull(mapsEmbed),
        maps_pin_lat: mapsPinLat.trim() === "" ? "" : mapsPinLat.trim(),
        maps_pin_lng: mapsPinLng.trim() === "" ? "" : mapsPinLng.trim(),
      });
      if (sectionInitialRef.current) {
        sectionInitialRef.current = { ...sectionInitialRef.current, maps: snapMaps() };
      }
      setOk("✓ Картата и координатите са запазени.");
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

  async function saveOwnerProfile() {
    setSavingOwnerProfile(true);
    setError(null);
    setOk(null);
    try {
      let specialistId = ownerProfile.id;

      if (!specialistId) {
        const createRes = await fetch("/api/admin/specialists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: ownerProfile.name.trim() || "Собственик" }),
        });
        const createJson = (await createRes.json()) as { error?: string; specialist?: { id?: string } };
        if (!createRes.ok || !createJson?.specialist?.id) {
          throw new Error(createJson?.error ?? "Неуспешно създаване на профил.");
        }
        specialistId = createJson.specialist.id;
      }

      const res = await fetch(`/api/admin/specialists/${specialistId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: ownerProfile.name.trim() || "Собственик",
          role: ownerProfile.role.trim() || null,
          bio: ownerProfile.bio.trim() || null,
          avatar_url: ownerProfile.avatar_url.trim() || null,
          is_active: true,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Неуспешно записване.");
      await postSettingsPartial({
        about_image_url: ownerProfile.avatar_url.trim() || null,
      });
      setAboutImage(ownerProfile.avatar_url.trim());
      setOwnerProfile((curr) => ({ ...curr, id: specialistId }));
      setOk("✓ Профилът „За мен“ е запазен.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка при запис.");
    } finally {
      setSavingOwnerProfile(false);
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

      {/* ── За мен (най-отгоре) ── */}
      <FieldCard>
        <div id="owner-profile">
          <SectionHeader icon="👤" title="За мен" desc="Един основен профил на собственика: име, текст и снимка." />
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Име</Label>
              <input
                className="input-admin"
                value={ownerProfile.name}
                onChange={(e) => setOwnerProfile((curr) => ({ ...curr, name: e.target.value }))}
              />
            </div>
            <div>
              <Label>Роля / заглавие</Label>
              <input
                className="input-admin"
                placeholder="Собственик, стилист, козметик…"
                value={ownerProfile.role}
                onChange={(e) => setOwnerProfile((curr) => ({ ...curr, role: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2">
              <ImageUpload
                label="Профилна снимка"
                value={ownerProfile.avatar_url}
                onChange={(url) => setOwnerProfile((curr) => ({ ...curr, avatar_url: url }))}
                aspect="square"
                hint="Качи снимката, която ще се показва в публичната секция „За мен“."
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Текст за секция „За мен“</Label>
              <textarea
                className="textarea-admin min-h-[5rem]"
                rows={4}
                value={ownerProfile.bio}
                onChange={(e) => setOwnerProfile((curr) => ({ ...curr, bio: e.target.value }))}
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              className="w-full rounded-xl py-2.5 text-xs font-black text-white transition hover:opacity-90 disabled:opacity-50 sm:w-auto sm:min-w-[12rem]"
              style={{ background: `linear-gradient(135deg, ${GOLD}, ${ROSE})` }}
              onClick={() => void saveOwnerProfile()}
              disabled={savingOwnerProfile || savingSection != null}
            >
              {savingOwnerProfile ? "Запазване…" : "✓ Запази секция „За мен“"}
            </button>
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

      {/* ── Hero снимка ── */}
      <FieldCard>
        <div id="hero-image">
          <SectionHeader icon="🖼️" title="Hero снимка" desc="Главната снимка в горната секция на публичния сайт" />
          {hasUnsavedHero && <p className="mb-3 text-xs font-semibold text-amber-800">Промените още не са запазени.</p>}
          <ImageUpload
            label="Качи hero снимка (JPG, PNG, WebP)"
            value={heroImage}
            onChange={setHeroImage}
            aspect="wide"
            hint="Хоризонтална снимка — показва се като фон или главна снимка в hero секцията."
          />
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              className={sectionSaveClass(!!savingSection)}
              style={{ background: savingSection === "hero" ? "rgba(201,168,76,0.5)" : `linear-gradient(135deg, ${GOLD}, ${ROSE})` }}
              onClick={() => void saveHeroImage()}
              disabled={savingSection != null}
            >
              {savingSection === "hero" ? "Запазване…" : "✓ Запази hero снимката"}
            </button>
          </div>
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
        <SectionHeader
          icon="🗺️"
          title="Карта на сайта"
          desc="Embed от Google и по избор точни координати за пин (The Skin и др.)"
        />
        {hasUnsavedMaps && <p className="mb-3 text-xs font-semibold text-amber-800">Промените още не са запазени.</p>}
        <p className="mb-3 text-xs text-[#1A1A1A]/40">
          Google Maps → Сподели → Embed → копирай само <code className="text-[10px]">src</code> URL, напр.{" "}
          <code className="text-[10px]">https://www.google.com/maps/embed?pb=…</code>
        </p>
        <textarea className="textarea-admin-mono min-h-[7rem]" rows={5} value={mapsEmbed} onChange={(e) => setMapsEmbed(e.target.value)} placeholder="https://www.google.com/maps/embed?pb=..." />
        <div className="mt-5 border-t pt-5" style={{ borderColor: "rgba(201,168,76,0.12)" }}>
          <p className="mb-2 text-xs font-semibold text-[#1A1A1A]/70">Точна локация (latitude / longitude)</p>
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
          {savingSection === "all" ? "Запазване…" : "✓ Запази наведнъж (лого + контакти + мрежи + карта)"}
        </button>
      </div>
    </div>
  );
}
