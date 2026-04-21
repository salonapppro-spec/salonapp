export const dynamic = "force-dynamic";
import type { SalonData } from "@/types/database";
import { Zen } from "@/components/templates/Zen";

const mockData: SalonData = {
  tenant: {
    id: "demo-zen",
    salon_slug: "demo/zen",
    salon_name: "Зен Студио",
    plan: "pro",
    status: "active",
    start_date: "2026-01-01",
    payment_type: null,
    stripe_customer_id: null,
    stripe_subscription_id: null,
    background_color: null,
    domain: null,
    template: "zen",
    primary_color: "#4A6741",
    font: null,
    facebook_pixel_id: null,
    capi_token: null,
    clarity_id: null,
    gtm_id: null,
    phone: "+359 888 000 000",
    address: "ул. Шипченски проход 22, гр. София",
    description: "Намерете баланс и спокойствие. Персонализирани масажи и уелнес ритуали за тяло и душа.",
    instagram_url: null,
    facebook_url: null,
    created_at: null,
    hero_title: "Намери своя",
    hero_subtitle: "вътрешен баланс",
    logo_url: null,
    hero_image_url: null,
    about_text1: "Зен Студио е sanctuary за тези, които търсят истинска почивка. Нашите терапевти са сертифицирани специалисти с международна квалификация.",
    about_text2: "Всяка сесия е индивидуално адаптирана — защото вашето тяло и нужди са уникални. Използваме само натурални продукти и проверени техники.",
    about_image_url: null,
    email: "hello@zenstudio.bg",
    tiktok_url: null,
    google_maps_embed: null,
    owner_email: null,
    owner_phone: null,
    expiry_date: null,
    grace_until_date: null,
  },
  services: [
    { id: "1", salon_slug: "demo-zen", specialist_id: null, name: "Релаксиращ масаж", price_eur: 38, duration_minutes: 60, is_complex: false, active_start_min: null, active_start_max: null, waiting_min: null, waiting_max: null, active_finish_min: null, active_finish_max: null, is_active: true, created_at: null },
    { id: "2", salon_slug: "demo-zen", specialist_id: null, name: "Дълбокотъканен масаж", price_eur: 46, duration_minutes: 60, is_complex: false, active_start_min: null, active_start_max: null, waiting_min: null, waiting_max: null, active_finish_min: null, active_finish_max: null, is_active: true, created_at: null },
    { id: "3", salon_slug: "demo-zen", specialist_id: null, name: "Арома терапия", price_eur: 51, duration_minutes: 75, is_complex: false, active_start_min: null, active_start_max: null, waiting_min: null, waiting_max: null, active_finish_min: null, active_finish_max: null, is_active: true, created_at: null },
    { id: "4", salon_slug: "demo-zen", specialist_id: null, name: "Хот стоун терапия", price_eur: 61, duration_minutes: 90, is_complex: false, active_start_min: null, active_start_max: null, waiting_min: null, waiting_max: null, active_finish_min: null, active_finish_max: null, is_active: true, created_at: null },
    { id: "5", salon_slug: "demo-zen", specialist_id: null, name: "Лимфодренажен масаж", price_eur: 46, duration_minutes: 60, is_complex: false, active_start_min: null, active_start_max: null, waiting_min: null, waiting_max: null, active_finish_min: null, active_finish_max: null, is_active: true, created_at: null },
    { id: "6", salon_slug: "demo-zen", specialist_id: null, name: "Body Ritual (пакет)", price_eur: 92, duration_minutes: 120, is_complex: false, active_start_min: null, active_start_max: null, waiting_min: null, waiting_max: null, active_finish_min: null, active_finish_max: null, is_active: true, created_at: null },
  ],
  gallery: [],
  workingHours: [
    { id: "1", salon_slug: "demo-zen", specialist_id: null, day_of_week: 1, start_time: "10:00", end_time: "19:00", is_day_off: false },
    { id: "2", salon_slug: "demo-zen", specialist_id: null, day_of_week: 2, start_time: "10:00", end_time: "19:00", is_day_off: false },
    { id: "3", salon_slug: "demo-zen", specialist_id: null, day_of_week: 3, start_time: "10:00", end_time: "19:00", is_day_off: false },
    { id: "4", salon_slug: "demo-zen", specialist_id: null, day_of_week: 4, start_time: "10:00", end_time: "19:00", is_day_off: false },
    { id: "5", salon_slug: "demo-zen", specialist_id: null, day_of_week: 5, start_time: "10:00", end_time: "19:00", is_day_off: false },
    { id: "6", salon_slug: "demo-zen", specialist_id: null, day_of_week: 6, start_time: "10:00", end_time: "17:00", is_day_off: false },
    { id: "7", salon_slug: "demo-zen", specialist_id: null, day_of_week: 0, start_time: "00:00", end_time: "00:00", is_day_off: true },
  ],
  specialists: [],
};

export default function DemoZenPage() {
  return <Zen data={mockData} />;
}
