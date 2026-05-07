import { unstable_cache } from "next/cache";
import type { Client, GalleryItem, Service, Specialist, Tenant, WorkingHours, BlockedSlot, Booking } from "@/types";
import type { FinancialSettings, SalonData } from "@/types/database";
import { getTenant } from "@/lib/get-tenant";
import { tenantDb } from "@/lib/tenant-db";
import { DEFAULT_WORKING_HOURS_DAYS } from "@/lib/working-hours-defaults";

export async function getTenantBySalonSlug(salonSlug: string): Promise<Tenant | null> {
  return getTenant(salonSlug);
}

export async function getServices(salonSlug: string): Promise<Service[]> {
  const { data, error } = await tenantDb(salonSlug).services.listActive();
  if (error) throw error;
  return (data as Service[]) ?? [];
}

export async function getAllServicesAdmin(salonSlug: string): Promise<Service[]> {
  const { data, error } = await tenantDb(salonSlug).services.listAll();
  if (error) throw error;
  return (data as Service[]) ?? [];
}

export async function getClientsAdmin(salonSlug: string, search?: string): Promise<Client[]> {
  const { data, error } = await tenantDb(salonSlug).clients.list(search);
  if (error) throw error;
  return (data as Client[]) ?? [];
}

export async function getGalleryAdmin(salonSlug: string): Promise<GalleryItem[]> {
  const { data, error } = await tenantDb(salonSlug).gallery.listAll();
  if (error) throw error;
  return (data as GalleryItem[]) ?? [];
}

export async function getTodayRevenueEur(salonSlug: string, date: string): Promise<number> {
  const { data, error } = await tenantDb(salonSlug).bookings.listCompletedRevenue(date, date);
  if (error) throw error;
  return (data ?? []).reduce((sum: number, row: { service_price_eur: number }) => sum + Number(row.service_price_eur), 0);
}

export async function getExpensesForMonth(salonSlug: string, year: number, month: number) {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const next = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const { data, error } = await tenantDb(salonSlug).expenses.listByMonth(start, next);
  if (error) throw error;
  return data ?? [];
}

export async function getGallery(salonSlug: string): Promise<GalleryItem[]> {
  const { data, error } = await tenantDb(salonSlug).gallery.listVisible();
  if (error) throw error;
  return (data as GalleryItem[]) ?? [];
}

function withFinancialDefaults(row: Record<string, unknown> | null): FinancialSettings | null {
  if (!row) return null;
  return {
    ...(row as object),
    rent_eur: Number(row.rent_eur ?? 0),
    electricity_eur: Number(row.electricity_eur ?? 0),
    water_eur: Number(row.water_eur ?? 0),
    accounting_eur: Number(row.accounting_eur ?? 0),
    monthly_revenue_goal_eur: Number(row.monthly_revenue_goal_eur ?? 0),
  } as FinancialSettings;
}

export async function getFinancialSettings(salonSlug: string) {
  const { data, error } = await tenantDb(salonSlug).financialSettings.getOne();
  if (error) throw error;
  return withFinancialDefaults(data as Record<string, unknown> | null);
}

/** UI fallback преди първи запис в `financial_settings` (upsert по salon_slug). */
export function financialSettingsForUi(salonSlug: string, row: FinancialSettings | null): FinancialSettings {
  if (row) return row;
  return {
    id: "",
    salon_slug: salonSlug,
    monthly_expenses: 0,
    desired_salary: 0,
    rent_eur: 0,
    electricity_eur: 0,
    water_eur: 0,
    accounting_eur: 0,
    monthly_revenue_goal_eur: 0,
    working_days_per_week: 5,
    working_hours_per_day: 8,
    vat_enabled: false,
    booking_window_days: 30,
    buffer_minutes: 10,
    magnetic_scheduling: true,
  };
}

/** Оборот (completed) за период [from,to] по дати. */
export async function getCompletedRevenueBetween(
  salonSlug: string,
  from: string,
  to: string,
  specialistId?: string | null
): Promise<number> {
  const q = tenantDb(salonSlug).bookings.listCompletedRevenue(from, to, specialistId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).reduce((s: number, row: { service_price_eur: number }) => s + Number(row.service_price_eur), 0);
}

export async function getCompletedBookingAmountsInRange(
  salonSlug: string,
  from: string,
  to: string,
  specialistId?: string | null
): Promise<Array<{ booking_date: string; service_price_eur: number }>> {
  const q = tenantDb(salonSlug).bookings.listCompletedAmounts(from, to, specialistId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Array<{ booking_date: string; service_price_eur: number }>;
}

export async function getExpensesBetween(
  salonSlug: string,
  from: string,
  to: string
): Promise<Array<{ id: string; date: string; amount: number; description: string; supplier: string | null }>> {
  const { data, error } = await tenantDb(salonSlug).expenses.listByRange(from, to);
  if (error) throw error;
  return (data ?? []) as Array<{ id: string; date: string; amount: number; description: string; supplier: string | null }>;
}

export async function getWorkingHoursForDate(params: {
  salonSlug: string;
  specialistId?: string;
  dayOfWeek: number; // 0-6
}): Promise<WorkingHours | null> {
  const { salonSlug, specialistId, dayOfWeek } = params;
  const { data, error } = await tenantDb(salonSlug).workingHours.getForDay(dayOfWeek, specialistId);
  if (error) throw error;
  return (data as WorkingHours | null) ?? null;
}

export async function getBookingsForDate(params: {
  salonSlug: string;
  specialistId?: string;
  date: string; // YYYY-MM-DD
}): Promise<Booking[]> {
  const { salonSlug, specialistId, date } = params;
  const { data, error } = await tenantDb(salonSlug).bookings.listByDate(date, specialistId);
  if (error) throw error;
  return (data as Booking[]) ?? [];
}

export async function getBookingsForDates(params: {
  salonSlug: string;
  specialistId?: string;
  dates: string[];
}): Promise<Booking[]> {
  const { salonSlug, specialistId, dates } = params;
  if (dates.length === 0) return [];
  const { data, error } = await tenantDb(salonSlug).bookings.listByDates(dates, specialistId);
  if (error) throw error;
  return (data as Booking[]) ?? [];
}

/** Админ: всички статуси за деня. */
export async function getBookingsForDateAdmin(params: {
  salonSlug: string;
  specialistId?: string;
  date: string;
}): Promise<Booking[]> {
  const { salonSlug, specialistId, date } = params;
  const { data, error } = await tenantDb(salonSlug).bookings.listByDateAdmin(date, specialistId);
  if (error) throw error;
  return (data as Booking[]) ?? [];
}

export async function getBookingsForDatesAdmin(params: {
  salonSlug: string;
  specialistId?: string;
  dates: string[];
}): Promise<Booking[]> {
  const { salonSlug, specialistId, dates } = params;
  if (dates.length === 0) return [];
  const { data, error } = await tenantDb(salonSlug).bookings.listByDatesAdmin(dates, specialistId);
  if (error) throw error;
  return (data as Booking[]) ?? [];
}

export async function getBlockedSlotsForDate(params: {
  salonSlug: string;
  specialistId?: string;
  date: string; // YYYY-MM-DD
}): Promise<BlockedSlot[]> {
  const { salonSlug, specialistId, date } = params;
  const { data, error } = await tenantDb(salonSlug).blockedSlots.listForPublicDate(date, specialistId);
  if (error) throw error;
  return (data as BlockedSlot[]) ?? [];
}

/** 7 entries, index = day_of_week (0=Sun). Merges DB rows for salon (no specialist) with defaults. */
export async function getWorkingHoursWeekMerged(salonSlug: string): Promise<
  Array<{ start_time: string; end_time: string; is_day_off: boolean }>
> {
  const { data, error } = await tenantDb(salonSlug).workingHours.listSalonDefaultWeek();
  if (error) throw error;
  const rows = (data as WorkingHours[]) ?? [];
  const byDay = new Map<number, WorkingHours>(rows.map((r) => [r.day_of_week, r]));
  return DEFAULT_WORKING_HOURS_DAYS.map((def, i) => {
    const row = byDay.get(i);
    if (!row) return { ...def };
    return {
      start_time: row.start_time,
      end_time: row.end_time,
      is_day_off: row.is_day_off,
    };
  });
}

export async function replaceWorkingHoursSalonDefault(
  salonSlug: string,
  days: Array<{ start_time: string; end_time: string; is_day_off: boolean }>
): Promise<void> {
  const { error: delErr } = await tenantDb(salonSlug).workingHours.deleteSalonDefaultWeek();
  if (delErr) throw delErr;

  const insertRows = days.map((d, day_of_week) => ({
    salon_slug: salonSlug,
    specialist_id: null as string | null,
    day_of_week,
    start_time: d.start_time,
    end_time: d.end_time,
    is_day_off: d.is_day_off,
  }));

  const { error: insErr } = await tenantDb(salonSlug).workingHours.insertRows(insertRows);
  if (insErr) throw insErr;
}

/** Активни специалисти за публични страници. */
export async function getSpecialistsPublic(salonSlug: string): Promise<Specialist[]> {
  const { data, error } = await tenantDb(salonSlug).specialists.listActive();
  if (error) {
    // Някои среди са инициализирани без таблица specialists.
    if ((error as { code?: string }).code === "PGRST205") return [];
    throw error;
  }
  return (data as Specialist[]) ?? [];
}

/** Специалисти за админ панела (всички, включително неактивни). */
export async function getSpecialistsAdmin(salonSlug: string): Promise<Specialist[]> {
  const { data, error } = await tenantDb(salonSlug).specialists.listAll();
  if (error) {
    if ((error as { code?: string }).code === "PGRST205") return [];
    throw error;
  }
  return (data as Specialist[]) ?? [];
}

/** Работно време на салона (без per-specialist), 7 реда 0–6. */
export async function getSalonWorkingHoursPublic(salonSlug: string): Promise<WorkingHours[]> {
  const { data, error } = await tenantDb(salonSlug).workingHours.listSalonDefaultWeek();
  if (error) throw error;
  const rows = (data as WorkingHours[]) ?? [];
  const byDay = new Map(rows.map((r) => [r.day_of_week, r]));
  const out: WorkingHours[] = [];
  for (let d = 0; d < 7; d++) {
    const existing = byDay.get(d as WorkingHours["day_of_week"]);
    if (existing) {
      out.push(existing);
    } else {
      const def = DEFAULT_WORKING_HOURS_DAYS[d];
      out.push({
        id: `default-${salonSlug}-${d}`,
        salon_slug: salonSlug,
        specialist_id: null,
        day_of_week: d as WorkingHours["day_of_week"],
        start_time: def.start_time,
        end_time: def.end_time,
        is_day_off: def.is_day_off,
      });
    }
  }
  return out;
}

/** Пълен пакет за публична страница на салон. */
async function _loadPublicSalonData(salonSlug: string): Promise<SalonData | null> {
  const tenant = await getTenant(salonSlug);
  if (!tenant) return null;
  const [services, gallery, workingHours, specialists] = await Promise.all([
    getServices(salonSlug),
    getGallery(salonSlug),
    getSalonWorkingHoursPublic(salonSlug),
    getSpecialistsPublic(salonSlug),
  ]);
  return {
    tenant,
    services,
    gallery: gallery.map((g) => ({ id: g.id, url: g.url, order_index: g.order_index })),
    workingHours,
    specialists,
  } as SalonData;
}

/**
 * Публичните данни на салона — кешират се 5 минути (300 s).
 * Анулират се с revalidateTag(`tenant-${salonSlug}`) при запазване от админ.
 */
export function loadPublicSalonData(salonSlug: string): Promise<SalonData | null> {
  return unstable_cache(
    () => _loadPublicSalonData(salonSlug),
    [`public-salon-data-${salonSlug}`],
    { revalidate: 300, tags: [`tenant-${salonSlug}`] },
  )();
}

/** Търсене на клиент по телефон (service role). */
export async function getClientByIdAdmin(salonSlug: string, id: string): Promise<Client | null> {
  const { data, error } = await tenantDb(salonSlug).clients.getById(id);
  if (error) throw error;
  return (data as Client | null) ?? null;
}

export async function getBookingsForClientPhoneAdmin(salonSlug: string, phone: string): Promise<Booking[]> {
  const normalized = phone.trim();
  if (!normalized) return [];
  const { data, error } = await tenantDb(salonSlug).bookings.listByClientPhone(normalized);
  if (error) throw error;
  return (data as Booking[]) ?? [];
}

export async function lookupClientByPhone(salonSlug: string, phone: string): Promise<{ name: string | null; email: string | null }> {
  const normalized = phone.trim();
  if (!normalized) return { name: null, email: null };
  const { data, error } = await tenantDb(salonSlug).clients.lookupByPhone(normalized);
  if (error || !data) return { name: null, email: null };
  const row = data as { name: string; email: string | null };
  return { name: row.name ?? null, email: row.email ?? null };
}

