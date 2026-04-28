export const dynamic = "force-dynamic";
import type { CSSProperties } from "react";
import type { SalonData } from "@/types/database";
import { Bloom } from "@/components/templates/Bloom";

const mockData: SalonData = {
  tenant: {
    id: "demo-bloom",
    salon_slug: "demo/bloom",
    salon_name: "Studio Bloom",
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
    description: "Твоето лично пространство за красота и релакс. Маникюр, педикюр и нейл арт от специалисти с душа.",
    instagram_url: "https://instagram.com/studiobloom",
    facebook_url: "https://facebook.com/studiobloom",
    created_at: null,
    hero_title: "Твоята красота,",
    hero_subtitle: "наша грижа",
    logo_url: null,
    hero_image_url: "https://images.unsplash.com/photo-1519415943484-9fa1873496d4?w=1600&q=85",
    about_text1: "Уютно студио за маникюр и педикюр. С над 5 години опит, ние се грижим за вашата красота с внимание и любов.",
    about_text2: "Използваме само висококачествени материали и следваме най-новите тенденции в нейл арт и грижата за ноктите.",
    about_image_url: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=900&q=85",
    email: "studio@example.com",
    tiktok_url: null,
    google_maps_embed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2932.847!2d23.3219!3d42.6977!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDLCsDQxJzUxLjciTiAyM8KwMTknMTguOCJF!5e0!3m2!1sbg!2sbg!4v1234567890",
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
  gallery: [
    { id: "g1", url: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=80", order_index: 1 },
    { id: "g2", url: "https://images.unsplash.com/photo-1604654894619-3a08b46bb9e2?w=600&q=80", order_index: 2 },
    { id: "g3", url: "https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=600&q=80", order_index: 3 },
    { id: "g4", url: "https://images.unsplash.com/photo-1583209814683-c023dd293cc6?w=600&q=80", order_index: 4 },
    { id: "g5", url: "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=600&q=80", order_index: 5 },
    { id: "g6", url: "https://images.unsplash.com/photo-1560066984-138daaa962f3?w=600&q=80", order_index: 6 },
    { id: "g7", url: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&q=80", order_index: 7 },
    { id: "g8", url: "https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?w=600&q=80", order_index: 8 },
  ],
  workingHours: [
    { id: "1", salon_slug: "demo-bloom", specialist_id: null, day_of_week: 1, start_time: "09:00", end_time: "18:00", is_day_off: false },
    { id: "2", salon_slug: "demo-bloom", specialist_id: null, day_of_week: 2, start_time: "09:00", end_time: "18:00", is_day_off: false },
    { id: "3", salon_slug: "demo-bloom", specialist_id: null, day_of_week: 3, start_time: "09:00", end_time: "18:00", is_day_off: false },
    { id: "4", salon_slug: "demo-bloom", specialist_id: null, day_of_week: 4, start_time: "09:00", end_time: "18:00", is_day_off: false },
    { id: "5", salon_slug: "demo-bloom", specialist_id: null, day_of_week: 5, start_time: "09:00", end_time: "18:00", is_day_off: false },
    { id: "6", salon_slug: "demo-bloom", specialist_id: null, day_of_week: 6, start_time: "10:00", end_time: "15:00", is_day_off: false },
    { id: "7", salon_slug: "demo-bloom", specialist_id: null, day_of_week: 0, start_time: "00:00", end_time: "00:00", is_day_off: true },
  ],
  specialists: [
    {
      id: "sp1", salon_slug: "demo-bloom",
      name: "Мария Петрова", role: "Маникюрист & Нейл Арт",
      bio: "С над 7 години опит в маникюра и нейл арт. Специализирана в сложни дизайни и дълготрайни гел покрития. Постоянно се обучава с нови техники.",
      avatar_url: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=300&h=300&q=80&fit=crop",
      is_active: true, is_technical_admin: false, created_at: null,
    },
    {
      id: "sp2", salon_slug: "demo-bloom",
      name: "Елена Иванова", role: "Педикюрист",
      bio: "Специалист по педикюр и грижа за краката. Прилага релаксиращи техники и висококачествени продукти за перфектни резултати.",
      avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&q=80&fit=crop",
      is_active: true, is_technical_admin: false, created_at: null,
    },
  ],
};

const demoVars: CSSProperties = {
  "--color-primary":   "#B5607A",
  "--color-bg":        "#FDF8F6",
  "--color-text":      "#2A1A20",
  "--color-accent":    "#D4899A",
  "--font-family":     "'DM Sans', Inter, sans-serif",
  "--font-heading":    "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
  "--font-body":       "'DM Sans', Inter, sans-serif",
  "--font-nav":        "'DM Sans', Inter, sans-serif",
  "--font-button":     "'DM Sans', Inter, sans-serif",
  "--heading-size":    "2.5rem",
  "--body-size":       "1rem",
  "--border-radius":   "1rem",
  "--button-padding":  "0.85rem 2.2rem",
  "--section-padding": "5.5rem",
} as CSSProperties;

export default function DemoBloomPage() {
  return (
    <div id="salon-design-root" style={demoVars}>
      <Bloom data={mockData} />
    </div>
  );
}
