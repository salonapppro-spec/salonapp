"use client";

import { useMemo, useState } from "react";

import type { Specialist, Tenant } from "@/types";

type SpecialistDraft = Pick<Specialist, "id" | "name" | "role" | "bio" | "avatar_url" | "is_active">;

export function SettingsForm(props: { tenant: Tenant; specialists: Specialist[] }) {
  const { tenant } = props;

  const [salonName, setSalonName] = useState(tenant.salon_name ?? "");
  const [logoUrl, setLogoUrl] = useState(tenant.logo_url ?? "");
  const [heroTitle, setHeroTitle] = useState(tenant.hero_title ?? "");
  const [heroSubtitle, setHeroSubtitle] = useState(tenant.hero_subtitle ?? "");
  const [heroImageUrl, setHeroImageUrl] = useState(tenant.hero_image_url ?? "");
  const [description, setDescription] = useState(tenant.description ?? "");
  const [about1, setAbout1] = useState(tenant.about_text1 ?? "");
  const [about2, setAbout2] = useState(tenant.about_text2 ?? "");
  const [aboutImageUrl, setAboutImageUrl] = useState(tenant.about_image_url ?? "");

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

  const payload = useMemo(
    () => ({
      salon_name: salonName.trim() || undefined,
      logo_url: logoUrl.trim() === "" ? "" : logoUrl.trim(),
      hero_title: heroTitle || undefined,
      hero_subtitle: heroSubtitle || undefined,
      hero_image_url: heroImageUrl || undefined,
      description: description || undefined,
      about_text1: about1 || undefined,
      about_text2: about2 || undefined,
      about_image_url: aboutImageUrl || undefined,
      address: address || undefined,
      phone: phone || undefined,
      email: email || undefined,
      instagram_url: instagram || undefined,
      facebook_url: facebook || undefined,
      tiktok_url: tiktok || undefined,
      google_maps_embed: mapsEmbed || undefined,
    }),
    [about1, about2, aboutImageUrl, address, description, email, facebook, heroImageUrl, heroSubtitle, heroTitle, instagram, logoUrl, mapsEmbed, phone, salonName, tiktok]
  );

  async function save() {
    setSaving(true);
    setError(null);
    setOk(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Неуспешно записване.");
      setOk("Запазено.");
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
    setSavingSpecialists(id);
    setError(null);
    setOk(null);
    try {
      const res = await fetch(`/api/admin/specialists/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: s.name.trim(),
          role: s.role || null,
          bio: s.bio || null,
          avatar_url: s.avatar_url || null,
          is_active: s.is_active,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Неуспешно записване на специалист.");
      setOk("Промените по специалиста са запазени.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка при запис.");
    } finally {
      setSavingSpecialists(null);
    }
  }

  async function addSpecialist() {
    setAddingSpecialist(true);
    setError(null);
    setOk(null);
    try {
      const res = await fetch("/api/admin/specialists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Нов специалист" }),
      });
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
          },
        ]);
      }
      setOk("Добавен е нов специалист.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка при запис.");
    } finally {
      setAddingSpecialist(false);
    }
  }

  return (
    <div className="admin-card">
      {error ? <div className="mb-4 rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-900">{error}</div> : null}
      {ok ? <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-900">{ok}</div> : null}

      <div className="grid gap-8">
        <section>
          <h2 className="text-lg font-semibold tracking-tight text-brand-900">Профил на салона</h2>
          <div className="mt-3">
            <label className="text-sm font-medium text-brand-900">Име на салона</label>
            <input className="input-admin" value={salonName} onChange={(e) => setSalonName(e.target.value)} />
          </div>
          <div className="mt-4">
            <label className="text-sm font-medium text-brand-900">Лого за сайта (URL)</label>
            <input
              className="input-admin"
              type="url"
              inputMode="url"
              placeholder="https://… (показва се до името в горната лента)"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
            />
            <p className="mt-1 text-xs leading-relaxed text-brand-700/85">
              Квадратна или хоризонтална снимка (HTTPS). Празно поле маха логото. Можеш да качиш файл в галерията и да копираш публичния линк.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold tracking-tight text-brand-900">Hero</h2>
          <div className="mt-3 grid gap-4">
            <div>
              <label className="text-sm font-medium text-brand-900">Заглавие</label>
              <input className="input-admin" value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-brand-900">Подзаглавие</label>
              <input className="input-admin" value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-brand-900">Hero снимка URL</label>
              <input className="input-admin" type="url" inputMode="url" value={heroImageUrl} onChange={(e) => setHeroImageUrl(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-brand-900">Кратко описание</label>
              <textarea className="textarea-admin min-h-[5rem]" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold tracking-tight text-brand-900">За нас</h2>
          <div className="mt-3 grid gap-4">
            <div>
              <label className="text-sm font-medium text-brand-900">Текст 1</label>
              <textarea className="textarea-admin min-h-[7rem]" rows={4} value={about1} onChange={(e) => setAbout1(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-brand-900">Текст 2</label>
              <textarea className="textarea-admin min-h-[7rem]" rows={4} value={about2} onChange={(e) => setAbout2(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-brand-900">Снимка за „За нас“ URL</label>
              <input className="input-admin" type="url" inputMode="url" value={aboutImageUrl} onChange={(e) => setAboutImageUrl(e.target.value)} />
            </div>
          </div>
        </section>

        <section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight text-brand-900">Специалисти (снимка + текст)</h2>
            <button type="button" className="btn-admin-ghost" onClick={addSpecialist} disabled={addingSpecialist}>
              {addingSpecialist ? "Добавяне…" : "Добави специалист"}
            </button>
          </div>
          <div className="mt-3 space-y-4">
            {specialists.length === 0 ? (
              <div className="rounded-xl border border-dashed border-brand-300/70 px-4 py-4 text-sm text-brand-800/80">
                Няма добавени специалисти.
              </div>
            ) : (
              specialists.map((s) => (
                <div key={s.id} className="rounded-2xl border border-brand-200/80 bg-brand-50/35 p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-medium text-brand-900">Име</label>
                      <input className="input-admin" value={s.name} onChange={(e) => patchSpecialistLocal(s.id, { name: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-brand-900">Роля</label>
                      <input className="input-admin" value={s.role ?? ""} onChange={(e) => patchSpecialistLocal(s.id, { role: e.target.value })} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-brand-900">Снимка URL</label>
                      <input className="input-admin" type="url" inputMode="url" value={s.avatar_url ?? ""} onChange={(e) => patchSpecialistLocal(s.id, { avatar_url: e.target.value })} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-brand-900">Описание</label>
                      <textarea className="textarea-admin min-h-[5rem]" rows={3} value={s.bio ?? ""} onChange={(e) => patchSpecialistLocal(s.id, { bio: e.target.value })} />
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <label className="inline-flex items-center gap-2 text-sm text-brand-900">
                      <input type="checkbox" checked={s.is_active} onChange={(e) => patchSpecialistLocal(s.id, { is_active: e.target.checked })} />
                      Активен
                    </label>
                    <button type="button" className="btn-admin-primary" onClick={() => void saveSpecialist(s.id)} disabled={savingSpecialists === s.id}>
                      {savingSpecialists === s.id ? "Запазване…" : "Запази специалист"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold tracking-tight text-brand-900">Контакти</h2>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-brand-900">Адрес</label>
              <input className="input-admin" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-brand-900">Телефон</label>
              <input className="input-admin" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-brand-900">Имейл</label>
              <input className="input-admin" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold tracking-tight text-brand-900">Социални мрежи</h2>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-brand-900">Instagram URL</label>
              <input className="input-admin" type="url" inputMode="url" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-brand-900">Facebook URL</label>
              <input className="input-admin" type="url" inputMode="url" value={facebook} onChange={(e) => setFacebook(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-brand-900">TikTok URL</label>
              <input className="input-admin" type="url" inputMode="url" value={tiktok} onChange={(e) => setTiktok(e.target.value)} />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold tracking-tight text-brand-900">Google Maps embed</h2>
          <p className="mt-1 text-xs leading-relaxed text-brand-800/85">
            Постави embed iframe кода от Google Maps. Ако е празно, картата няма да се показва.
          </p>
          <textarea className="textarea-admin-mono mt-3 min-h-[8rem]" rows={6} value={mapsEmbed} onChange={(e) => setMapsEmbed(e.target.value)} />
        </section>

        <button type="button" className="btn-admin-primary w-full sm:w-auto sm:min-w-[12rem]" onClick={save} disabled={saving}>
          {saving ? "Запазване…" : "Запази"}
        </button>
      </div>
    </div>
  );
}

