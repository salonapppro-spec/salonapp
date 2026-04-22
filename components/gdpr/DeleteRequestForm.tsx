"use client";

import { useState } from "react";

export function DeleteRequestForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError("");

    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/gdpr/delete-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        email: fd.get("email"),
        phone: fd.get("phone"),
        details: fd.get("details"),
      }),
    });

    if (res.ok) {
      setStatus("success");
    } else {
      setStatus("error");
      setError("Нещо се обърка. Моля, пишете ни директно на privacy@salonapp.pro");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-xl bg-green-50 p-6 text-center text-green-800">
        <p className="text-lg font-semibold">Заявката е получена ✓</p>
        <p className="mt-2 text-sm">Ще отговорим в срок до 30 дни на посочения имейл.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-1 block text-sm font-medium">Три имена *</label>
        <input
          name="name"
          required
          className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none"
          placeholder="Иван Иванов"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Имейл адрес *</label>
        <input
          name="email"
          type="email"
          required
          className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none"
          placeholder="email@example.com"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Телефон (по желание)</label>
        <input
          name="phone"
          type="tel"
          className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none"
          placeholder="+359 8X XXX XXXX"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Допълнителна информация</label>
        <textarea
          name="details"
          rows={3}
          className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none"
          placeholder="Например: клиент съм на салон X, резервирал съм на дата Y..."
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-xl bg-amber-500 py-3 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-60"
      >
        {status === "loading" ? "Изпращане..." : "Изпрати заявката"}
      </button>
    </form>
  );
}
