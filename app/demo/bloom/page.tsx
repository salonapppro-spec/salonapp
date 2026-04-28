export const dynamic = "force-dynamic";
import type { CSSProperties } from "react";
import type { SalonData } from "@/types/database";
import { Bloom } from "@/components/templates/Bloom";

const mockData: SalonData = {
  tenant: {
    id: "demo-bloom",
    salon_slug: "demo/bloom",
    salon_name: "Студио Шаблон",
    plan: "pro",
    status: "active",
    start_date: "2026-01-01",
    payment_type: null,
    stripe_customer_id: null,
    stripe_subscription_id: null,
    background_color: null,
    domain: null,
    template: "bloom",
    primary_color: "#C8826A",
    font: null,
    facebook_pixel_id: null,
    capi_token: null,
    clarity_id: null,
    gtm_id: null,
    phone: "0888 000 000",
    address: "гр. София, ул. Примерна 1",
    description: "Професионални процедури в уютна атмосфера. Запази своя час онлайн — бързо и лесно.",
    instagram_url: null,
    facebook_url: null,
    created_at: null,
    hero_title: "Твоята красота,",
    hero_subtitle: "наша грижа",
    logo_url: null,
    hero_image_url: null,
    about_text1: "Уютно студио за маникюр и педикюр. С над 5 години опит, ние се грижим за вашата красота с внимание и любов.",
    about_text2: "Използваме само висококачествени материали и следваме най-новите тенденции.",
    about_image_url: null,
    email: "studio@example.com",
    tiktok_url: null,
    google_maps_embed: null,
    owner_email: null,
    owner_phone: null,
    expiry_date: null,
    grace_until_date: null,
  },
  services: [
    { id: "1", salon_slug: "demo-bloom", specialist_id: null, name: "Маникюр", price_eur: 18, duration_minutes: 60, is_complex: false, active_start_min: null, active_start_max: null, waiting_min: null, waiting_max: null, active_finish_min: null, active_finish_max: null, is_active: true, created_at: null },
    { id: "2", salon_slug: "demo-bloom", specialist_id: null, name: "Педикюр", price_eur: 23, duration_minutes: 75, is_complex: false, active_start_min: null, active_start_max: null, waiting_min: null, waiting_max: null, active_finish_min: null, active_finish_max: null, is_active: true, created_at: null },
    { id: "3", salon_slug: "demo-bloom", specialist_id: null, name: "Гел лак", price_eur: 28, duration_minutes: 90, is_complex: false, active_start_min: null, active_start_max: null, waiting_min: null, waiting_max: null, active_finish_min: null, active_finish_max: null, is_active: true, created_at: null },
    { id: "4", salon_slug: "demo-bloom", specialist_id: null, name: "Сваляне", price_eur: 8, duration_minutes: 30, is_complex: false, active_start_min: null, active_start_max: null, waiting_min: null, waiting_max: null, active_finish_min: null, active_finish_max: null, is_active: true, created_at: null },
    { id: "5", salon_slug: "demo-bloom", specialist_id: null, name: "Nail Art", price_eur: 36, duration_minutes: 120, is_complex: false, active_start_min: null, active_start_max: null, waiting_min: null, waiting_max: null, active_finish_min: null, active_finish_max: null, is_active: true, created_at: null },
    { id: "6", salon_slug: "demo-bloom", specialist_id: null, name: "Парафинова терапия", price_eur: 13, duration_minutes: 45, is_complex: false, active_start_min: null, active_start_max: null, waiting_min: null, waiting_max: null, active_finish_min: null, active_finish_max: null, is_active: true, created_at: null },
  ],
  gallery: [],
  workingHours: [
    { id: "1", salon_slug: "demo-bloom", specialist_id: null, day_of_week: 1, start_time: "09:00", end_time: "18:00", is_day_off: false },
    { id: "2", salon_slug: "demo-bloom", specialist_id: null, day_of_week: 2, start_time: "09:00", end_time: "18:00", is_day_off: false },
    { id: "3", salon_slug: "demo-bloom", specialist_id: null, day_of_week: 3, start_time: "09:00", end_time: "18:00", is_day_off: false },
    { id: "4", salon_slug: "demo-bloom", specialist_id: null, day_of_week: 4, start_time: "09:00", end_time: "18:00", is_day_off: false },
    { id: "5", salon_slug: "demo-bloom", specialist_id: null, day_of_week: 5, start_time: "09:00", end_time: "18:00", is_day_off: false },
    { id: "6", salon_slug: "demo-bloom", specialist_id: null, day_of_week: 6, start_time: "10:00", end_time: "15:00", is_day_off: false },
    { id: "7", salon_slug: "demo-bloom", specialist_id: null, day_of_week: 0, start_time: "00:00", end_time: "00:00", is_day_off: true },
  ],
  specialists: [],
};

const demoVars: CSSProperties = {
  "--color-primary":   "#C8826A",
  "--color-bg":        "#FFFFFF",
  "--color-text":      "#1A1A1A",
  "--color-accent":    "#E07A5F",
  "--font-family":     "Inter, sans-serif",
  "--font-heading":    "'Playfair Display', serif",
  "--font-body":       "Inter, sans-serif",
  "--font-nav":        "Inter, sans-serif",
  "--font-button":     "Inter, sans-serif",
  "--heading-size":    "2.5rem",
  "--body-size":       "1rem",
  "--border-radius":   "0.75rem",
  "--button-padding":  "0.75rem 2rem",
  "--section-padding": "5rem",
} as CSSProperties;

export default function DemoBloomPage() {
  return (
    <div id="salon-design-root" style={demoVars}>
      <Bloom data={mockData} />
    </div>
  );
}
