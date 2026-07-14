/**
 * Демо салон — данните на „Студио Демо“.
 *
 * Това е ЕДИНСТВЕНИЯТ източник на данни за демо режима. Нищо тук не пипа
 * Supabase: fixture-ът се генерира спрямо днешната дата (за да изглежда жив),
 * зарежда се в стора на посетителя и живее само в неговия браузър.
 *
 * Промените, които посетителят прави в демото, се пазят в sessionStorage и
 * изчезват при затваряне на таба — виж `lib/demo/store.tsx`.
 */

import { addCalendarDaysInSofia, todayDateISOInSofia } from "@/lib/booking-datetime";
import type {
  BlockedSlot,
  Booking,
  Client,
  FinancialSettings,
  Service,
  Specialist,
  Tenant,
  WorkingHours,
} from "@/types";

export const DEMO_SLUG = "demo";

/** Същите полета като реда в `expenses` — формата, който админът очаква. */
export type DemoExpense = {
  id: string;
  salon_slug: string;
  date: string;
  amount: number;
  description: string;
  supplier: string | null;
};

export type DemoState = {
  tenant: Tenant;
  services: Service[];
  specialists: Specialist[];
  workingHours: WorkingHours[];
  clients: Client[];
  bookings: Booking[];
  blockedSlots: BlockedSlot[];
  expenses: DemoExpense[];
  financialSettings: FinancialSettings;
};

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = Math.min(h * 60 + m + minutes, 23 * 60 + 59);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

const DEMO_TENANT: Tenant = {
  id: "demo-tenant",
  salon_slug: DEMO_SLUG,
  salon_name: "Студио Демо",
  plan: "premium",
  status: "active",
  start_date: "2025-01-01",
  payment_type: null,
  stripe_customer_id: null,
  stripe_subscription_id: null,
  domain: null,
  template: "luxe",
  primary_color: "#C9A84C",
  background_color: null,
  font: null,
  logo_url: null,
  hero_title: "Студио Демо",
  hero_subtitle: "Красота, направена с внимание",
  hero_image_url: null,
  description: "Демонстрационен салон — тук виждаш как изглежда SalonApp отвътре.",
  about_text1: null,
  about_text2: null,
  about_image_url: null,
  address: "ул. Примерна 1, София",
  phone: "0888 000 000",
  email: "demo@salonapp.pro",
  instagram_url: null,
  facebook_url: null,
  tiktok_url: null,
  google_maps_embed: null,
  facebook_pixel_id: null,
  capi_token: null,
  clarity_id: null,
  gtm_id: null,
  ga4_measurement_id: null,
  gsc_verification_token: null,
  owner_email: "demo@salonapp.pro",
  owner_phone: "0888 000 000",
  created_at: "2025-01-01T09:00:00.000Z",
};

const DEMO_SPECIALISTS: Specialist[] = [
  {
    id: "demo-spec-1",
    salon_slug: DEMO_SLUG,
    name: "Мария Петрова",
    role: "Стилист",
    bio: null,
    avatar_url: null,
    is_active: true,
    is_technical_admin: true,
    created_at: "2025-01-01T09:00:00.000Z",
  },
  {
    id: "demo-spec-2",
    salon_slug: DEMO_SLUG,
    name: "Елена Стоянова",
    role: "Козметик",
    bio: null,
    avatar_url: null,
    is_active: true,
    is_technical_admin: false,
    created_at: "2025-01-01T09:00:00.000Z",
  },
];

type ServiceSeed = { id: string; name: string; price: number; duration: number };

const SERVICE_SEEDS: ServiceSeed[] = [
  { id: "demo-srv-1", name: "Подстригване и оформяне", price: 25, duration: 60 },
  { id: "demo-srv-2", name: "Боядисване + терапия", price: 65, duration: 120 },
  { id: "demo-srv-3", name: "Кичури / балеаж", price: 90, duration: 180 },
  { id: "demo-srv-4", name: "Официална прическа", price: 45, duration: 90 },
  { id: "demo-srv-5", name: "Маникюр с гел лак", price: 30, duration: 75 },
  { id: "demo-srv-6", name: "Почистване на лице", price: 40, duration: 60 },
];

const DEMO_SERVICES: Service[] = SERVICE_SEEDS.map((s, i) => ({
  id: s.id,
  salon_slug: DEMO_SLUG,
  specialist_id: null,
  name: s.name,
  price_eur: s.price,
  duration_minutes: s.duration,
  is_complex: false,
  active_start_min: null,
  active_start_max: null,
  waiting_min: null,
  waiting_max: null,
  active_finish_min: null,
  active_finish_max: null,
  is_active: true,
  created_at: `2025-01-0${i + 1}T09:00:00.000Z`,
}));

const DEMO_WORKING_HOURS: WorkingHours[] = [
  { day: 0, start: "10:00", end: "16:00", off: true },
  { day: 1, start: "09:00", end: "19:00", off: false },
  { day: 2, start: "09:00", end: "19:00", off: false },
  { day: 3, start: "09:00", end: "19:00", off: false },
  { day: 4, start: "09:00", end: "20:00", off: false },
  { day: 5, start: "09:00", end: "20:00", off: false },
  { day: 6, start: "10:00", end: "16:00", off: false },
].map((d) => ({
  id: `demo-wh-${d.day}`,
  salon_slug: DEMO_SLUG,
  specialist_id: null,
  day_of_week: d.day,
  start_time: d.start,
  end_time: d.end,
  is_day_off: d.off,
}));

type ClientSeed = { id: string; name: string; phone: string; email: string | null; notes: string | null };

const CLIENT_SEEDS: ClientSeed[] = [
  { id: "demo-cli-1", name: "Ивана Георгиева", phone: "0888 123 456", email: "ivana@example.com", notes: "Предпочита студени нюанси." },
  { id: "demo-cli-2", name: "Петя Димитрова", phone: "0887 234 567", email: "petya@example.com", notes: null },
  { id: "demo-cli-3", name: "Красимира Илиева", phone: "0899 345 678", email: null, notes: "Алергия към амоняк." },
  { id: "demo-cli-4", name: "Николета Атанасова", phone: "0886 456 789", email: "nikoleta@example.com", notes: null },
  { id: "demo-cli-5", name: "Симона Тодорова", phone: "0885 567 890", email: null, notes: "Идва винаги с 10 мин закъснение." },
  { id: "demo-cli-6", name: "Габриела Радева", phone: "0898 678 901", email: "gabi@example.com", notes: null },
  { id: "demo-cli-7", name: "Виктория Колева", phone: "0897 789 012", email: null, notes: null },
  { id: "demo-cli-8", name: "Десислава Маринова", phone: "0896 890 123", email: "desi@example.com", notes: "Носи си собствен шампоан." },
];

const DEMO_CLIENTS: Client[] = CLIENT_SEEDS.map((c) => ({
  id: c.id,
  salon_slug: DEMO_SLUG,
  specialist_id: null,
  name: c.name,
  phone: c.phone,
  email: c.email,
  notes: c.notes,
  created_at: "2025-02-01T09:00:00.000Z",
}));

function makeBooking(params: {
  seq: number;
  date: string;
  time: string;
  client: ClientSeed;
  service: ServiceSeed;
  specialistId: string;
  status: Booking["status"];
  notes?: string | null;
}): Booking {
  const { seq, date, time, client, service, specialistId, status, notes = null } = params;
  return {
    id: `demo-bkg-${seq}`,
    created_at: `${date}T08:00:00.000Z`,
    salon_slug: DEMO_SLUG,
    specialist_id: specialistId,
    service_id: service.id,
    service_name: service.name,
    service_price_eur: service.price,
    service_duration: service.duration,
    booking_date: date,
    booking_time: time,
    booking_end_time: addMinutes(time, service.duration),
    client_name: client.name,
    client_phone: client.phone,
    client_email: client.email,
    status,
    confirmation_token: null,
    confirmed_at: status === "confirmed" || status === "completed" ? `${date}T08:05:00.000Z` : null,
    notes,
    hair_length: null,
    hair_density: null,
  };
}

/** Пълният демо салон, генериран спрямо днешната дата (Europe/Sofia). */
export function buildDemoState(): DemoState {
  const today = todayDateISOInSofia();
  const bookings: Booking[] = [];
  let seq = 1;

  // ── Днес: зает, но не претрупан ден ────────────────────────────────────────
  const todaySeeds: Array<[string, number, number, string, Booking["status"], string | null]> = [
    ["09:00", 0, 0, "demo-spec-1", "completed", null],
    ["10:30", 4, 4, "demo-spec-2", "completed", null],
    ["12:00", 1, 1, "demo-spec-1", "confirmed", "Иска промяна на дължината."],
    ["14:30", 5, 5, "demo-spec-2", "confirmed", null],
    ["16:00", 2, 3, "demo-spec-1", "pending", null],
  ];
  for (const [time, clientIdx, serviceIdx, specialistId, status, notes] of todaySeeds) {
    bookings.push(
      makeBooking({
        seq: seq++,
        date: today,
        time,
        client: CLIENT_SEEDS[clientIdx],
        service: SERVICE_SEEDS[serviceIdx],
        specialistId,
        status,
        notes,
      }),
    );
  }

  // ── Следващите 6 дни: за седмичния и месечния изглед ───────────────────────
  const upcoming: Array<[number, string, number, number, string]> = [
    [1, "10:00", 6, 0, "demo-spec-1"],
    [1, "13:00", 7, 1, "demo-spec-2"],
    [2, "11:00", 3, 4, "demo-spec-2"],
    [2, "15:30", 0, 3, "demo-spec-1"],
    [3, "09:30", 5, 5, "demo-spec-2"],
    [4, "12:30", 2, 2, "demo-spec-1"],
    [5, "10:00", 1, 0, "demo-spec-1"],
    [6, "14:00", 4, 4, "demo-spec-2"],
  ];
  for (const [offset, time, clientIdx, serviceIdx, specialistId] of upcoming) {
    bookings.push(
      makeBooking({
        seq: seq++,
        date: addCalendarDaysInSofia(today, offset),
        time,
        client: CLIENT_SEEDS[clientIdx],
        service: SERVICE_SEEDS[serviceIdx],
        specialistId,
        status: "confirmed",
      }),
    );
  }

  // ── История: 90 дни назад, за да имат Клиенти и Калкулатор какво да покажат ─
  for (let dayBack = 1; dayBack <= 90; dayBack += 1) {
    const date = addCalendarDaysInSofia(today, -dayBack);
    const dow = new Date(`${date}T12:00:00`).getDay();
    if (dow === 0) continue; // неделя — почивен ден

    // Натовареност на работещ салон. Калкулаторът мери оборота от началото на
    // месеца срещу ПЪЛНИТЕ месечни разходи — при рядък график демо салонът
    // излиза на загуба още в средата на месеца.
    const perDay = dow === 6 ? 4 : 6;
    for (let i = 0; i < perDay; i += 1) {
      const pick = (dayBack * 7 + i * 3) % CLIENT_SEEDS.length;
      const svc = (dayBack * 5 + i * 2) % SERVICE_SEEDS.length;
      const hour = 9 + i * 2; // 09:00 … 19:00 — вътре в работното време
      // Един „не се яви“ на всеки ~11 дни — за да не е всичко идеално.
      const status: Booking["status"] = dayBack % 11 === 0 && i === 1 ? "no_show" : "completed";
      bookings.push(
        makeBooking({
          seq: seq++,
          date,
          time: `${String(hour).padStart(2, "0")}:00`,
          client: CLIENT_SEEDS[pick],
          service: SERVICE_SEEDS[svc],
          specialistId: i % 2 === 0 ? "demo-spec-1" : "demo-spec-2",
          status,
        }),
      );
    }
  }

  // ── Разходи: последните 3 месеца ──────────────────────────────────────────
  const expenseSeeds: Array<[number, string, number, string]> = [
    [3, "🧴 Материали", 180, "Бои и оксиданти"],
    [9, "📢 Реклама", 60, "Instagram кампания"],
    [16, "☕ Хигиена", 35, "Кърпи и препарати"],
    [24, "🧴 Материали", 120, "Шампоани и маски"],
    [33, "✂️ Инструменти", 95, "Нова машинка"],
    [41, "🎓 Обучения", 150, "Курс по балеаж"],
    [52, "🧴 Материали", 200, "Зареждане на склада"],
    [63, "📢 Реклама", 80, "Google Ads"],
    [74, "🔹 Други", 45, "Абонамент за музика"],
  ];
  const expenses: DemoExpense[] = expenseSeeds.map(([dayBack, category, amount, note], i) => ({
    id: `demo-exp-${i + 1}`,
    salon_slug: DEMO_SLUG,
    date: addCalendarDaysInSofia(today, -dayBack),
    amount,
    // Категорията е префикс на описанието — точно както я записва админът.
    description: `${category} — ${note}`,
    supplier: null,
  }));

  const financialSettings: FinancialSettings = {
    id: "demo-fin",
    salon_slug: DEMO_SLUG,
    monthly_expenses: 0,
    desired_salary: 1200,
    rent_eur: 600,
    electricity_eur: 120,
    water_eur: 40,
    accounting_eur: 80,
    monthly_revenue_goal_eur: 4000,
    working_days_per_week: 6,
    working_hours_per_day: 8,
    vat_enabled: false,
    booking_window_days: 30,
    buffer_minutes: 10,
    magnetic_scheduling: true,
    booking_min_notice_minutes: 30,
  };

  return {
    tenant: { ...DEMO_TENANT },
    services: DEMO_SERVICES.map((s) => ({ ...s })),
    specialists: DEMO_SPECIALISTS.map((s) => ({ ...s })),
    workingHours: DEMO_WORKING_HOURS.map((w) => ({ ...w })),
    clients: DEMO_CLIENTS.map((c) => ({ ...c })),
    bookings,
    blockedSlots: [],
    expenses,
    financialSettings,
  };
}
