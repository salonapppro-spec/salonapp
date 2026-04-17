/**
 * Канонични типове по SalonApp MASTER (Промпт 1).
 * Забележка: в Postgres `bookings.hair_*` в момента са с BG стойности — виж `types/index.ts` до миграция към EN.
 */

export type Plan = "standard" | "pro" | "premium" | "collective";
export type TenantStatus = "trial" | "active" | "inactive";
export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
export type Template = "bloom" | "luxe" | "luxe2" | "clean" | "zen" | "bold" | "groom";
export type PaymentType = "stripe" | "bank";
/** Целева схема (MASTER); БД може да ползва BG низове до миграция. */
export type HairLength = "short" | "medium" | "long";
export type HairDensity = "thin" | "medium" | "thick";

export interface Tenant {
  id: string;
  salon_slug: string;
  salon_name: string;
  plan: Plan;
  status: TenantStatus;
  start_date: string;
  payment_type: PaymentType | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  domain: string | null;
  template: Template;
  primary_color: string | null;
  font: string | null;
  facebook_pixel_id: string | null;
  capi_token: string | null;
  clarity_id: string | null;
  gtm_id: string | null;
  phone: string | null;
  address: string | null;
  description: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  created_at: string | null;
  /** Публични полета (разширение спрямо MASTER) */
  hero_title?: string | null;
  hero_subtitle?: string | null;
  /** Лого в хедъра на публичния сайт (https). */
  logo_url?: string | null;
  hero_image_url?: string | null;
  about_text1?: string | null;
  about_text2?: string | null;
  about_image_url?: string | null;
  email?: string | null;
  tiktok_url?: string | null;
  google_maps_embed?: string | null;
  owner_email?: string | null;
  owner_phone?: string | null;
  /** Край на текущия платен период. */
  expiry_date?: string | null;
  /** Гратисен срок след expiry (напр. +3 дни). */
  grace_until_date?: string | null;
}

export interface Service {
  id: string;
  salon_slug: string;
  specialist_id: string | null;
  name: string;
  price_eur: number;
  duration_minutes: number | null;
  is_complex: boolean;
  active_start_min: number | null;
  active_start_max: number | null;
  waiting_min: number | null;
  waiting_max: number | null;
  active_finish_min: number | null;
  active_finish_max: number | null;
  is_active: boolean;
  created_at: string | null;
}

export interface Booking {
  id: string;
  salon_slug: string;
  specialist_id: string | null;
  service_id: string | null;
  service_name: string;
  service_price_eur: number;
  service_duration: number;
  booking_date: string;
  booking_time: string;
  booking_end_time: string;
  client_name: string;
  client_phone: string;
  client_email: string | null;
  status: BookingStatus;
  confirmation_token: string;
  confirmed_at: string | null;
  notes: string | null;
  hair_length: HairLength | null;
  hair_density: HairDensity | null;
  created_at: string | null;
}

export interface Client {
  id: string;
  salon_slug: string;
  specialist_id: string | null;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  created_at: string | null;
}

export interface Specialist {
  id: string;
  salon_slug: string;
  name: string;
  role: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_active: boolean;
  is_technical_admin: boolean;
  /** Колектив: опция за SMS напомняния за този специалист (миграция 004). */
  sms_reminders_enabled?: boolean;
  created_at: string | null;
}

export type EmailLogType = "confirmation" | "reminder";
export type EmailLogStatus = "sent" | "failed";

export interface EmailLog {
  id: string;
  salon_slug: string;
  booking_id: string | null;
  type: EmailLogType;
  sent_at: string;
  status: EmailLogStatus;
}

export interface WorkingHours {
  id: string;
  salon_slug: string;
  specialist_id: string | null;
  day_of_week: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  start_time: string;
  end_time: string;
  is_day_off: boolean;
}

export interface FinancialSettings {
  id: string;
  salon_slug: string;
  monthly_expenses: number;
  desired_salary: number;
  /** Постоянни разходи по категории (EUR). */
  rent_eur: number;
  electricity_eur: number;
  water_eur: number;
  accounting_eur: number;
  /** Цел за месечен оборот (completed) — за индикатор. */
  monthly_revenue_goal_eur: number;
  working_days_per_week: number;
  working_hours_per_day: number;
  vat_enabled: boolean;
  booking_window_days: number;
  buffer_minutes: number;
  magnetic_scheduling: boolean;
}

export interface TimeSlot {
  time: string;
  endTime: string;
  magnetic: boolean;
  available: boolean;
}

export interface SalonData {
  tenant: Tenant;
  services: Service[];
  gallery: { id: string; url: string; order_index: number }[];
  workingHours: WorkingHours[];
  specialists?: Specialist[];
}
