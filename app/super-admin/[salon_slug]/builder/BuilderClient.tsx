"use client";

import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import type { DesignTokens } from "@/types/design-tokens";
import { DEFAULT_DESIGN_TOKENS } from "@/lib/design-tokens";
import { saveDesignTokens, saveBuilderContent } from "@/app/super-admin/actions";
import type { BuilderContent } from "@/app/super-admin/actions";

// ─── Constants ────────────────────────────────────────────────────────────────

const FONT_OPTIONS = [
  { label: "Inter",              value: "Inter, sans-serif" },
  { label: "Playfair Display",   value: "'Playfair Display', serif" },
  { label: "Montserrat",         value: "Montserrat, sans-serif" },
  { label: "Cormorant Garamond", value: "'Cormorant Garamond', serif" },
  { label: "Lato",               value: "Lato, sans-serif" },
  { label: "Raleway",            value: "Raleway, sans-serif" },
];

const BORDER_RADIUS_OPTIONS = [
  { label: "Остри",    value: "0" },
  { label: "Леки",     value: "0.375rem" },
  { label: "Средни",   value: "0.75rem" },
  { label: "Заоблени", value: "1.5rem" },
  { label: "Кръгли",   value: "9999px" },
];

const COLOR_PRESETS = [
  "#C8826A", "#C9A84C", "#9B7EBD", "#4A9E9E",
  "#8B3A52", "#3D3D3D", "#E05C5C", "#4A7E6B",
];

const BG_PRESETS = [
  "#FAF7F2", "#FFFFFF", "#F5ECD7", "#FDF0F0",
  "#F0F7F4", "#1A1A2E", "#F8F4FF", "#F0F4F8",
];

type Viewport = "mobile" | "tablet" | "desktop";
type Tab = "design" | "content";

const VIEWPORT_CONFIG: Record<Viewport, { icon: string; width: string; label: string }> = {
  mobile:  { icon: "📱", width: "375px", label: "Мобилен" },
  tablet:  { icon: "💻", width: "768px", label: "Таблет" },
  desktop: { icon: "🖥️", width: "100%",  label: "Десктоп" },
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  salonSlug: string;
  salonName: string;
  initialTokens: DesignTokens;
  initialContent: BuilderContent;
  previewUrl: string;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function BuilderClient({ salonSlug, salonName, initialTokens, initialContent, previewUrl }: Props) {
  const [tab, setTab] = useState<Tab>("design");
  const [tokens, setTokens] = useState<DesignTokens>(initialTokens);
  const [content, setContent] = useState<BuilderContent>(initialContent);
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [iframeKey, setIframeKey] = useState(0);
  const [designSaved, setDesignSaved] = useState(false);
  const [contentSaved, setContentSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPendingDesign, startDesignTransition] = useTransition();
  const [isPendingContent, startContentTransition] = useTransition();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const pushTokens = useCallback((t: DesignTokens) => {
    iframeRef.current?.contentWindow?.postMessage({ type: "builder-preview", tokens: t }, "*");
  }, []);

  useEffect(() => { pushTokens(tokens); }, [tokens, pushTokens]);

  function updateToken<K extends keyof DesignTokens>(key: K, value: DesignTokens[K]) {
    setTokens((t) => ({ ...t, [key]: value }));
    setDesignSaved(false);
  }

  function updateContent<K extends keyof BuilderContent>(key: K, value: BuilderContent[K]) {
    setContent((c) => ({ ...c, [key]: value }));
    setContentSaved(false);
  }

  function handleSaveDesign() {
    setError(null);
    startDesignTransition(async () => {
      try {
        await saveDesignTokens(salonSlug, tokens);
        setDesignSaved(true);
        setIframeKey((k) => k + 1);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Грешка при запис");
      }
    });
  }

  function handleSaveContent() {
    setError(null);
    startContentTransition(async () => {
      try {
        await saveBuilderContent(salonSlug, content);
        setContentSaved(true);
        setIframeKey((k) => k + 1);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Грешка при запис");
      }
    });
  }

  const vp = VIEWPORT_CONFIG[viewport];

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-0 overflow-hidden rounded-2xl border border-neutral-800">

      {/* ── Left sidebar ── */}
      <div className="flex w-72 shrink-0 flex-col overflow-hidden border-r border-neutral-800 bg-neutral-950">

        {/* Header */}
        <div className="border-b border-neutral-800 px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-neutral-500">Visual Builder</p>
          <h2 className="truncate text-sm font-semibold text-neutral-100">{salonName}</h2>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-800">
          {(["design", "content"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-xs font-semibold transition ${
                tab === t
                  ? "border-b-2 border-white text-white"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              {t === "design" ? "🎨 Дизайн" : "📝 Съдържание"}
            </button>
          ))}
        </div>

        {/* Scrollable controls */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {tab === "design" ? (
            <DesignTab tokens={tokens} update={updateToken} onReset={() => { setTokens(DEFAULT_DESIGN_TOKENS); setDesignSaved(false); }} />
          ) : (
            <ContentTab content={content} update={updateContent} />
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t border-neutral-800 px-4 py-3 space-y-2">
          {error && <p className="text-center text-[11px] text-red-400">{error}</p>}
          {tab === "design" && (
            <>
              {designSaved && <p className="text-center text-xs font-semibold text-emerald-400">✓ Дизайнът е запазен</p>}
              <button
                onClick={handleSaveDesign}
                disabled={isPendingDesign}
                className="w-full rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-neutral-900 hover:bg-neutral-100 disabled:opacity-50 transition"
              >
                {isPendingDesign ? "Запазване…" : "💾 Запази дизайна"}
              </button>
            </>
          )}
          {tab === "content" && (
            <>
              {contentSaved && <p className="text-center text-xs font-semibold text-emerald-400">✓ Съдържанието е запазено</p>}
              <button
                onClick={handleSaveContent}
                disabled={isPendingContent}
                className="w-full rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-neutral-900 hover:bg-neutral-100 disabled:opacity-50 transition"
              >
                {isPendingContent ? "Запазване…" : "💾 Запази съдържанието"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Preview panel ── */}
      <div className="flex flex-1 flex-col bg-neutral-900 min-w-0">

        {/* Toolbar */}
        <div className="flex items-center gap-2 border-b border-neutral-800 bg-neutral-950 px-4 py-2 shrink-0">
          <code className="flex-1 truncate text-xs text-neutral-400">{previewUrl}</code>
          <div className="flex gap-1 shrink-0">
            {(Object.entries(VIEWPORT_CONFIG) as [Viewport, typeof VIEWPORT_CONFIG[Viewport]][]).map(([key, cfg]) => (
              <button
                key={key}
                title={cfg.label}
                onClick={() => setViewport(key)}
                className={`rounded px-2 py-1 text-xs transition ${
                  viewport === key
                    ? "bg-neutral-700 text-white"
                    : "text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300"
                }`}
              >
                {cfg.icon}
              </button>
            ))}
          </div>
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded border border-neutral-700 px-2 py-1 text-xs text-neutral-400 hover:bg-neutral-800 transition"
          >
            Отвори ↗
          </a>
        </div>

        {/* iframe area */}
        <div className="flex flex-1 items-start justify-center overflow-auto bg-neutral-800 p-4">
          <div
            className="overflow-hidden rounded-lg shadow-2xl bg-white transition-all duration-300"
            style={{ width: vp.width, height: "100%", minHeight: "600px" }}
          >
            <iframe
              key={iframeKey}
              ref={iframeRef}
              src={previewUrl}
              className="h-full w-full border-0"
              title={`Preview — ${salonName}`}
              onLoad={() => pushTokens(tokens)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Design Tab ───────────────────────────────────────────────────────────────

function DesignTab({
  tokens, update, onReset,
}: {
  tokens: DesignTokens;
  update: <K extends keyof DesignTokens>(key: K, value: DesignTokens[K]) => void;
  onReset: () => void;
}) {
  return (
    <div className="space-y-6">
      <Section title="Цветове">
        <div className="space-y-3">
          <ColorField label="Основен цвят (бутони)" value={tokens.primaryColor}    presets={COLOR_PRESETS} onChange={(v) => update("primaryColor", v)} />
          <ColorField label="Фон на сайта"          value={tokens.backgroundColor} presets={BG_PRESETS}    onChange={(v) => update("backgroundColor", v)} />
          <ColorField label="Цвят на текста"        value={tokens.textColor}       presets={[]}            onChange={(v) => update("textColor", v)} />
          <ColorField label="Акцент"                value={tokens.accentColor}     presets={COLOR_PRESETS} onChange={(v) => update("accentColor", v)} />
        </div>
      </Section>

      <Section title="Типография">
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-neutral-400">Шрифт</label>
            <select
              value={tokens.fontFamily}
              onChange={(e) => update("fontFamily", e.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100"
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
            <div
              className="mt-2 rounded-lg border border-neutral-800 px-3 py-2 text-sm text-neutral-300"
              style={{ fontFamily: tokens.fontFamily }}
            >
              Красив текст • Beautiful Type
            </div>
          </div>
          <SizeField label="Размер на заглавие" value={tokens.headingSize} onChange={(v) => update("headingSize", v)} />
          <SizeField label="Размер на текст"    value={tokens.bodySize}    onChange={(v) => update("bodySize", v)} />
        </div>
      </Section>

      <Section title="Форма на елементите">
        <div>
          <label className="mb-2 block text-xs text-neutral-400">Заоблени ъгли</label>
          <div className="grid grid-cols-5 gap-1">
            {BORDER_RADIUS_OPTIONS.map((r) => (
              <button
                key={r.value}
                onClick={() => update("borderRadius", r.value)}
                className={`rounded py-2 text-[10px] font-semibold transition ${
                  tokens.borderRadius === r.value
                    ? "bg-white text-neutral-900"
                    : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <div className="h-8 flex-1 bg-neutral-700 transition-all" style={{ borderRadius: tokens.borderRadius }} />
            <div
              className="flex h-8 w-20 items-center justify-center bg-neutral-600 text-[10px] font-semibold text-white transition-all"
              style={{ borderRadius: tokens.borderRadius }}
            >
              Бутон
            </div>
          </div>
        </div>
      </Section>

      <Section title="Разстояния">
        <div className="space-y-3">
          <SizeField label="Padding на бутони"  value={tokens.buttonPadding}  onChange={(v) => update("buttonPadding", v)} />
          <SizeField label="Padding на секции"  value={tokens.sectionPadding} onChange={(v) => update("sectionPadding", v)} />
        </div>
      </Section>

      <button
        onClick={onReset}
        className="w-full rounded-lg border border-neutral-700 px-4 py-2 text-xs text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300 transition"
      >
        Върни към default
      </button>
    </div>
  );
}

// ─── Content Tab ──────────────────────────────────────────────────────────────

function ContentTab({
  content, update,
}: {
  content: BuilderContent;
  update: <K extends keyof BuilderContent>(key: K, value: BuilderContent[K]) => void;
}) {
  return (
    <div className="space-y-6">
      <Section title="Основна информация">
        <div className="space-y-3">
          <TextField label="Име на салона" value={content.salonName} onChange={(v) => update("salonName", v)} />
          <TextField label="URL на логото" value={content.logoUrl} onChange={(v) => update("logoUrl", v)} placeholder="https://..." />
          {content.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={content.logoUrl} alt="logo" className="h-10 rounded object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
          )}
        </div>
      </Section>

      <Section title="Hero секция">
        <div className="space-y-3">
          <TextField     label="Заглавие"    value={content.heroTitle}    onChange={(v) => update("heroTitle", v)}    placeholder="Твоята красота, нашата страст" />
          <TextField     label="Подзаглавие" value={content.heroSubtitle} onChange={(v) => update("heroSubtitle", v)} placeholder="Запишете си час онлайн" />
          <TextareaField label="Описание"    value={content.description}  onChange={(v) => update("description", v)}  rows={3} />
          <TextField label="URL на Hero снимката" value={content.heroImageUrl} onChange={(v) => update("heroImageUrl", v)} placeholder="https://..." />
          {content.heroImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={content.heroImageUrl} alt="hero" className="w-full h-20 rounded object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
          )}
        </div>
      </Section>

      <Section title="За нас">
        <div className="space-y-3">
          <TextareaField label="Текст 1"       value={content.aboutText1}    onChange={(v) => update("aboutText1", v)}    rows={4} />
          <TextareaField label="Текст 2"       value={content.aboutText2}    onChange={(v) => update("aboutText2", v)}    rows={4} />
          <TextField     label="URL на снимка" value={content.aboutImageUrl} onChange={(v) => update("aboutImageUrl", v)} placeholder="https://..." />
          {content.aboutImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={content.aboutImageUrl} alt="about" className="w-full h-20 rounded object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
          )}
        </div>
      </Section>
    </div>
  );
}

// ─── UI primitives ────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">{title}</h3>
      {children}
    </div>
  );
}

function ColorField({
  label, value, presets, onChange,
}: {
  label: string; value: string; presets: string[]; onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-neutral-400">{label}</label>
      <div className="flex items-center gap-2 flex-wrap">
        <label className="relative shrink-0 cursor-pointer">
          <span className="block h-8 w-8 rounded-lg border border-neutral-600 shadow-sm" style={{ background: value }} />
          <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-24 rounded border border-neutral-700 bg-neutral-900 px-2 py-1.5 font-mono text-xs text-neutral-200"
          pattern="^#[0-9A-Fa-f]{6}$"
        />
        {presets.map((p) => (
          <button
            key={p}
            title={p}
            onClick={() => onChange(p)}
            className={`h-5 w-5 rounded-full border-2 transition hover:scale-110 ${value === p ? "border-white" : "border-transparent"}`}
            style={{ background: p }}
          />
        ))}
      </div>
    </div>
  );
}

function SizeField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-neutral-400">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 font-mono text-xs text-neutral-200"
      />
    </div>
  );
}

function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-neutral-400">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs text-neutral-200 placeholder:text-neutral-600"
      />
    </div>
  );
}

function TextareaField({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-neutral-400">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs text-neutral-200 resize-none"
      />
    </div>
  );
}
