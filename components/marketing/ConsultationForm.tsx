"use client";

import { useState } from "react";

export function ConsultationForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone: phone || undefined }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error ?? "Грешка");
      setDone(true);
    } catch (er) {
      setError(er instanceof Error ? er.message : "Грешка");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return <p className="text-sm text-emerald-100">Получихме заявката. Ще се свържем с вас възможно най-скоро.</p>;
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
      <input
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Име"
        className="rounded-xl border border-brand-400/50 bg-brand-950/50 px-3 py-2 text-sm text-white placeholder:text-brand-200/70"
      />
      <input
        required
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Имейл"
        className="rounded-xl border border-brand-400/50 bg-brand-950/50 px-3 py-2 text-sm text-white placeholder:text-brand-200/70"
      />
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Телефон"
        className="rounded-xl border border-brand-400/50 bg-brand-950/50 px-3 py-2 text-sm text-white placeholder:text-brand-200/70 sm:col-span-2"
      />
      {error ? <p className="text-sm text-red-200 sm:col-span-2">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-brand-900 sm:col-span-2 sm:w-fit"
      >
        {loading ? "Изпращане..." : "Запази безплатна консултация"}
      </button>
    </form>
  );
}
