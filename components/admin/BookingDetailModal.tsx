"use client";

import { useState } from "react";

import type { Booking, BookingStatus } from "@/types";

function statusLabel(s: BookingStatus): string {
  const map: Record<BookingStatus, string> = {
    pending: "Чакащо",
    confirmed: "Потвърдено",
    completed: "Яви се",
    cancelled: "Отказано",
    no_show: "Неявил се",
  };
  return map[s];
}

export function BookingDetailModal(props: {
  booking: Booking | null;
  onClose: () => void;
  onAfterChange: () => void;
}) {
  const { booking, onClose, onAfterChange } = props;

  const [moveOpen, setMoveOpen] = useState(false);
  const [moveDate, setMoveDate] = useState(booking?.booking_date ?? "");
  const [moveTime, setMoveTime] = useState(booking?.booking_time?.slice(0, 5) ?? "");
  const [moveSaving, setMoveSaving] = useState(false);
  const [moveError, setMoveError] = useState<string | null>(null);

  if (!booking) return null;
  const b = booking;

  async function patchStatus(status: BookingStatus) {
    const res = await fetch(`/api/admin/bookings/${b.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const j = (await res.json()) as { error?: string };
      alert(j?.error ?? "Грешка");
      return;
    }
    onAfterChange();
    onClose();
  }

  async function remove() {
    if (!confirm("Изтриване на резервацията?")) return;
    const res = await fetch(`/api/admin/bookings/${b.id}`, { method: "DELETE" });
    if (!res.ok) {
      const j = (await res.json()) as { error?: string };
      alert(j?.error ?? "Грешка");
      return;
    }
    onAfterChange();
    onClose();
  }

  async function move() {
    if (!moveDate || !moveTime) {
      setMoveError("Изберете дата и час.");
      return;
    }
    setMoveSaving(true);
    setMoveError(null);
    try {
      const res = await fetch(`/api/admin/bookings/${b.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_date: moveDate, booking_time: moveTime }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMoveError(j?.error ?? "Грешка при преместване");
        return;
      }
      onAfterChange();
      onClose();
    } catch {
      setMoveError("Грешка при преместване");
    } finally {
      setMoveSaving(false);
    }
  }

  const unchanged = moveDate === b.booking_date && moveTime === b.booking_time.slice(0, 5);

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 sm:items-center" role="dialog" aria-modal>
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Затвори" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-brand-200/80 bg-white p-5 shadow-xl">
        <h2 className="text-lg font-semibold text-brand-900">Резервация</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div>
            <dt className="text-brand-600">Час</dt>
            <dd className="font-medium text-brand-900">
              {b.booking_time.slice(0, 5)} · {b.service_name}
            </dd>
          </div>
          <div>
            <dt className="text-brand-600">Клиент</dt>
            <dd className="font-medium text-brand-900">{b.client_name}</dd>
          </div>
          <div>
            <dt className="text-brand-600">Телефон / имейл</dt>
            <dd className="text-brand-800">
              {[b.client_phone, b.client_email].filter(Boolean).join(" · ") || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-brand-600">Статус</dt>
            <dd className="font-medium text-brand-900">{statusLabel(b.status)}</dd>
          </div>
          {(b.hair_length || b.hair_density) && (
            <div>
              <dt className="text-brand-600">Коса</dt>
              <dd className="text-brand-800">
                {[b.hair_length, b.hair_density].filter(Boolean).join(" · ")}
              </dd>
            </div>
          )}
          {b.notes ? (
            <div>
              <dt className="text-brand-600">Бележки</dt>
              <dd className="text-brand-800">{b.notes}</dd>
            </div>
          ) : null}
        </dl>

        {moveOpen ? (
          <div className="mt-4 rounded-xl border border-brand-200/80 bg-brand-50/40 p-3">
            <p className="text-sm font-semibold text-brand-900">Преместване на часа</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-brand-600">Нова дата</label>
                <input
                  type="date"
                  className="input-admin mt-1"
                  value={moveDate}
                  onChange={(e) => { setMoveDate(e.target.value); setMoveError(null); }}
                />
              </div>
              <div>
                <label className="text-xs text-brand-600">Нов час</label>
                <input
                  type="time"
                  step={300}
                  className="input-admin mt-1"
                  value={moveTime}
                  onChange={(e) => { setMoveTime(e.target.value); setMoveError(null); }}
                />
              </div>
            </div>
            {moveError ? (
              <div className="mt-2 rounded-lg border border-red-200 bg-red-50/90 px-3 py-2 text-xs text-red-900">{moveError}</div>
            ) : null}
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                className="btn-admin-primary flex-1"
                disabled={moveSaving || unchanged}
                onClick={() => void move()}
              >
                {moveSaving ? "Преместване…" : "Премести"}
              </button>
              <button
                type="button"
                className="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-semibold text-neutral-800"
                onClick={() => { setMoveOpen(false); setMoveError(null); }}
              >
                Отказ
              </button>
            </div>
          </div>
        ) : null}

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button type="button" className="btn-admin-primary flex-1 sm:flex-none" onClick={() => void patchStatus("completed")}>
            Явил се
          </button>
          <button
            type="button"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-900 sm:flex-none"
            onClick={() => void patchStatus("no_show")}
          >
            Не се явил
          </button>
          {!moveOpen ? (
            <button
              type="button"
              className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-900 sm:flex-none"
              onClick={() => setMoveOpen(true)}
            >
              🕐 Премести
            </button>
          ) : null}
          <button
            type="button"
            className="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-semibold text-neutral-800 sm:ml-auto"
            onClick={() => void remove()}
          >
            Изтрий
          </button>
        </div>
        <button type="button" className="btn-admin-ghost mt-3 w-full" onClick={onClose}>
          Затвори
        </button>
      </div>
    </div>
  );
}
