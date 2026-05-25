"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import type { Tenant } from "@/types";

const GOLD = "#C9A84C";
const ROSE = "#C8826A";

/* ─────────────────────────── shared UI helpers ─────────────────────────── */

function SectionHeader({ icon, title, desc }: { icon: string; title: string; desc?: string }) {
  return (
    <div
      className="mb-4 flex items-center gap-3 border-b pb-4"
      style={{ borderColor: "rgba(201,168,76,0.12)" }}
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg"
        style={{
          background: "linear-gradient(135deg, rgba(201,168,76,0.15), rgba(200,130,106,0.15))",
        }}
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
      style={{
        border: "1px solid rgba(201,168,76,0.18)",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.05)",
      }}
    >
      {children}
    </div>
  );
}

function Label({ children }: { children: ReactNode }) {
  return (
    <label
      className="text-[10px] font-black uppercase tracking-[0.15em]"
      style={{ color: "rgba(26,26,26,0.4)" }}
    >
      {children}
    </label>
  );
}

function SaveBtn({
  saving,
  label,
  onClick,
  disabled,
}: {
  saving: boolean;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="mt-4 flex justify-end">
      <button
        type="button"
        onClick={onClick}
        disabled={saving || disabled}
        className="w-full rounded-xl py-3 text-xs font-black text-white shadow-sm transition hover:opacity-90 disabled:opacity-50 sm:w-auto sm:min-w-[12rem]"
        style={{
          background: saving
            ? "rgba(201,168,76,0.5)"
            : `linear-gradient(135deg, ${GOLD}, ${ROSE})`,
        }}
      >
        {saving ? "Запазване…" : label}
      </button>
    </div>
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

/* ─────────────────────────────── main form ─────────────────────────────── */

export function ContactsForm(props: { tenant: Tenant }) {
  const { tenant } = props;

  const [address, setAddress] = useState(tenant.address ?? "");
  const [phone, setPhone] = useState(tenant.phone ?? "");
  const [email, setEmail] = useState(tenant.email ?? "");

  const [instagram, setInstagram] = useState(tenant.instagram_url ?? "");
  const [facebook, setFacebook] = useState(tenant.facebook_url ?? "");
  const [tiktok, setTiktok] = useState(tenant.tiktok_url ?? "");

  const [mapsEmbed, setMapsEmbed] = useState(tenant.google_maps_embed ?? "");
  const [mapsPinLat, setMapsPinLat] = useState(() => {
    const pin = (tenant.design_tokens as Record<string, unknown> | null | undefined)
      ?.maps_pin;
    if (!pin || typeof pin !== "object" || Array.isArray(pin)) return "";
    const lat = (pin as Record<string, unknown>).lat;
    return lat != null ? String(lat) : "";
  });
  const [mapsPinLng, setMapsPinLng] = useState(() => {
    const pin = (tenant.design_tokens as Record<string, unknown> | null | undefined)
      ?.maps_pin;
    if (!pin || typeof pin !== "object" || Array.isArray(pin)) return "";
    const lng = (pin as Record<string, unknown>).lng;
    return lng != null ? String(lng) : "";
  });

  const [savingSection, setSavingSection] = useState<
    "contacts" | "social" | "maps" | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  /* unsaved tracking */
  const initialRef = useRef<{
    contacts: string;
    social: string;
    maps: string;
  } | null>(null);

  const snapContacts = () =>
    JSON.stringify([address.trim(), phone.trim(), email.trim()]);
  const snapSocial = () =>
    JSON.stringify([instagram.trim(), facebook.trim(), tiktok.trim()]);
  const snapMaps = () =>
    JSON.stringify([mapsEmbed.trim(), mapsPinLat.trim(), mapsPinLng.trim()]);

  useEffect(() => {
    if (initialRef.current) return;
    initialRef.current = {
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
  }, [tenant]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasUnsavedContacts =
    initialRef.current != null && snapContacts() !== initialRef.current.contacts;
  const hasUnsavedSocial =
    initialRef.current != null && snapSocial() !== initialRef.current.social;
  const hasUnsavedMaps =
    initialRef.current != null && snapMaps() !== initialRef.current.maps;
  const hasUnsaved = hasUnsavedContacts || hasUnsavedSocial || hasUnsavedMaps;

  useEffect(() => {
    if (!hasUnsaved) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsaved]);

  const stringOrNull = (v: string) => {
    const t = v.trim();
    return t === "" ? null : t;
  };

  async function postSettings(body: Record<string, unknown>) {
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) throw new Error(json.error ?? "Неуспешно записване.");
  }

  async function saveContacts() {
    setSavingSection("contacts");
    setError(null);
    setOk(null);
    try {
      await postSettings({
        address: address || undefined,
        phone: phone || undefined,
        email: email || undefined,
      });
      if (initialRef.current)
        initialRef.current = { ...initialRef.current, contacts: snapContacts() };
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
      await postSettings({
        instagram_url: stringOrNull(instagram),
        facebook_url: stringOrNull(facebook),
        tiktok_url: stringOrNull(tiktok),
      });
      if (initialRef.current)
        initialRef.current = { ...initialRef.current, social: snapSocial() };
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
      await postSettings({
        google_maps_embed: stringOrNull(cleanedEmbed),
        ...(latStr && lngStr
          ? { maps_pin_lat: Number(latStr), maps_pin_lng: Number(lngStr) }
          : latStr === "" && lngStr === ""
            ? { maps_pin_lat: undefined, maps_pin_lng: undefined }
            : {}),
      });
      if (initialRef.current)
        initialRef.current = { ...initialRef.current, maps: snapMaps() };
      setOk("✓ Картата е запазена.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка при запис.");
    } finally {
      setSavingSection(null);
    }
  }

  const anySaving = savingSection != null;

  /* ─────────────── render ─────────────── */
  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {error}
        </div>
      )}
      {ok && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {ok}
        </div>
      )}
      {hasUnsaved && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          Имате незапазени промени — ползвай съответния бутон „Запази".
        </div>
      )}

      {/* ── Контакти ── */}
      <FieldCard>
        <SectionHeader
          icon="📍"
          title="Контакти"
          desc="Адрес, телефон и имейл за контакт"
        />
        {hasUnsavedContacts && (
          <p className="mb-3 text-xs font-semibold text-amber-800">
            Промените още не са запазени.
          </p>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label>Адрес</Label>
            <input
              className="input-admin"
              placeholder="бул. Витоша 42, София"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div>
            <Label>Телефон</Label>
            <input
              className="input-admin"
              placeholder="+359 88 …"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div>
            <Label>Имейл</Label>
            <input
              className="input-admin"
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
        <SaveBtn
          saving={savingSection === "contacts"}
          disabled={anySaving}
          label="✓ Запази контактите"
          onClick={() => void saveContacts()}
        />
      </FieldCard>

      {/* ── Социални мрежи ── */}
      <FieldCard>
        <SectionHeader
          icon="📱"
          title="Социални мрежи"
          desc="Instagram, Facebook и TikTok линкове"
        />
        {hasUnsavedSocial && (
          <p className="mb-3 text-xs font-semibold text-amber-800">
            Промените още не са запазени.
          </p>
        )}
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label>📸 Instagram</Label>
            <input
              className="input-admin"
              type="url"
              inputMode="url"
              placeholder="https://instagram.com/…"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
            />
          </div>
          <div>
            <Label>👍 Facebook</Label>
            <input
              className="input-admin"
              type="url"
              inputMode="url"
              placeholder="https://facebook.com/…"
              value={facebook}
              onChange={(e) => setFacebook(e.target.value)}
            />
          </div>
          <div>
            <Label>🎵 TikTok</Label>
            <input
              className="input-admin"
              type="url"
              inputMode="url"
              placeholder="https://tiktok.com/…"
              value={tiktok}
              onChange={(e) => setTiktok(e.target.value)}
            />
          </div>
        </div>
        <SaveBtn
          saving={savingSection === "social"}
          disabled={anySaving}
          label="✓ Запази социалните мрежи"
          onClick={() => void saveSocial()}
        />
      </FieldCard>

      {/* ── Google Maps ── */}
      <FieldCard>
        <SectionHeader
          icon="🗺️"
          title="Google Maps embed"
          desc="Поставете само embed URL (не iframe код)"
        />
        {hasUnsavedMaps && (
          <p className="mb-3 text-xs font-semibold text-amber-800">
            Промените още не са запазени.
          </p>
        )}

        <div
          className="mb-5 rounded-xl border px-4 py-3"
          style={{
            borderColor: "rgba(201,168,76,0.25)",
            backgroundColor: "rgba(201,168,76,0.06)",
          }}
        >
          <p className="mb-2 text-xs font-semibold text-[#1A1A1A]/85">
            Точна локация (latitude / longitude)
          </p>
          <p className="mb-3 text-xs text-[#1A1A1A]/40">
            Отвори мястото в Google Maps → кликни върху пина → координатите са
            в линка или под адреса. Попълни <strong>и двете</strong>, или
            изчисти двете за да се ползва само адресът от контактите.
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
          Google Maps → Сподели → Embed → копирай само{" "}
          <code className="text-[10px]">src</code> URL, напр.{" "}
          <code className="text-[10px]">https://www.google.com/maps/embed?pb=…</code>
        </p>
        <textarea
          className="textarea-admin-mono min-h-[7rem]"
          rows={5}
          value={mapsEmbed}
          onChange={(e) => setMapsEmbed(e.target.value)}
          onBlur={(e) => {
            const parsed = parseMapsEmbedUrl(e.target.value);
            if (parsed !== e.target.value) setMapsEmbed(parsed);
          }}
          placeholder="https://www.google.com/maps/embed?pb=..."
        />
        <SaveBtn
          saving={savingSection === "maps"}
          disabled={anySaving}
          label="✓ Запази картата"
          onClick={() => void saveMapsSection()}
        />
      </FieldCard>
    </div>
  );
}
