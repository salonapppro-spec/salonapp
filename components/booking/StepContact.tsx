"use client";

import { useState } from "react";
import { suggestEmailFix } from "@/lib/email-typo";

export function StepContact(props: {
  stepLabel: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
  onName: (v: string) => void;
  onPhone: (v: string) => void;
  onEmail: (v: string) => void;
  onNotes: (v: string) => void;
  onPhoneLookup: () => void;
  lookupStatus: "idle" | "loading" | "done" | "error";
  emailHint?: string | null;
}) {
  const { stepLabel, name, phone, email, notes, onName, onPhone, onEmail, onNotes, onPhoneLookup, lookupStatus, emailHint } = props;

  // Подсказка при правописна грешка в домейна (abv.bgg → abv.bg).
  // Проверява се на blur, за да не подсказва докато човекът още пише.
  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-neutral-800">{stepLabel}</p>
      <div>
        <label className="text-xs font-medium text-neutral-600">Телефон *</label>
        <input
          className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
          value={phone}
          onChange={(e) => onPhone(e.target.value)}
          onBlur={() => {
            if (phone.trim().length >= 5) onPhoneLookup();
          }}
          autoComplete="tel"
        />
        {lookupStatus === "loading" ? <p className="mt-1 text-xs text-neutral-500">Търсене на клиент…</p> : null}
        {lookupStatus === "done" ? (
          <p className="mt-1 text-xs text-emerald-700">
            {emailHint
              ? `Познат клиент — запазен имейл: ${emailHint}. Въведете пълния адрес, ако искате потвърждение по имейл.`
              : "Заредено запазено име (ако има)."}
          </p>
        ) : null}
      </div>
      <div>
        <label className="text-xs font-medium text-neutral-600">Име *</label>
        <input
          className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
          value={name}
          onChange={(e) => onName(e.target.value)}
          autoComplete="name"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-neutral-600">Имейл</label>
        <input
          type="email"
          className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
          value={email}
          onChange={(e) => {
            onEmail(e.target.value);
            if (emailSuggestion) setEmailSuggestion(null);
          }}
          onBlur={() => setEmailSuggestion(suggestEmailFix(email))}
          autoComplete="email"
        />
        {emailSuggestion ? (
          <p className="mt-1 text-xs text-amber-700">
            Имахте предвид{" "}
            <button
              type="button"
              className="font-semibold underline"
              onClick={() => {
                onEmail(emailSuggestion);
                setEmailSuggestion(null);
              }}
            >
              {emailSuggestion}
            </button>
            ?
          </p>
        ) : null}
      </div>
      <div>
        <label className="text-xs font-medium text-neutral-600">Бележки</label>
        <textarea
          className="mt-1 min-h-[72px] w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
          value={notes}
          onChange={(e) => onNotes(e.target.value)}
        />
      </div>
    </div>
  );
}
