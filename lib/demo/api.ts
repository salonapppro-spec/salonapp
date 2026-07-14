/**
 * Демо API — имитира `/api/admin/*` от локалния стор на посетителя.
 *
 * Всяка заявка, която истинският админ праща към сървъра, се обслужва тук:
 * същите URL-и, същите тела, същите JSON отговори — но нищо не излиза от
 * браузъра. Никаква база, никакви имейли, никакъв Stripe.
 *
 * Чиста функция: (състояние, заявка) → (отговор, ново състояние). Пач-ът над
 * `fetch` живее в `lib/demo/store.tsx`.
 */

import { nowMinutesInSofia, todayDateISOInSofia } from "@/lib/booking-datetime";
import { DEMO_SLUG, type DemoExpense, type DemoState } from "@/lib/demo/fixture";
import { generateSlots, timeToMinutes } from "@/lib/scheduling";
import type { BlockedSlot, Booking, Client, Service, Specialist } from "@/types";

export type DemoResponse = {
  status: number;
  json: unknown;
  /** Ново състояние — подава се само когато заявката е променила нещо. */
  next?: DemoState;
};

/** Заявките, които демото поема. Всичко останало отива към истинския fetch. */
export function isDemoApiUrl(url: string): boolean {
  return url.startsWith("/api/admin/");
}

const DEFAULT_WEEK = [
  { start_time: "10:00", end_time: "16:00", is_day_off: true },
  { start_time: "09:00", end_time: "18:00", is_day_off: false },
  { start_time: "09:00", end_time: "18:00", is_day_off: false },
  { start_time: "09:00", end_time: "18:00", is_day_off: false },
  { start_time: "09:00", end_time: "18:00", is_day_off: false },
  { start_time: "09:00", end_time: "18:00", is_day_off: false },
  { start_time: "10:00", end_time: "16:00", is_day_off: false },
];

let idCounter = 0;
function demoId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
}

function addMinutes(time: string, minutes: number): string {
  const total = Math.min(timeToMinutes(time) + minutes, 23 * 60 + 59);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function normalizeTime(t: string): string {
  return t.length > 5 ? t.slice(0, 5) : t;
}

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return timeToMinutes(aStart) < timeToMinutes(bEnd) && timeToMinutes(bStart) < timeToMinutes(aEnd);
}

function digitsOf(s: string): string {
  return s.replace(/\D+/g, "");
}

function ok(json: unknown, next?: DemoState, status = 200): DemoResponse {
  return { status, json, next };
}

function fail(error: string, status = 400): DemoResponse {
  return { status, json: { error } };
}

/** Активното работно време за даден ден от седмицата. */
function workingHoursForDay(state: DemoState, dayOfWeek: number) {
  const row = state.workingHours.find((w) => w.day_of_week === dayOfWeek);
  return row ?? { ...DEFAULT_WEEK[dayOfWeek], day_of_week: dayOfWeek };
}

/** Резервациите, които заемат място в графика (отказаните не заемат). */
function blockingBookings(state: DemoState, date: string, exceptId?: string) {
  return state.bookings.filter(
    (b) => b.booking_date === date && b.status !== "cancelled" && b.id !== exceptId,
  );
}

export function handleDemoRequest(
  state: DemoState,
  method: string,
  rawUrl: string,
  body: unknown,
): DemoResponse {
  const url = new URL(rawUrl, "http://demo.local");
  const path = url.pathname;
  const qs = url.searchParams;
  const m = method.toUpperCase();
  const payload = (body ?? {}) as Record<string, unknown>;

  // ── Резервации ────────────────────────────────────────────────────────────
  const bookingMatch = /^\/api\/admin\/bookings\/([^/]+)$/.exec(path);
  if (bookingMatch) {
    const id = decodeURIComponent(bookingMatch[1]);
    const booking = state.bookings.find((b) => b.id === id);
    if (!booking) return fail("Не е намерена резервация", 404);

    if (m === "DELETE") {
      return ok(
        { ok: true },
        { ...state, bookings: state.bookings.filter((b) => b.id !== id) },
      );
    }

    if (m === "PATCH") {
      // Смяна на статус („Яви се“, „Не се яви“, „Откажи“)
      if (typeof payload.status === "string") {
        const status = payload.status as Booking["status"];
        const updated = { ...booking, status };
        return ok(
          { booking: updated },
          { ...state, bookings: state.bookings.map((b) => (b.id === id ? updated : b)) },
        );
      }

      // Преместване на час — същите проверки като истинския route
      const date = typeof payload.booking_date === "string" ? payload.booking_date : "";
      const time = typeof payload.booking_time === "string" ? normalizeTime(payload.booking_time) : "";
      if (!date || !time) return fail("Невалидни данни");

      if (date < todayDateISOInSofia()) {
        return fail("Не може да се премести час на минала дата.");
      }

      const duration = booking.service_duration;
      const buffer = state.financialSettings.buffer_minutes;
      if (timeToMinutes(time) + duration > 24 * 60) {
        return fail("Часът не може да приключи след полунощ.");
      }
      const end = addMinutes(time, duration);
      const endWithBuffer = addMinutes(time, duration + buffer);

      const blocked = state.blockedSlots.filter((s) => s.blocked_date === date);
      if (blocked.some((s) => overlaps(time, end, normalizeTime(s.start_time), normalizeTime(s.end_time)))) {
        return fail("Часът попада в блокиран интервал.", 409);
      }

      const conflict = blockingBookings(state, date, id).some((b) =>
        overlaps(
          time,
          endWithBuffer,
          normalizeTime(b.booking_time),
          normalizeTime(b.booking_end_time ?? addMinutes(b.booking_time, b.service_duration)),
        ),
      );
      if (conflict) return fail("Часът се засича с друга резервация.", 409);

      const updated: Booking = { ...booking, booking_date: date, booking_time: time, booking_end_time: end };
      return ok(
        { booking: updated },
        { ...state, bookings: state.bookings.map((b) => (b.id === id ? updated : b)) },
      );
    }
  }

  // ── Свободни слотове ──────────────────────────────────────────────────────
  if (path === "/api/admin/slots" && m === "GET") {
    const serviceId = qs.get("service_id") ?? "";
    const date = qs.get("date") ?? "";
    const service = state.services.find((s) => s.id === serviceId);
    if (!service) return fail("Service not found", 404);

    const dayOfWeek = new Date(`${date}T12:00:00`).getDay();
    const wh = workingHoursForDay(state, dayOfWeek);
    if (wh.is_day_off) return ok({ slots: [] });

    const slots = generateSlots({
      workStart: wh.start_time,
      workEnd: wh.end_time,
      existingBookings: blockingBookings(state, date).map((b) => ({
        booking_time: normalizeTime(b.booking_time),
        service_duration: b.service_duration,
      })),
      blockedSlots: state.blockedSlots
        .filter((s) => s.blocked_date === date)
        .map((s) => ({ start_time: normalizeTime(s.start_time), end_time: normalizeTime(s.end_time) })),
      serviceDuration: service.duration_minutes ?? 60,
      bufferMinutes: state.financialSettings.buffer_minutes,
      slotInterval: 15,
      magneticEnabled: state.financialSettings.magnetic_scheduling,
      minStartMinutes: date === todayDateISOInSofia() ? nowMinutesInSofia() : undefined,
    });
    return ok({ slots });
  }

  // ── Работно време ─────────────────────────────────────────────────────────
  if (path === "/api/admin/working-hours") {
    if (m === "GET") {
      const days = DEFAULT_WEEK.map((def, i) => {
        const row = state.workingHours.find((w) => w.day_of_week === i);
        return row
          ? { start_time: row.start_time, end_time: row.end_time, is_day_off: row.is_day_off }
          : { ...def };
      });
      return ok({ days });
    }
    if (m === "PUT") {
      const days = (payload.days ?? []) as Array<{ start_time: string; end_time: string; is_day_off: boolean }>;
      const workingHours = days.map((d, i) => ({
        id: `demo-wh-${i}`,
        salon_slug: DEMO_SLUG,
        specialist_id: null,
        day_of_week: i,
        start_time: d.start_time,
        end_time: d.end_time,
        is_day_off: Boolean(d.is_day_off),
      }));
      return ok({ ok: true }, { ...state, workingHours });
    }
  }

  // ── Блокирани интервали ───────────────────────────────────────────────────
  const blockedMatch = /^\/api\/admin\/blocked-slots\/([^/]+)$/.exec(path);
  if (blockedMatch && m === "DELETE") {
    const id = decodeURIComponent(blockedMatch[1]);
    if (!state.blockedSlots.some((s) => s.id === id)) return fail("Не е намерено", 404);
    return ok({ ok: true }, { ...state, blockedSlots: state.blockedSlots.filter((s) => s.id !== id) });
  }

  if (path === "/api/admin/blocked-slots") {
    if (m === "GET") {
      const date = qs.get("date") ?? "";
      return ok({ slots: state.blockedSlots.filter((s) => s.blocked_date === date) });
    }
    if (m === "POST") {
      const slot: BlockedSlot = {
        id: demoId("demo-blk"),
        salon_slug: DEMO_SLUG,
        specialist_id: (payload.specialist_id as string | null) ?? null,
        blocked_date: String(payload.blocked_date ?? ""),
        start_time: normalizeTime(String(payload.start_time ?? "")),
        end_time: normalizeTime(String(payload.end_time ?? "")),
        reason: (payload.reason as string | null) ?? null,
        created_at: new Date().toISOString(),
      };
      if (!slot.blocked_date || !slot.start_time || !slot.end_time) return fail("Невалидни данни");
      return ok({ slot }, { ...state, blockedSlots: [...state.blockedSlots, slot] });
    }
  }

  // ── Клиенти ───────────────────────────────────────────────────────────────
  if (path === "/api/admin/clients/search" && m === "GET") {
    const q = (qs.get("q") ?? "").trim().toLowerCase();
    if (!q) return ok([]);
    const qDigits = digitsOf(q);
    const results = state.clients
      .filter((c) => {
        const byName = c.name.toLowerCase().includes(q);
        const byPhone = qDigits.length > 0 && digitsOf(c.phone ?? "").includes(qDigits);
        return byName || byPhone;
      })
      .slice(0, 8)
      .map((c) => ({ id: c.id, name: c.name, phone: c.phone ?? "", email: c.email ?? "" }));
    return ok(results);
  }

  if (path === "/api/admin/clients/lookup" && m === "GET") {
    const phone = digitsOf(qs.get("phone") ?? "");
    if (phone.length < 3) return ok({ name: null, email: null });
    const found = state.clients.find((c) => digitsOf(c.phone ?? "").endsWith(phone.slice(-8)));
    return ok({ name: found?.name ?? null, email: found?.email ?? null });
  }

  const clientMatch = /^\/api\/admin\/clients\/([^/]+)$/.exec(path);
  if (clientMatch) {
    const id = decodeURIComponent(clientMatch[1]);
    const client = state.clients.find((c) => c.id === id);
    if (!client) return fail("Не е намерен", 404);

    if (m === "GET") {
      const phoneKey = digitsOf(client.phone ?? "");
      const bookings = state.bookings
        .filter((b) => digitsOf(b.client_phone ?? "") === phoneKey)
        .sort((a, b) => `${b.booking_date}${b.booking_time}`.localeCompare(`${a.booking_date}${a.booking_time}`));
      const completed = bookings.filter((b) => b.status === "completed");
      const byService = new Map<string, number>();
      for (const b of bookings) byService.set(b.service_name, (byService.get(b.service_name) ?? 0) + 1);
      return ok({
        client,
        bookings,
        stats: {
          totalRevenue: completed.reduce((s, b) => s + Number(b.service_price_eur), 0),
          bookingCount: bookings.length,
          completedCount: completed.length,
          noShowCount: bookings.filter((b) => b.status === "no_show").length,
          topServices: Array.from(byService.entries())
            .sort((x, y) => y[1] - x[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count })),
        },
      });
    }

    if (m === "PATCH") {
      const updated: Client = {
        ...client,
        name: typeof payload.name === "string" ? payload.name : client.name,
        phone: typeof payload.phone === "string" ? payload.phone : client.phone,
        email: typeof payload.email === "string" ? payload.email : client.email,
        notes: typeof payload.notes === "string" ? payload.notes : client.notes,
      };
      return ok(
        { client: updated },
        { ...state, clients: state.clients.map((c) => (c.id === id ? updated : c)) },
      );
    }

    if (m === "DELETE") {
      return ok({ ok: true }, { ...state, clients: state.clients.filter((c) => c.id !== id) });
    }
  }

  if (path === "/api/admin/clients" && m === "POST") {
    const phone = String(payload.phone ?? "").trim();
    const name = String(payload.name ?? "").trim();
    if (!name || !phone) return fail("Име и телефон са задължителни.");
    if (state.clients.some((c) => digitsOf(c.phone ?? "") === digitsOf(phone))) {
      return fail("Клиент с този телефон вече съществува.", 409);
    }
    const client: Client = {
      id: demoId("demo-cli"),
      salon_slug: DEMO_SLUG,
      specialist_id: null,
      name,
      phone,
      email: (payload.email as string | null) || null,
      notes: (payload.notes as string | null) || null,
      created_at: new Date().toISOString(),
    };
    return ok({ client }, { ...state, clients: [client, ...state.clients] }, 201);
  }

  // ── Услуги ────────────────────────────────────────────────────────────────
  const serviceMatch = /^\/api\/admin\/services\/([^/]+)$/.exec(path);
  if (serviceMatch) {
    const id = decodeURIComponent(serviceMatch[1]);
    const service = state.services.find((s) => s.id === id);
    if (!service) return fail("Not found", 404);

    if (m === "PATCH") {
      const updated: Service = {
        ...service,
        name: typeof payload.name === "string" ? payload.name : service.name,
        price_eur: payload.price_eur != null ? Number(payload.price_eur) : service.price_eur,
        duration_minutes:
          payload.duration_minutes != null ? Number(payload.duration_minutes) : service.duration_minutes,
        is_active: typeof payload.is_active === "boolean" ? payload.is_active : service.is_active,
      };
      return ok(
        { service: updated },
        { ...state, services: state.services.map((s) => (s.id === id ? updated : s)) },
      );
    }

    if (m === "DELETE") {
      const hasBookings = state.bookings.some((b) => b.service_id === id);
      if (hasBookings) {
        return fail(
          "Услугата има резервации — изключи я вместо да я триеш, за да не изгубиш историята.",
          409,
        );
      }
      return ok({ ok: true }, { ...state, services: state.services.filter((s) => s.id !== id) });
    }
  }

  if (path === "/api/admin/services") {
    if (m === "GET") return ok({ services: state.services });
    if (m === "POST") {
      const name = String(payload.name ?? "").trim();
      if (!name) return fail("Invalid payload");
      const service: Service = {
        id: demoId("demo-srv"),
        salon_slug: DEMO_SLUG,
        specialist_id: null,
        name,
        price_eur: Number(payload.price_eur ?? 0),
        duration_minutes: Number(payload.duration_minutes ?? 60),
        is_complex: false,
        active_start_min: null,
        active_start_max: null,
        waiting_min: null,
        waiting_max: null,
        active_finish_min: null,
        active_finish_max: null,
        is_active: true,
        created_at: new Date().toISOString(),
      };
      return ok({ service }, { ...state, services: [...state.services, service] });
    }
  }

  // ── Специалисти ───────────────────────────────────────────────────────────
  const specialistMatch = /^\/api\/admin\/specialists\/([^/]+)$/.exec(path);
  if (specialistMatch) {
    const id = decodeURIComponent(specialistMatch[1]);
    const specialist = state.specialists.find((s) => s.id === id);
    if (!specialist) return fail("Specialist not found", 404);

    if (m === "PATCH") {
      const updated: Specialist = {
        ...specialist,
        name: typeof payload.name === "string" ? payload.name : specialist.name,
        role: typeof payload.role === "string" ? payload.role : specialist.role,
        is_active: typeof payload.is_active === "boolean" ? payload.is_active : specialist.is_active,
      };
      return ok(
        { ok: true, specialist: updated },
        { ...state, specialists: state.specialists.map((s) => (s.id === id ? updated : s)) },
      );
    }

    if (m === "DELETE") {
      if (specialist.is_technical_admin) {
        return fail("Този специалист е системен и не може да бъде изтрит.", 403);
      }
      return ok({ ok: true }, { ...state, specialists: state.specialists.filter((s) => s.id !== id) });
    }
  }

  if (path === "/api/admin/specialists") {
    if (m === "GET") return ok({ specialists: state.specialists });
    if (m === "POST") {
      const name = String(payload.name ?? "").trim();
      if (!name) return fail("Invalid payload");
      const specialist: Specialist = {
        id: demoId("demo-spec"),
        salon_slug: DEMO_SLUG,
        name,
        role: (payload.role as string | null) ?? null,
        bio: null,
        avatar_url: null,
        is_active: true,
        is_technical_admin: false,
        created_at: new Date().toISOString(),
      };
      return ok(
        { ok: true, specialist },
        { ...state, specialists: [...state.specialists, specialist] },
      );
    }
  }

  // ── Разходи ───────────────────────────────────────────────────────────────
  if (path === "/api/admin/expenses") {
    if (m === "GET") {
      const from = qs.get("from") ?? "";
      const to = qs.get("to") ?? "";
      const expenses = state.expenses
        .filter((e) => (!from || e.date >= from) && (!to || e.date <= to))
        .sort((a, b) => b.date.localeCompare(a.date));
      return ok({ expenses });
    }
    if (m === "POST") {
      const expense: DemoExpense = {
        id: demoId("demo-exp"),
        salon_slug: DEMO_SLUG,
        date: String(payload.date ?? todayDateISOInSofia()),
        amount: Number(payload.amount ?? 0),
        description: String(payload.description ?? "").trim(),
        supplier: (payload.supplier as string | null) || null,
      };
      if (!(expense.amount > 0) || !expense.description) return fail("Невалидни данни");
      return ok({ expense }, { ...state, expenses: [expense, ...state.expenses] });
    }
  }

  // ── Финансови настройки ───────────────────────────────────────────────────
  if (path === "/api/admin/financial-settings" && m === "PATCH") {
    const numeric = [
      "desired_salary",
      "rent_eur",
      "electricity_eur",
      "water_eur",
      "accounting_eur",
      "monthly_revenue_goal_eur",
      "working_days_per_week",
      "working_hours_per_day",
      "booking_window_days",
      "buffer_minutes",
      "booking_min_notice_minutes",
    ] as const;

    const settings = { ...state.financialSettings };
    for (const key of numeric) {
      if (payload[key] != null) settings[key] = Number(payload[key]);
    }
    if (typeof payload.vat_enabled === "boolean") settings.vat_enabled = payload.vat_enabled;
    if (typeof payload.magnetic_scheduling === "boolean") settings.magnetic_scheduling = payload.magnetic_scheduling;

    return ok({ settings }, { ...state, financialSettings: settings });
  }

  // ── Настройки на салона ───────────────────────────────────────────────────
  if (path === "/api/admin/settings" && m === "POST") {
    const tenant = { ...state.tenant };
    for (const [key, value] of Object.entries(payload)) {
      if (key in tenant && (typeof value === "string" || value === null)) {
        (tenant as unknown as Record<string, unknown>)[key] = value;
      }
    }
    return ok({ ok: true }, { ...state, tenant });
  }

  // ── Качване на файлове — единственото, което демото не прави ──────────────
  if (path.startsWith("/api/admin/upload") || path.startsWith("/api/admin/gallery")) {
    if (m === "GET") return ok({ items: [], gallery: [] });
    return fail("Качването на снимки не е налично в демото. В реален салон работи нормално.", 400);
  }

  return fail("Тази операция не е налична в демото.", 404);
}
