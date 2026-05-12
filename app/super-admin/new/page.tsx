"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type Availability = "idle" | "checking" | "ok" | "taken" | "invalid";

function slugify(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function isSystemLeadEmail(value: string): boolean {
  return value.toLowerCase().endsWith("@no-email.salonapp.pro");
}

type CreatedPayload = {
  slug: string;
  ownerEmail?: string | null;
  setPasswordLink?: string | null;
  emailDispatched?: boolean;
  resendConfigured?: boolean;
  hint?: string;
  authError?: string;
};

export default function NewTenantPage() {
  const searchParams = useSearchParams();
  const [salonName, setSalonName] = useState("");
  const [slug, setSlug] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [plan, setPlan] = useState("starter");
  const [template, setTemplate] = useState("bloom");
  const [availability, setAvailability] = useState<Availability>("idle");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedPayload | null>(null);
  const [copied, setCopied] = useState(false);

  const slugValid = useMemo(() => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug), [slug]);

  useEffect(() => {
    const qName = (searchParams.get("name") ?? "").trim();
    const qEmail = (searchParams.get("email") ?? "").trim();
    const qPhone = (searchParams.get("phone") ?? "").trim();
    const qPlan = (searchParams.get("plan") ?? "").trim();
    const usableEmail = qEmail && !isSystemLeadEmail(qEmail) ? qEmail : "";

    if (qName) {
      setSalonName((prev) => prev || qName);
      setSlug((prev) => prev || slugify(qName));
    }
    if (usableEmail) setOwnerEmail((prev) => prev || usableEmail);
    if (qPhone) setOwnerPhone((prev) => prev || qPhone);
    if (qPlan && ["starter", "standard", "pro", "premium"].includes(qPlan)) {
      setPlan((prev) => prev || qPlan);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!slug) {
      setAvailability("idle");
      return;
    }
    if (!slugValid) {
      setAvailability("invalid");
      return;
    }
    const ctrl = new AbortController();
    setAvailability("checking");
    const t = setTimeout(async () => {
      const res = await fetch(`/api/super-admin/slug?slug=${encodeURIComponent(slug)}`, { signal: ctrl.signal }).catch(() => null);
      const j = await res?.json().catch(() => null);
      if (!res || !j) return;
      setAvailability(j.available ? "ok" : "taken");
    }, 250);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [slug, slugValid]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!slugValid || availability !== "ok") return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/super-admin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salon_slug: slug,
          salon_name: salonName,
          owner_email: ownerEmail || undefined,
          owner_phone: ownerPhone || undefined,
          plan,
          template,
        }),
      });
      const j = (await res.json()) as CreatedPayload & { error?: string; ok?: boolean };
      if (!res.ok) throw new Error(j?.error ?? "Грешка");
      setCreated({
        slug: j.slug,
        ownerEmail: j.ownerEmail,
        setPasswordLink: j.setPasswordLink,
        emailDispatched: j.emailDispatched,
        resendConfigured: j.resendConfigured,
        hint: j.hint,
        authError: j.authError,
      });
    } catch (er) {
      setError(er instanceof Error ? er.message : "Грешка");
    } finally {
      setLoading(false);
    }
  }

  if (created) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-white">Тенантът е създаден</h1>
          <Link href="/super-admin" className="text-sm text-neutral-300 hover:text-white">
            ← табло
          </Link>
        </div>

        <div className="space-y-4 rounded-2xl border border-neutral-700 bg-neutral-900/80 p-5 text-sm text-neutral-200">
          <p>
            Slug: <span className="font-mono text-amber-100">{created.slug}</span>
          </p>

          {created.authError ? (
            <p className="rounded-lg border border-amber-700/60 bg-amber-950/40 px-3 py-2 text-amber-100">{created.authError}</p>
          ) : null}

          {!created.authError && created.ownerEmail ? (
            <>
              <p>
                Собственикът влиза в админ панела на <span className="font-semibold text-white">същия домейн</span> като приложението, път{" "}
                <code className="rounded bg-neutral-950 px-1.5 py-0.5 text-xs text-amber-100">/admin/login</code>, с имейл{" "}
                <strong className="text-white">{created.ownerEmail}</strong>.
              </p>
              <p className="text-neutral-400">
                Паролата се <strong className="text-neutral-200">не знае</strong> нито от теб, нито от тях в началото — генерира се случайно в системата. Трябва да я зададат през{" "}
                <strong className="text-neutral-200">еднократния линк</strong> (имейл или копие по-долу).
              </p>
              {created.setPasswordLink ? (
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-neutral-400">Линк за задаване на парола (еднократен)</label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input readOnly value={created.setPasswordLink} className="min-w-0 flex-1 rounded-lg border border-neutral-600 bg-neutral-950 px-3 py-2 font-mono text-xs text-neutral-200" />
                    <button
                      type="button"
                      className="shrink-0 rounded-lg bg-amber-500/90 px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-amber-400"
                      onClick={() => {
                        void navigator.clipboard.writeText(created.setPasswordLink!);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                    >
                      {copied ? "Копирано" : "Копирай"}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-amber-100/90">
                  Линкът не беше генериран. В Supabase → Authentication → URL configuration добави redirect към{" "}
                  <code className="rounded bg-neutral-950 px-1">…/admin/login</code> и провери <code className="rounded bg-neutral-950 px-1">NEXT_PUBLIC_APP_URL</code> във Vercel. Алтернатива: задай парола ръчно на потребителя в Authentication → Users.
                </p>
              )}
              {created.resendConfigured ? (
                <p className="text-neutral-400">
                  {created.emailDispatched
                    ? "Покана с линк е изпратена на имейла на собственика (ако Resend прие заявката)."
                    : "Имейлът може да не е изпратен — провери Resend и използвай копирания линк."}
                </p>
              ) : (
                <p className="text-neutral-400">
                  Няма настроен <code className="rounded bg-neutral-950 px-1">RESEND_API_KEY</code> — изпрати линка на собственика ръчно (Viber, имейл и т.н.).
                </p>
              )}
            </>
          ) : null}

          {!created.authError && !created.ownerEmail && created.hint ? <p className="text-neutral-400">{created.hint}</p> : null}

          <div className="flex flex-wrap gap-3 pt-2">
            <Link href={`/super-admin/${created.slug}`} className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-neutral-900">
              Към тенанта
            </Link>
            <button
              type="button"
              className="rounded-lg border border-neutral-600 px-4 py-2 text-sm font-medium text-neutral-200 hover:bg-neutral-800"
              onClick={() => {
                setCreated(null);
                setCopied(false);
              }}
            >
              Създай друг тенант
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Създаване на нов тенант</h1>
        <Link href="/super-admin" className="text-sm text-neutral-300 hover:text-white">
          ← обратно
        </Link>
      </div>

      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-neutral-800 bg-neutral-900/70 p-5">
        <div>
          <label className="text-xs text-neutral-400">Име на салон</label>
          <input
            required
            value={salonName}
            onChange={(e) => {
              const name = e.target.value;
              setSalonName(name);
              if (!slug) setSlug(slugify(name));
            }}
            className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-neutral-400">Slug</label>
          <input required value={slug} onChange={(e) => setSlug(slugify(e.target.value))} className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm" />
          <p className="mt-1 text-xs text-neutral-400">
            {availability === "checking" ? "Проверка..." : availability === "ok" ? "Slug е свободен." : availability === "taken" ? "Slug е зает." : availability === "invalid" ? "Невалиден формат." : "Формат: lower-case и тирета."}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs text-neutral-400">План</label>
            <select value={plan} onChange={(e) => setPlan(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm">
              <option value="starter">standard</option>
              <option value="standard">pro</option>
              <option value="pro">premium</option>
              <option value="premium">collective</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-neutral-400">Шаблон</label>
            <select value={template} onChange={(e) => setTemplate(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm">
              <option value="bloom">bloom</option>
              <option value="luxe">luxe</option>
              <option value="luxe2">luxe2</option>
              <option value="bold">bold</option>
              <option value="zen">zen</option>
              <option value="groom">groom</option>
            </select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs text-neutral-400">Имейл на собственика (за вход в админ)</label>
            <input type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm" />
            <p className="mt-2 text-xs leading-relaxed text-neutral-500">
              С този имейл се създава Supabase акаунт. След създаване ще видиш <strong className="text-neutral-400">еднократен линк за парола</strong> (и ще се изпрати имейл, ако има Resend).
            </p>
          </div>
          <div>
            <label className="text-xs text-neutral-400">Owner phone</label>
            <input value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm" />
          </div>
        </div>
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        <button
          type="submit"
          disabled={loading || availability !== "ok"}
          className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-neutral-900 disabled:opacity-50"
        >
          {loading ? "Създаване..." : "Създай тенант"}
        </button>
      </form>
    </div>
  );
}
