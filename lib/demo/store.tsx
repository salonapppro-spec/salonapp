"use client";

/**
 * Демо стор — цялото състояние на демо салона живее тук, в браузъра.
 *
 * Пач-ва `window.fetch`: всяка заявка към `/api/admin/*` се обслужва от
 * `handleDemoRequest` вместо да отиде на сървъра. Така истинските админ
 * компоненти работят непроменени, но нищо не стига до базата, имейлите или
 * Stripe. Състоянието се пази в sessionStorage (оцелява при refresh, изчезва
 * при затваряне на таба) и се нулира с бутона „Нулирай демото“.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { handleDemoRequest, isDemoApiUrl } from "@/lib/demo/api";
import { buildDemoState, type DemoState } from "@/lib/demo/fixture";
import { todayDateISOInSofia } from "@/lib/booking-datetime";

const STORAGE_KEY = "salonapp.demo.state.v1";
/** Fixture-ът е спрямо днешната дата — вчерашно състояние би изглеждало мъртво. */
const STORAGE_DAY_KEY = "salonapp.demo.day.v1";

export type AdminBookingResult = { success: true; booking_id: string } | { error: string };

type DemoContextValue = {
  /**
   * null до първия рендер в браузъра. Демо салонът се строи спрямо ДНЕШНАТА
   * дата, а страниците се prerender-ват при билда — ако сървърът рендерираше
   * състояние, датите щяха да замръзнат от деня на деплой и хидратацията да
   * се разминава. Затова фикстурата се вдига само на клиента.
   */
  state: DemoState | null;
  /** Замества server action-а `createAdminBooking` в демо режим. */
  createBooking: (input: unknown) => Promise<AdminBookingResult>;
  reset: () => void;
};

const DemoContext = createContext<DemoContextValue | null>(null);

/** null извън демо режим — компонентите тогава ползват истинския сървър. */
export function useDemoOptional(): DemoContextValue | null {
  return useContext(DemoContext);
}

/** Само за компоненти под <DemoReady> — там състоянието е гарантирано. */
export function useDemo(): DemoContextValue & { state: DemoState } {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo извън <DemoProvider>");
  if (!ctx.state) throw new Error("useDemo извън <DemoReady>");
  return ctx as DemoContextValue & { state: DemoState };
}

/**
 * Пуска децата чак когато демо салонът е вдигнат в браузъра. Дотогава —
 * скелет, същият, който админът показва докато чака данни от сървъра.
 */
export function DemoReady(props: { children: React.ReactNode }) {
  const ctx = useContext(DemoContext);
  if (!ctx?.state) {
    return (
      <div className="mt-6 space-y-3">
        <div className="h-28 animate-pulse rounded-2xl border border-[#C9A84C]/20 bg-white/80" />
        <div className="h-[420px] animate-pulse rounded-2xl border border-[#C9A84C]/15 bg-white/75" />
      </div>
    );
  }
  return <>{props.children}</>;
}

function loadPersisted(): DemoState | null {
  try {
    const day = sessionStorage.getItem(STORAGE_DAY_KEY);
    if (day !== todayDateISOInSofia()) return null;
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DemoState) : null;
  } catch {
    return null;
  }
}

function persist(state: DemoState): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    sessionStorage.setItem(STORAGE_DAY_KEY, todayDateISOInSofia());
  } catch {
    // Пълен/забранен sessionStorage — демото пак работи, просто не преживява refresh.
  }
}

export function DemoProvider(props: { children: React.ReactNode }) {
  const [state, setState] = useState<DemoState | null>(null);

  // Само в браузъра: продължаваме демото от sessionStorage, ако е от днес,
  // иначе вдигаме нов салон.
  useEffect(() => {
    setState(loadPersisted() ?? buildDemoState());
  }, []);

  // Пач-ът чете състоянието през ref — иначе всяка мутация би пре-инсталирала fetch.
  const stateRef = useRef<DemoState | null>(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const apply = useCallback((next: DemoState) => {
    stateRef.current = next;
    setState(next);
    persist(next);
  }, []);

  useEffect(() => {
    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url =
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();

      const path = url.startsWith("http") ? new URL(url).pathname + new URL(url).search : url;
      const current = stateRef.current;
      // Без вдигнат демо салон не поемаме заявката — по-добре 503, отколкото
      // тя да отиде на истинския сървър.
      if (!isDemoApiUrl(path)) return originalFetch(input as RequestInfo, init);
      if (!current) {
        return new Response(JSON.stringify({ error: "Демото още се зарежда." }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        });
      }

      let body: unknown = null;
      if (typeof init?.body === "string") {
        try {
          body = JSON.parse(init.body);
        } catch {
          body = null;
        }
      }

      const result = handleDemoRequest(current, method, path, body);
      if (result.next) apply(result.next);

      return new Response(JSON.stringify(result.json), {
        status: result.status,
        headers: { "Content-Type": "application/json" },
      });
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [apply]);

  const createBooking = useCallback<DemoContextValue["createBooking"]>(
    async (input) => {
      const p = (input ?? {}) as Record<string, unknown>;
      const current = stateRef.current;
      if (!current) return { error: "Демото още се зарежда." };

      const service = current.services.find((s) => s.id === p.service_id);
      if (!service) return { error: "Изберете услуга." };

      const date = String(p.booking_date ?? "");
      const time = String(p.booking_time ?? "").slice(0, 5);
      const name = String(p.client_name ?? "").trim();
      if (!date || !time || !name) return { error: "Попълнете дата, час и име." };

      const duration = service.duration_minutes ?? 60;
      const [h, m] = time.split(":").map(Number);
      const endMin = Math.min(h * 60 + m + duration, 23 * 60 + 59);
      const end = `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}`;

      const id = `demo-bkg-new-${Date.now().toString(36)}`;
      const phone = String(p.client_phone ?? "").trim();
      const email = String(p.client_email ?? "").trim();

      const booking = {
        id,
        created_at: new Date().toISOString(),
        salon_slug: current.tenant.salon_slug,
        specialist_id: (p.specialist_id as string | null) ?? null,
        service_id: service.id,
        service_name: service.name,
        service_price_eur: service.price_eur,
        service_duration: duration,
        booking_date: date,
        booking_time: time,
        booking_end_time: end,
        client_name: name,
        client_phone: phone || null,
        client_email: email || null,
        status: "confirmed" as const,
        confirmation_token: null,
        confirmed_at: new Date().toISOString(),
        notes: (p.notes as string | null) || null,
        hair_length: null,
        hair_density: null,
      };

      // Нов телефон → нов клиент в списъка, точно както прави сървърът.
      const digits = (s: string) => s.replace(/\D+/g, "");
      const knownClient =
        phone && current.clients.some((c) => digits(c.phone ?? "") === digits(phone));
      const clients =
        phone && !knownClient
          ? [
              {
                id: `demo-cli-new-${Date.now().toString(36)}`,
                salon_slug: current.tenant.salon_slug,
                specialist_id: null,
                name,
                phone,
                email: email || null,
                notes: null,
                created_at: new Date().toISOString(),
              },
              ...current.clients,
            ]
          : current.clients;

      apply({ ...current, bookings: [...current.bookings, booking], clients });
      return { success: true, booking_id: id };
    },
    [apply],
  );

  const reset = useCallback(() => {
    const fresh = buildDemoState();
    apply(fresh);
  }, [apply]);

  const value = useMemo<DemoContextValue>(
    () => ({ state, createBooking, reset }),
    [state, createBooking, reset],
  );

  return <DemoContext.Provider value={value}>{props.children}</DemoContext.Provider>;
}
