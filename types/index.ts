/**
 * Типове за приложението. Канон от MASTER: `database.ts`.
 * Booking hair полета — фактически стойности в Postgres (BG) до унификация с EN.
 */

export type {
  Plan,
  TenantStatus,
  BookingStatus,
  Template,
  PaymentType,
  FinancialSettings,
  Specialist,
  TimeSlot,
  SalonData,
} from "./database";

/** Статус на тенант — alias за по-кратък импорт в кода. */
export type Status = import("./database").TenantStatus;

/** Стойности в Postgres CHECK (MASTER) — UI може да показва BG етикети. */
export type HairLength = "short" | "medium" | "long";
export type HairDensity = "thin" | "medium" | "thick";

export interface Tenant {
  id: string;
  salon_slug: string;
  salon_name: string;
  plan: import("./database").Plan;
  status: import("./database").TenantStatus;
  start_date: string;
  payment_type: "stripe" | "bank" | null;
  stripe_customer_id: string | null;
  stripe_subscription_id?: string | null;
  domain: string | null;
  template: import("./database").Template;
  primary_color: string | null;
  font: string | null;
  /** Лого в хедъра на публичния сайт (https URL). */
  logo_url?: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_image_url?: string | null;
  description: string | null;
  about_text1: string | null;
  about_text2: string | null;
  about_image_url?: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  google_maps_embed: string | null;
  facebook_pixel_id: string | null;
  capi_token: string | null;
  clarity_id: string | null;
  gtm_id: string | null;
  owner_email: string | null;
  owner_phone: string | null;
  expiry_date?: string | null;
  grace_until_date?: string | null;
  created_at: string | null;
}

export interface Booking {
  id: string;
  created_at: string | null;
  salon_slug: string;
  specialist_id: string | null;
  service_id: string | null;
  service_name: string;
  service_price_eur: number;
  service_duration: number;
  booking_date: string;
  booking_time: string;
  booking_end_time: string | null;
  client_name: string;
  client_phone: string | null;
  client_email: string | null;
  status: import("./database").BookingStatus;
  confirmation_token: string | null;
  confirmed_at: string | null;
  notes: string | null;
  hair_length: HairLength | null;
  hair_density: HairDensity | null;
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

export interface Client {
  id: string;
  salon_slug: string;
  specialist_id: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_at: string | null;
}

export interface BlockedSlot {
  id: string;
  salon_slug: string;
  specialist_id: string | null;
  blocked_date: string;
  start_time: string;
  end_time: string;
  reason: string | null;
  created_at: string | null;
}

import type { WorkingHours as WorkingHoursRow } from "./database";

/** Ред от `working_hours` (ден 0–6 като в Postgres). */
export type WorkingHours = Omit<WorkingHoursRow, "day_of_week"> & { day_of_week: number };

export interface GalleryItem {
  id: string;
  salon_slug: string;
  specialist_id: string | null;
  url: string;
  order_index: number;
  is_visible: boolean;
  created_at: string | null;
}
