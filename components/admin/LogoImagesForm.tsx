"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import type { Tenant } from "@/types";

const GOLD = "#C9A84C";
const ROSE = "#C8826A";

/* ─────────────────────────── shared UI helpers ─────────────────────────── */

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
      const json = (await res.json()) as { url?: string; error?: string };
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
      <label
        className="text-[10px] font-black uppercase tracking-[0.15em]"
        style={{ color: "rgba(26,26,26,0.4)" }}
      >
        {label}
      </label>
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
            <img
              src={value}
              alt=""
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
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
    <div
      className="mb-4 flex items-center gap-3 border-b pb-4"
      style={{ borderColor: "rgba(201,168,76,0.12)" }}
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg"
        style={{
          background:
            "linear-gradient(135deg, rgba(201,168,76,0.15), rgba(200,130,106,0.15))",
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
        boxShadow:
          "0 1px 2px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.05)",
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

/* ─────────────────────────────── main form ─────────────────────────────── */

export function LogoImagesForm(props: { tenant: Tenant }) {
  const { tenant } = props;

  /* logo */
  const [logo, setLogo] = useState(tenant.logo_url ?? "");

  /* hero image only — no title/subtitle */
  const [heroImageUrl, setHeroImageUrl] = useState(tenant.hero_image_url ?? "");

  /* specialist/about image */
  const [aboutImageUrl, setAboutImageUrl] = useState(tenant.about_image_url ?? "");

  const [savingSection, setSavingSection] = useState<
    "logo" | "hero-img" | "specialist-img" | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  /* unsaved tracking */
  const initialRef = useRef<{
    logo: string;
    heroImg: string;
    specialistImg: string;
  } | null>(null);

  useEffect(() => {
    if (initialRef.current) return;
    initialRef.current = {
      logo: (tenant.logo_url ?? "").trim(),
      heroImg: (tenant.hero_image_url ?? "").trim(),
      specialistImg: (tenant.about_image_url ?? "").trim(),
    };
  }, [tenant]);

  const hasUnsavedLogo =
    initialRef.current != null && logo.trim() !== initialRef.current.logo;
  const hasUnsavedHeroImg =
    initialRef.current != null &&
    heroImageUrl.trim() !== initialRef.current.heroImg;
  const hasUnsavedSpecialistImg =
    initialRef.current != null &&
    aboutImageUrl.trim() !== initialRef.current.specialistImg;
  const hasUnsaved = hasUnsavedLogo || hasUnsavedHeroImg || hasUnsavedSpecialistImg;

  useEffect(() => {
    if (!hasUnsaved) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsaved]);

  /* ── API helpers ── */
  async function postSettings(body: Record<string, unknown>) {
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) throw new Error(json.error ?? "Неуспешно записване.");
  }

  /* ── Save functions ── */
  async function saveLogo() {
    setSavingSection("logo");
    setError(null);
    setOk(null);
    try {
      const t = logo.trim();
      await postSettings({ logo_url: t === "" ? "" : t });
      if (initialRef.current)
        initialRef.current = { ...initialRef.current, logo: t };
      setOk("✓ Логото е запазено.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка при запис.");
    } finally {
      setSavingSection(null);
    }
  }

  async function saveHeroImage() {
    setSavingSection("hero-img");
    setError(null);
    setOk(null);
    try {
      await postSettings({ hero_image_url: heroImageUrl.trim() || undefined });
      if (initialRef.current)
        initialRef.current = {
          ...initialRef.current,
          heroImg: heroImageUrl.trim(),
        };
      setOk("✓ Главната снимка е запазена.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка при запис.");
    } finally {
      setSavingSection(null);
    }
  }

  async function saveSpecialistImage() {
    setSavingSection("specialist-img");
    setError(null);
    setOk(null);
    try {
      await postSettings({ about_image_url: aboutImageUrl.trim() || undefined });
      if (initialRef.current)
        initialRef.current = {
          ...initialRef.current,
          specialistImg: aboutImageUrl.trim(),
        };
      setOk("✓ Снимката на специалиста е запазена.");
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

      {/* ── Лого ── */}
      <FieldCard>
        <div id="salon-logo">
          <SectionHeader
            icon="🏷️"
            title="Лого на салона"
            desc="Показва се в шапката на публичния сайт"
          />
          {hasUnsavedLogo && (
            <p className="mb-3 text-xs font-semibold text-amber-800">
              Промените още не са запазени.
            </p>
          )}
          <ImageUpload
            label="Качи лого (PNG, JPG, WebP)"
            value={logo}
            onChange={setLogo}
            aspect="wide"
            hint='По възможност хоризонтално лого. „Премахни" маха логото от сайта.'
          />
          <SaveBtn
            saving={savingSection === "logo"}
            disabled={anySaving}
            label="✓ Запази логото"
            onClick={() => void saveLogo()}
          />
        </div>
      </FieldCard>

      {/* ── Главна снимка (Hero) ── */}
      <FieldCard>
        <SectionHeader
          icon="🏠"
          title="Главна снимка"
          desc="Голямата снимка на началната секция на сайта"
        />
        {hasUnsavedHeroImg && (
          <p className="mb-3 text-xs font-semibold text-amber-800">
            Промените още не са запазени.
          </p>
        )}
        <ImageUpload
          label="Банер / главна снимка"
          value={heroImageUrl}
          onChange={setHeroImageUrl}
          aspect="wide"
          hint="Снимка с висока разделителна способност, 16:9 или по-широка."
        />
        <SaveBtn
          saving={savingSection === "hero-img"}
          disabled={anySaving}
          label="✓ Запази главната снимка"
          onClick={() => void saveHeroImage()}
        />
      </FieldCard>

      {/* ── Снимка на специалиста ── */}
      <FieldCard>
        <SectionHeader
          icon="👤"
          title="Снимка на специалиста"
          desc="Голямата портретна снимка — показва се в секцията за специалиста на сайта"
        />
        {hasUnsavedSpecialistImg && (
          <p className="mb-3 text-xs font-semibold text-amber-800">
            Промените още не са запазени.
          </p>
        )}
        <ImageUpload
          label="Портретна снимка на специалиста"
          value={aboutImageUrl}
          onChange={setAboutImageUrl}
          aspect="wide"
          hint="Вертикална или квадратна снимка с добро осветление."
        />
        <SaveBtn
          saving={savingSection === "specialist-img"}
          disabled={anySaving}
          label="✓ Запази снимката"
          onClick={() => void saveSpecialistImage()}
        />
      </FieldCard>

    </div>
  );
}
