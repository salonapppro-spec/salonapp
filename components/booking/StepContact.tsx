"use client";

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
}) {
  const { stepLabel, name, phone, email, notes, onName, onPhone, onEmail, onNotes, onPhoneLookup, lookupStatus } = props;

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
        {lookupStatus === "done" ? <p className="mt-1 text-xs text-emerald-700">Заредени запазени данни (ако има).</p> : null}
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
          onChange={(e) => onEmail(e.target.value)}
          autoComplete="email"
        />
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
