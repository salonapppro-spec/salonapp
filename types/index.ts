export type Plan = "standard" | "pro" | "premium" | "collective";
export type Status = "trial" | "active" | "inactive";
export type Template = "bloom" | "luxe" | "clean" | "zen" | "bold";
export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
export type HairLength = "къса" | "средна" | "дълга";
export type HairDensity = "рядка" | "средна" | "гъста";

export interface Tenant {
  id: string;
  salon_slug: string;
  salon_name: string;
  plan: Plan;
  status: Status;
  start_date: string;
  payment_type: "stripe" | "bank" | null;
  stripe_customer_id: string | null;
  domain: string | null;
  template: Template;
  primary_color: string | null;
  font: string | null;
  facebook_pixel_id: string | null;
  capi_token: string | null;
  clarity_id: string | null;
  gtm_id: string | null;
  owner_email: string | null;
  owner_phone: string | null;
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
  client_name: string;
  client_phone: string | null;
  client_email: string | null;
  status: BookingStatus;
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

export interface FinancialSettings {
  id: string;
  salon_slug: string;
  monthly_expenses: number;
  desired_salary: number;
  working_days_per_week: number;
  working_hours_per_day: number;
  vat_enabled: boolean;
  booking_window_days: number;
  buffer_minutes: number;
  magnetic_scheduling: boolean;
}

export interface WorkingHours {
  id: string;
  salon_slug: string;
  specialist_id: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_day_off: boolean;
}

export interface GalleryItem {
  id: string;
  salon_slug: string;
  specialist_id: string | null;
  url: string;
  sort_order: number;
  is_visible: boolean;
  created_at: string | null;
}

