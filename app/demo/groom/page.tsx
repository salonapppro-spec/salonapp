export const dynamic = "force-dynamic";
import type { SalonData } from "@/types/database";
import { Groom } from "@/components/templates/Groom";

const mockData: SalonData = {
  tenant: {
    id: "demo-groom",
    salon_slug: "demo/groom",
    salon_name: "Paw & Style",
    plan: "pro",
    status: "active",
    start_date: "2026-01-01",
    payment_type: null,
    stripe_customer_id: null,
    stripe_subscription_id: null,
    domain: null,
    template: "groom",
    primary_color: "#C8956A",
    font: null,
    facebook_pixel_id: null,
    capi_token: null,
    clarity_id: null,
    gtm_id: null,
    phone: "+359 888 000 000",
    address: "ул. Оборище 35, гр. София",
    description: "Професионален груминг салон за кучета и котки. Грижим се за вашия любимец с любов, търпение и висококачествени продукти.",
    instagram_url: null,
    facebook_url: null,
    created_at: null,
    hero_title: "Вашият любимец",
    hero_subtitle: "заслужава най-доброто",
    logo_url: null,
    hero_image_url: null,
    about_text1: "Paw & Style е груминг студио, създадено от любов към животните. Всеки любимец е уникален — затова подхождаме индивидуално към нуждите на всяко животно.",
    about_text2: "Използваме само хипоалергенни и натурални продукти, безопасни за всички породи. Вашето куче или котка ще се върне вкъщи щастливо и красиво.",
    about_image_url: null,
    email: "hello@pawandstyle.bg",
    tiktok_url: null,
    google_maps_embed: null,
    owner_email: null,
    owner_phone: null,
    expiry_date: null,
    grace_until_date: null,
  },
  services: [
    { id: "1", salon_slug: "demo-groom", specialist_id: null, name: "Пълен груминг (малка порода)", price_eur: 25, duration_minutes: 90, is_complex: false, active_start_min: null, active_start_max: null, waiting_min: null, waiting_max: null, active_finish_min: null, active_finish_max: null, is_active: true, created_at: null },
    { id: "2", salon_slug: "demo-groom", specialist_id: null, name: "Пълен груминг (голяма порода)", price_eur: 45, duration_minutes: 120, is_complex: false, active_start_min: null, active_start_max: null, waiting_min: null, waiting_max: null, active_finish_min: null, active_finish_max: null, is_active: true, created_at: null },
    { id: "3", salon_slug: "demo-groom", specialist_id: null, name: "Миене и сушене", price_eur: 15, duration_minutes: 45, is_complex: false, active_start_min: null, active_start_max: null, waiting_min: null, waiting_max: null, active_finish_min: null, active_finish_max: null, is_active: true, created_at: null },
    { id: "4", salon_slug: "demo-groom", specialist_id: null, name: "Подстригване", price_eur: 20, duration_minutes: 60, is_complex: false, active_start_min: null, active_start_max: null, waiting_min: null, waiting_max: null, active_finish_min: null, active_finish_max: null, is_active: true, created_at: null },
    { id: "5", salon_slug: "demo-groom", specialist_id: null, name: "Груминг за котки", price_eur: 30, duration_minutes: 75, is_complex: false, active_start_min: null, active_start_max: null, waiting_min: null, waiting_max: null, active_finish_min: null, active_finish_max: null, is_active: true, created_at: null },
    { id: "6", salon_slug: "demo-groom", specialist_id: null, name: "SPA пакет (вана + аромат + подсушаване)", price_eur: 35, duration_minutes: 120, is_complex: false, active_start_min: null, active_start_max: null, waiting_min: null, waiting_max: null, active_finish_min: null, active_finish_max: null, is_active: true, created_at: null },
  ],
  gallery: [],
  workingHours: [
    { id: "1", salon_slug: "demo-groom", specialist_id: null, day_of_week: 1, start_time: "09:00", end_time: "18:00", is_day_off: false },
    { id: "2", salon_slug: "demo-groom", specialist_id: null, day_of_week: 2, start_time: "09:00", end_time: "18:00", is_day_off: false },
    { id: "3", salon_slug: "demo-groom", specialist_id: null, day_of_week: 3, start_time: "09:00", end_time: "18:00", is_day_off: false },
    { id: "4", salon_slug: "demo-groom", specialist_id: null, day_of_week: 4, start_time: "09:00", end_time: "18:00", is_day_off: false },
    { id: "5", salon_slug: "demo-groom", specialist_id: null, day_of_week: 5, start_time: "09:00", end_time: "18:00", is_day_off: false },
    { id: "6", salon_slug: "demo-groom", specialist_id: null, day_of_week: 6, start_time: "10:00", end_time: "16:00", is_day_off: false },
    { id: "7", salon_slug: "demo-groom", specialist_id: null, day_of_week: 0, start_time: "00:00", end_time: "00:00", is_day_off: true },
  ],
  specialists: [],
};

export default function DemoGroomPage() {
  return <Groom data={mockData} />;
}
