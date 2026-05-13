# SalonApp.pro — TODO

- [x] **Security: cron API auth** — reminders and billing-expiry require `Authorization: Bearer <CRON_SECRET>`; `x-vercel-cron` alone no longer authorizes access
- [x] **Security: design tokens Stored XSS** — strict Zod allowlist validation, safe fallback for stored tokens, no token-driven raw `<style dangerouslySetInnerHTML>`
- [x] **Security: booking service integrity** — server-side service lookup by `salon_slug + service_id`; client no longer controls service name, price, or duration

> Актуализирай след всяка задача. Последна промяна: 2026-04-30

---

## 🔴 КРИТИЧНО (сега)

- [ ] **Свържи домейн `salonapp.pro` с Vercel** — Лина  
  → Vercel → Settings → Domains → добави `salonapp.pro` и `*.salonapp.pro`  
  → DNS: `A` запис `@` → `76.76.21.21` | `CNAME` `*` → `cname.vercel-dns.com`  
  → До тогава работи само `salonapp-ten.vercel.app/salon-bizhu`

- [ ] **Добави Stripe ENV в Vercel** — Лина  
  → `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`  
  → `NEXT_PUBLIC_STRIPE_PAYMENT_LINK_STANDARD/PRO/PREMIUM/COLLECTIVE`

- [ ] **Регистрирай Stripe Webhook endpoint** — Лина  
  → Stripe Dashboard → Developers → Webhooks  
  → URL: `https://salonapp.pro/api/webhooks/stripe`  
  → Events: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`

---

## 🟡 ВАЖНО (следва — за Поли)

- [ ] **Интеграция: Свържи Google Calendar (MVP за The Skin)** — Поли
  → Добави бутон **„Свържи Google Calendar“** в админ панела (Settings/Integrations)
  → OAuth flow: start + callback + secure `state` (anti-CSRF)
  → Таблица `tenant_google_integrations` (calendar_id, encrypted refresh token, sync_enabled)
  → Проверка на свободни слотове през Google FreeBusy + буфери
  → Създаване на Google event при резервация + запис на `google_event_id` локално
  → Feature flag първо само за `theskin`
  → Progress (2026-05-05): Phase 1+2+watch done — migration, OAuth routes, Settings UI card, FreeBusy в слотове, booking push sync (create/update/delete), inbound webhook apply (move/cancel + cancel email), cron renew route for watches

- [ ] **Оправи финансовия панел (формули/метрики не са коректни)** — Поли
  → Преглед и корекция на изчисленията в `app/admin/(protected)/finances/page.tsx`
  → Валидирай логиката в `components/admin/finances/FinanceSummarySection.tsx` и `components/admin/finances/FinanceAbcSection.tsx`
  → Провери helper-ите за периоди/дати в `lib/finance-dates.ts`
  → Сверка с реални примерни стойности (очакван резултат срещу показан)
  → Добави/обнови тестове за ключовите финансови формули

- [ ] **Оправи `clean` шаблон — цвят** — Поли  
  → Файл: `templates/Clean.tsx` (или `app/(public)/templates/Clean.tsx`)  
  → `const ACCENT = "#0066CC"` → `const ACCENT = tenant.primary_color ?? "#0066CC"`

- [ ] **Банер при super-admin impersonation** — Поли  
  → Когато супер-админ влезе в чужд акаунт, показвай: `"⚠️ Гледаш като: Салон X — Излез"`  
  → Файл: `app/admin/(protected)/layout.tsx`  
  → Чети cookie `SUPER_ADMIN_SALON_COOKIE` от `lib/admin-tenant.ts`  
  → Бутон "Излез" → server action изтрива cookie → redirect `/super-admin`

- [ ] **Автоматична деактивация при изтекъл grace период** — Поли  
  → Салони с `grace_until_date < today` и `status = 'active'` трябва да станат `inactive`  
  → Вариант 1: Vercel Cron Job (`vercel.json` + API route)  
  → Вариант 2: Supabase pg_cron (SQL)  
  → SQL: `UPDATE tenants SET status='inactive' WHERE grace_until_date < CURRENT_DATE AND status='active'`

- [ ] **Нотификация до супер-админ при нова заявка (lead)** — Поли  
  → При попълване на `/get-started` форма → изпрати имейл до `admin@salonapp.pro`  
  → Файл: `app/api/leads/route.ts`  
  → Добави Resend fetch след успешен insert в `platform_leads`

---

## 🟢 ПО-КЪСНО

- [ ] **Онбординг wizard за нови салони** — 4 стъпки след регистрация  
  Стъпки: качи лого → добави услуги → задай работно време → виж сайта

- [ ] **Статистика в салонския админ**  
  → Графика на резервации по месец  
  → Най-популярни услуги  
  → Revenue tracking

- [ ] **Клиентски портал**  
  → Клиентът да може да вижда и отменя своите резервации

- [ ] **SMS нотификации**  
  → При нова резервация — SMS до собственика и/или клиента  
  → Интеграция с Twilio или локален SMS провайдър

- [ ] **Профилна снимка / аватар за салоните**  
  → Директен upload вместо URL за логото

- [ ] **Потвърдителен имейл до клиента при резервация**  
  → При успешна резервация → изпрати Resend имейл до клиента

---

## ✅ ЗАВЪРШЕНО (последни 10)

- [x] **Middleware: path-based routing за Vercel** — `salonapp-ten.vercel.app/salon-bizhu` работи
- [x] **`primary_color` pipeline оправен** — схемата вече включва полето, цветът се записва
- [x] **Template cache revalidation** — смяна от супер-админ → веднага на сайта
- [x] **Success feedback при запазване** — зелен банер + redirect `?saved=1`
- [x] **Stripe webhook** — автоматично активиране при `invoice.paid` / `checkout.session.completed`
- [x] **Галерия redesign** — drag-and-drop зона, toggle видимост, нова визия
- [x] **Цветова палитра в настройките** — 6 preset + custom hex picker
- [x] **Супер-админ: leads inbox** — страница `/super-admin/leads`
- [x] **Супер-админ: status badges** — визуален статус на тенантите
- [x] **Fix: template save не работеше** — махнати non-form полета от patch
- [ ] **Booking + Google sync stabilization plan** â€” Ð²Ð¸Ð¶ `BOOKING_GOOGLE_SYNC_PLAN_BG.md`
