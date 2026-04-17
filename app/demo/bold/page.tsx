export const dynamic = "force-dynamic";
import type { SalonData } from "@/types/database";
import { Bold } from "@/components/templates/Bold";

const mockData: SalonData = {
  tenant: {
    id: "demo-bold",
    salon_slug: "demo/bold",
    salon_name: "MasterCut",
    plan: "pro",
    status: "active",
    start_date: "2026-01-01",
    payment_type: null,
    stripe_customer_id: null,
    stripe_subscription_id: null,
    domain: null,
    template: "bold",
    primary_color: "#C8102E",
    font: null,
    facebook_pixel_id: null,
    capi_token: null,
    clarity_id: null,
    gtm_id: null,
    phone: "+359 888 000 000",
    address: "ул. Граф Игнатиев 15, гр. София",
    description: "Премиум барбершоп за мъже, които знаят какво искат. Класически и модерни прически с безупречна прецизност.",
    instagram_url: null,
    facebook_url: null,
    created_at: null,
    hero_title: "ТВОЯТ",
    hero_subtitle: "СТИЛ.",
    logo_url: null,
    hero_image_url: null,
    about_text1: "MasterCut е повече от барбершоп — това е място, където стилът среща майсторството. С над 8 години опит, нашият екип владее всяка техника.",
    about_text2: "Класически бръснене с нож, модерни прически, оформяне на брада — всичко с внимание към детайла и перфектен завършек.",
    about_image_url: null,
    email: "info@mastercut.bg",
    tiktok_url: null,
    google_maps_embed: null,
    owner_email: null,
    owner_phone: null,
    expiry_date: null,
    grace_until_date: null,
  },
  services: [
    { id: "1", salon_slug: "demo-bold", specialist_id: null, name: "Мъжко подстригване", price_eur: 13, duration_minutes: 30, is_complex: false, active_start_min: null, active_start_max: null, waiting_min: null, waiting_max: null, active_finish_min: null, active_finish_max: null, is_active: true, created_at: null },
    { id: "2", salon_slug: "demo-bold", specialist_id: null, name: "Класическо бръснене", price_eur: 15, duration_minutes: 45, is_complex: false, active_start_min: null, active_start_max: null, waiting_min: null, waiting_max: null, active_finish_min: null, active_finish_max: null, is_active: true, created_at: null },
    { id: "3", salon_slug: "demo-bold", specialist_id: null, name: "Подстригване + Бръснене", price_eur: 25, duration_minutes: 60, is_complex: false, active_start_min: null, active_start_max: null, waiting_min: null, waiting_max: null, active_finish_min: null, active_finish_max: null, is_active: true, created_at: null },
    { id: "4", salon_slug: "demo-bold", specialist_id: null, name: "Оформяне на брада", price_eur: 10, duration_minutes: 20, is_complex: false, active_start_min: null, active_start_max: null, waiting_min: null, waiting_max: null, active_finish_min: null, active_finish_max: null, is_active: true, created_at: null },
    { id: "5", salon_slug: "demo-bold", specialist_id: null, name: "Детско подстригване", price_eur: 10, duration_minutes: 25, is_complex: false, active_start_min: null, active_start_max: null, waiting_min: null, waiting_max: null, active_finish_min: null, active_finish_max: null, is_active: true, created_at: null },
    { id: "6", salon_slug: "demo-bold", specialist_id: null, name: "Боядисване", price_eur: 30, duration_minutes: 90, is_complex: false, active_start_min: null, active_start_max: null, waiting_min: null, waiting_max: null, active_finish_min: null, active_finish_max: null, is_active: true, created_at: null },
  ],
  gallery: [],
  workingHours: [
    { id: "1", salon_slug: "demo-bold", specialist_id: null, day_of_week: 1, start_time: "10:00", end_time: "20:00", is_day_off: false },
    { id: "2", salon_slug: "demo-bold", specialist_id: null, day_of_week: 2, start_time: "10:00", end_time: "20:00", is_day_off: false },
    { id: "3", salon_slug: "demo-bold", specialist_id: null, day_of_week: 3, start_time: "10:00", end_time: "20:00", is_day_off: false },
    { id: "4", salon_slug: "demo-bold", specialist_id: null, day_of_week: 4, start_time: "10:00", end_time: "20:00", is_day_off: false },
    { id: "5", salon_slug: "demo-bold", specialist_id: null, day_of_week: 5, start_time: "10:00", end_time: "20:00", is_day_off: false },
    { id: "6", salon_slug: "demo-bold", specialist_id: null, day_of_week: 6, start_time: "10:00", end_time: "18:00", is_day_off: false },
    { id: "7", salon_slug: "demo-bold", specialist_id: null, day_of_week: 0, start_time: "00:00", end_time: "00:00", is_day_off: true },
  ],
  specialists: [],
};

export default function DemoBoldPage() {
  return <Bold data={mockData} />;
}
