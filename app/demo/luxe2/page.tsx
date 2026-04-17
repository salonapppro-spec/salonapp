export const dynamic = "force-dynamic";
import type { SalonData } from "@/types/database";
import { Luxe2 } from "@/components/templates/Luxe2";

const mockData: SalonData = {
  tenant: {
    id: "demo-luxe2",
    salon_slug: "demo/luxe2",
    salon_name: "Студио Елит",
    plan: "pro",
    status: "active",
    start_date: "2026-01-01",
    payment_type: null,
    stripe_customer_id: null,
    stripe_subscription_id: null,
    domain: null,
    template: "luxe2",
    primary_color: "#B8973A",
    font: null,
    facebook_pixel_id: null,
    capi_token: null,
    clarity_id: null,
    gtm_id: null,
    phone: "+359 888 000 000",
    address: "бул. Витоша 42, гр. София",
    description: "Премиум фризьорски услуги — боядисване, кичури, кератин, прически за повод. Персонализирана грижа с внимание към всеки детайл.",
    instagram_url: null,
    facebook_url: null,
    created_at: null,
    hero_title: "Коса, която",
    hero_subtitle: "говори",
    logo_url: null,
    hero_image_url: null,
    about_text1: "Фризьор с над 8 години опит в луксозни салони. Специализираме в цветови техники — балеаж, омбре, airtouch — и в трансформации, които отразяват личността на всяка клиентка.",
    about_text2: "Всяко посещение започва с консултация. Защото правилната услуга зависи от вашата коса, начин на живот и желан резултат — не от тренд.",
    about_image_url: null,
    email: "hello@studioelite.bg",
    tiktok_url: null,
    google_maps_embed: null,
    owner_email: null,
    owner_phone: null,
    expiry_date: null,
    grace_until_date: null,
  },
  services: [
    { id: "1", salon_slug: "demo-luxe2", specialist_id: null, name: "Мъжко подстригване", price_eur: 25, duration_minutes: 30, is_complex: false, active_start_min: null, active_start_max: null, waiting_min: null, waiting_max: null, active_finish_min: null, active_finish_max: null, is_active: true, created_at: null },
    { id: "2", salon_slug: "demo-luxe2", specialist_id: null, name: "Дамско подстригване", price_eur: 40, duration_minutes: 60, is_complex: false, active_start_min: null, active_start_max: null, waiting_min: null, waiting_max: null, active_finish_min: null, active_finish_max: null, is_active: true, created_at: null },
    { id: "3", salon_slug: "demo-luxe2", specialist_id: null, name: "Боядисване", price_eur: 65, duration_minutes: 90, is_complex: false, active_start_min: null, active_start_max: null, waiting_min: null, waiting_max: null, active_finish_min: null, active_finish_max: null, is_active: true, created_at: null },
    { id: "4", salon_slug: "demo-luxe2", specialist_id: null, name: "Кичури / Highlights", price_eur: 90, duration_minutes: 120, is_complex: false, active_start_min: null, active_start_max: null, waiting_min: null, waiting_max: null, active_finish_min: null, active_finish_max: null, is_active: true, created_at: null },
    { id: "5", salon_slug: "demo-luxe2", specialist_id: null, name: "Кератинова терапия", price_eur: 120, duration_minutes: 180, is_complex: false, active_start_min: null, active_start_max: null, waiting_min: null, waiting_max: null, active_finish_min: null, active_finish_max: null, is_active: true, created_at: null },
    { id: "6", salon_slug: "demo-luxe2", specialist_id: null, name: "Прическа за повод", price_eur: 80, duration_minutes: 90, is_complex: false, active_start_min: null, active_start_max: null, waiting_min: null, waiting_max: null, active_finish_min: null, active_finish_max: null, is_active: true, created_at: null },
    { id: "7", salon_slug: "demo-luxe2", specialist_id: null, name: "Измиване + сушене", price_eur: 30, duration_minutes: 45, is_complex: false, active_start_min: null, active_start_max: null, waiting_min: null, waiting_max: null, active_finish_min: null, active_finish_max: null, is_active: true, created_at: null },
  ],
  gallery: [],
  workingHours: [
    { id: "1", salon_slug: "demo-luxe2", specialist_id: null, day_of_week: 1, start_time: "09:00", end_time: "19:00", is_day_off: false },
    { id: "2", salon_slug: "demo-luxe2", specialist_id: null, day_of_week: 2, start_time: "09:00", end_time: "19:00", is_day_off: false },
    { id: "3", salon_slug: "demo-luxe2", specialist_id: null, day_of_week: 3, start_time: "09:00", end_time: "19:00", is_day_off: false },
    { id: "4", salon_slug: "demo-luxe2", specialist_id: null, day_of_week: 4, start_time: "09:00", end_time: "19:00", is_day_off: false },
    { id: "5", salon_slug: "demo-luxe2", specialist_id: null, day_of_week: 5, start_time: "09:00", end_time: "19:00", is_day_off: false },
    { id: "6", salon_slug: "demo-luxe2", specialist_id: null, day_of_week: 6, start_time: "09:00", end_time: "17:00", is_day_off: false },
    { id: "7", salon_slug: "demo-luxe2", specialist_id: null, day_of_week: 0, start_time: "00:00", end_time: "00:00", is_day_off: true },
  ],
  specialists: [],
};

export default function DemoLuxe2Page() {
  return <Luxe2 data={mockData} />;
}
