export const dynamic = "force-dynamic";
import type { SalonData } from "@/types/database";
import { Luxe } from "@/components/templates/Luxe";

const mockData: SalonData = {
  tenant: {
    id: "demo-luxe",
    salon_slug: "demo-luxe",
    salon_name: "Студио Елит",
    plan: "pro",
    status: "active",
    start_date: "2026-01-01",
    payment_type: null,
    stripe_customer_id: null,
    stripe_subscription_id: null,
    domain: null,
    template: "luxe",
    primary_color: "#c9a84c",
    font: null,
    facebook_pixel_id: null,
    capi_token: null,
    clarity_id: null,
    gtm_id: null,
    phone: "+359 888 000 000",
    address: "бул. Витоша 42, гр. София",
    description: "Персонализирана грижа за красота на най-високо ниво. Всяка клиентка е уникална — и нейното преживяване трябва да бъде също.",
    instagram_url: null,
    facebook_url: null,
    created_at: null,
    hero_title: "Красота,",
    hero_subtitle: "която говори",
    logo_url: null,
    hero_image_url: null,
    about_text1: "С над 12 години опит в луксозни салони в София, ние сме специалисти по антиейдж процедури, персонализирани ритуали за лице и цялостна трансформация.",
    about_text2: "Всяка клиентка преминава през задълбочена консултация, след което програмата се изгражда индивидуално — защото универсалните решения не съществуват.",
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
    { id: "1", salon_slug: "demo-luxe", specialist_id: null, name: "Антиейдж терапия", price_eur: 76, duration_minutes: 120, is_complex: false, active_start_min: null, active_start_max: null, waiting_min: null, waiting_max: null, active_finish_min: null, active_finish_max: null, is_active: true, created_at: null },
    { id: "2", salon_slug: "demo-luxe", specialist_id: null, name: "Почистване на лице", price_eur: 40, duration_minutes: 60, is_complex: false, active_start_min: null, active_start_max: null, waiting_min: null, waiting_max: null, active_finish_min: null, active_finish_max: null, is_active: true, created_at: null },
    { id: "3", salon_slug: "demo-luxe", specialist_id: null, name: "Перманентен грим", price_eur: 92, duration_minutes: 180, is_complex: false, active_start_min: null, active_start_max: null, waiting_min: null, waiting_max: null, active_finish_min: null, active_finish_max: null, is_active: true, created_at: null },
    { id: "4", salon_slug: "demo-luxe", specialist_id: null, name: "Масаж на лице", price_eur: 38, duration_minutes: 60, is_complex: false, active_start_min: null, active_start_max: null, waiting_min: null, waiting_max: null, active_finish_min: null, active_finish_max: null, is_active: true, created_at: null },
    { id: "5", salon_slug: "demo-luxe", specialist_id: null, name: "Грижа за тяло", price_eur: 56, duration_minutes: 90, is_complex: false, active_start_min: null, active_start_max: null, waiting_min: null, waiting_max: null, active_finish_min: null, active_finish_max: null, is_active: true, created_at: null },
    { id: "6", salon_slug: "demo-luxe", specialist_id: null, name: "Консултация", price_eur: 15, duration_minutes: 45, is_complex: false, active_start_min: null, active_start_max: null, waiting_min: null, waiting_max: null, active_finish_min: null, active_finish_max: null, is_active: true, created_at: null },
  ],
  gallery: [],
  workingHours: [
    { id: "1", salon_slug: "demo-luxe", specialist_id: null, day_of_week: 1, start_time: "10:00", end_time: "19:00", is_day_off: false },
    { id: "2", salon_slug: "demo-luxe", specialist_id: null, day_of_week: 2, start_time: "10:00", end_time: "19:00", is_day_off: false },
    { id: "3", salon_slug: "demo-luxe", specialist_id: null, day_of_week: 3, start_time: "10:00", end_time: "19:00", is_day_off: false },
    { id: "4", salon_slug: "demo-luxe", specialist_id: null, day_of_week: 4, start_time: "10:00", end_time: "19:00", is_day_off: false },
    { id: "5", salon_slug: "demo-luxe", specialist_id: null, day_of_week: 5, start_time: "10:00", end_time: "19:00", is_day_off: false },
    { id: "6", salon_slug: "demo-luxe", specialist_id: null, day_of_week: 6, start_time: "10:00", end_time: "17:00", is_day_off: false },
    { id: "7", salon_slug: "demo-luxe", specialist_id: null, day_of_week: 0, start_time: "00:00", end_time: "00:00", is_day_off: true },
  ],
  specialists: [],
};

export default function DemoLuxePage() {
  return <Luxe data={mockData} />;
}
