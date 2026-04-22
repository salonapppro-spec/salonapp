"use client";

import { useState, useTransition } from "react";
import type { DesignTokens } from "@/types/design-tokens";
import { DEFAULT_DESIGN_TOKENS } from "@/lib/design-tokens";
import { saveDesignTokens } from "@/app/super-admin/actions";

const FONT_OPTIONS = [
  { label: "Inter (стандарт)",     value: "Inter, sans-serif" },
  { label: "Playfair Display",     value: "'Playfair Display', serif" },
  { label: "Montserrat",           value: "Montserrat, sans-serif" },
  { label: "Cormorant Garamond",   value: "'Cormorant Garamond', serif" },
  { label: "Lato",                 value: "Lato, sans-serif" },
  { label: "Raleway",              value: "Raleway, sans-serif" },
];

const BORDER_RADIUS_OPTIONS = [
  { label: "Остри (0)",       value: "0" },
  { label: "Леки (0.375rem)", value: "0.375rem" },
  { label: "Средни (0.75rem)", value: "0.75rem" },
  { label: "Заоблени (1.5rem)", value: "1.5rem" },
  { label: "Кръгли (9999px)", value: "9999px" },
];

interface Props {
  salonSlug: string;
  salonName: string;
  initialTokens: DesignTokens;
  previewUrl: string;
}

export function BuilderClient({ salonSlug, salonName, initialTokens, previewUrl }: Props) {
  const [tokens, setTokens] = useState<DesignTokens>(initialTokens);
  const [saved, setSaved] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof DesignTokens>(key: K, value: DesignTokens[K]) {
    setTokens((t) => ({ ...t, [key]: value }));
    setSaved(false);
  }

  function handleSave() {
    startTransition(async () => {
      await saveDesignTokens(salonSlug, tokens);
      setSaved(true);
      setIframeKey((k) => k + 1);
    });
  }

  function handleReset() {
    setTokens(DEFAULT_DESIGN_TOKENS);
    setSaved(false);
  }

  const previewWithTokens = `${previewUrl}?_t=${iframeKey}`;

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-0 overflow-hidden rounded-2xl border border-neutral-800">
      {/* Left panel — controls */}
      <div className="flex w-72 shrink-0 flex-col overflow-y-auto border-r border-neutral-800 bg-neutral-950">
        {/* Header */}
        <div className="border-b border-neutral-800 px-4 py-3">
          <p className="text-xs text-neutral-500">Visual Builder</p>
          <h2 className="truncate text-sm font-semibold text-neutral-100">{salonName}</h2>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-5 px-4 py-4">
          {/* Colors */}
          <section>
            <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Цветове</h3>
            <div className="grid gap-3">
              <ColorField label="Основен цвят"  value={tokens.primaryColor}    onChange={(v) => update("primaryColor", v)} />
              <ColorField label="Фон"            value={tokens.backgroundColor} onChange={(v) => update("backgroundColor", v)} />
              <ColorField label="Текст"          value={tokens.textColor}       onChange={(v) => update("textColor", v)} />
              <ColorField label="Акцент"         value={tokens.accentColor}     onChange={(v) => update("accentColor", v)} />
            </div>
          </section>

          {/* Typography */}
          <section>
            <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Типография</h3>
            <div className="grid gap-3">
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
              </div>
              <SizeField label="Заглавие"  value={tokens.headingSize} onChange={(v) => update("headingSize", v)} />
              <SizeField label="Текст"     value={tokens.bodySize}    onChange={(v) => update("bodySize", v)} />
            </div>
          </section>

          {/* Shape */}
          <section>
            <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Форма</h3>
            <div>
              <label className="mb-1 block text-xs text-neutral-400">Заоблени ъгли</label>
              <select
                value={tokens.borderRadius}
                onChange={(e) => update("borderRadius", e.target.value)}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100"
              >
                {BORDER_RADIUS_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </section>

          {/* Spacing */}
          <section>
            <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Разстояния</h3>
            <div className="grid gap-3">
              <SizeField label="Бутон padding" value={tokens.buttonPadding}  onChange={(v) => update("buttonPadding", v)} />
              <SizeField label="Секция padding" value={tokens.sectionPadding} onChange={(v) => update("sectionPadding", v)} />
            </div>
          </section>
        </div>

        {/* Footer actions */}
        <div className="mt-auto border-t border-neutral-800 px-4 py-3 flex flex-col gap-2">
          {saved && (
            <p className="text-center text-xs font-semibold text-emerald-400">✓ Запазено успешно!</p>
          )}
          <button
            onClick={handleSave}
            disabled={isPending}
            className="w-full rounded-lg bg-white px-4 py-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-100 disabled:opacity-60"
          >
            {isPending ? "Запазване…" : "💾 Запази дизайна"}
          </button>
          <button
            onClick={handleReset}
            className="w-full rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-400 hover:bg-neutral-800"
          >
            Върни към default
          </button>
        </div>
      </div>

      {/* Right panel — iframe preview */}
      <div className="flex flex-1 flex-col bg-neutral-900">
        <div className="flex items-center gap-2 border-b border-neutral-800 bg-neutral-950 px-4 py-2">
          <span className="text-xs text-neutral-500">Преглед:</span>
          <code className="truncate text-xs text-neutral-400">{previewUrl}</code>
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto shrink-0 rounded border border-neutral-700 px-2 py-0.5 text-xs text-neutral-400 hover:bg-neutral-800"
          >
            Отвори ↗
          </a>
        </div>
        <iframe
          key={iframeKey}
          src={previewWithTokens}
          className="flex-1 w-full border-0"
          title={`Preview — ${salonName}`}
        />
      </div>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-8 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"
      />
      <div className="flex-1 min-w-0">
        <label className="block text-xs text-neutral-400">{label}</label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded border border-neutral-700 bg-neutral-900 px-2 py-1 font-mono text-xs text-neutral-200"
          placeholder="#F2A58E"
          pattern="^#[0-9A-Fa-f]{6}$"
        />
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
