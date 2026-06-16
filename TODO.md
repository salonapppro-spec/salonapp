# SalonApp.pro — TODO

- [x] **Security: cron API auth** — reminders and billing-expiry require `Authorization: Bearer <CRON_SECRET>`; `x-vercel-cron` alone no longer authorizes access
- [x] **Security: design tokens Stored XSS** — strict Zod allowlist validation, safe fallback for stored tokens, no token-driven raw `<style dangerouslySetInnerHTML>`
- [x] **Security: booking service integrity** — server-side service lookup by `salon_slug + service_id`; client no longer controls service name, price, or duration

> Актуализирай след всяка задача. Последна промяна: 2026-06-16

---

## 🔴 КРИТИЧНО (сега)

Няма. ✅ (всичките 10 P0 от security/database одита 2026-06-16 са затворени — виж HANDOFF.md)

---

## 🟡 P1 — следващ sprint (от security audit 2026-06-15/16, P0 затворен)

- [ ] **Specialist active validation в `runCreateBooking`** — crafted request може да резервира при неактивен специалист
- [ ] **`bookings_public_insert` RLS WITH CHECK** — tighten да проверява service/specialist принадлежат на същия `salon_slug` (cross-tenant spam защита)
- [ ] **Complex услуги без hair params** — API може да bypass-не hair_length/hair_density и да вземе грешна продължителност
- [ ] **`googleIntegration.listActive()`** — без `salon_slug` filter (latent, не извикан никъде в момента, но риск ако се добави)
- [ ] **Standardize tenant sites на `BookingFlow`** — повечето tenant сайтове ползват директен `fetch('/api/bookings')`, само `TheBeastSite` ползва server action
- [ ] **GDPR delete-request persistence** — само email до ops, няма DB запис/audit trail
- [ ] **Super-admin FormData actions без Zod** — само tenant creation има схема
- [ ] **Phone enumeration на `/api/clients/lookup`** — rate limit е по IP, не per-phone

---

## 🟢 ПО-КЪСНО (след launch, при растеж)

- [ ] **Google Calendar** — НЕ СЕ ПИПА без изрично разрешение от Лина (кодът е готов, тест при нужда)
- [ ] **Статистика в салонския админ** — графики по месец, топ услуги
- [ ] **Клиентски портал** — клиентът да вижда/отменя резервациите си
- [ ] **SMS (Twilio)** — `lib/sms.ts` е stub, нужен реален акаунт
- [ ] **Финансов панел** — верификация на формули и метрики

---

## ✅ ЗАВЪРШЕНО

- [x] **Security/database audit fix sprint** (2026-06-16) — 10 P0 (RLS, migration 026 drift + нов constraint bug, Stripe webhook status tracking + grace policy, confirm/cancel token reuse, cron reminders batching, root domain booking 400 fix, booking_min_notice/window enforcement, phone "00000" reject, CI scripts wiring) + 5 follow-up gaps (migration 029 missing CREATE TABLE, QuickBooking phone + specialist_id, impersonation cookie re-verify + audit log) + trial >30 дни dashboard tracking; пълен database backup преди старт; виж HANDOFF.md за детайли
- [x] **Fix: mobile forced dark mode on landing** (2026-06-03) — `app/globals.css`, `app/layout.tsx` и `app/page.tsx` заключват public landing-а в light color scheme, за да не се обръща в тъмен фон на Samsung/Android браузъри
- [x] **Redesign: desktop AdminShowcase section** (2026-06-03) — `components/landing/AdminShowcase.tsx` вече е центриран two-column product showcase с голям phone mockup, изнесени floating cards, email reminders copy и desktop/mobile проверка без horizontal scroll
- [x] **Fix: landing hero композиция** (2026-06-03) — `hero-mockup-new.png` е по-близо до текста, центриран вертикално и дръпнат навътре от десния край; същият mockup се използва и на mobile; desktop/mobile viewport проверени без horizontal scroll
- [x] **Fix: horizontal scroll + mobile hero crop на Magnetic Eyes** (2026-05-23) — mobile responsive CSS + document-level horizontal scroll lock в `components/tenants/magnetic-eyes/Page.tsx`; проверено на 375px и 320px с `overflow = 0`
- [x] **Fix: регистрация на нов тенант — задаване на парола** (2026-05-14) — recovery link redirectTo сочеше към `/admin/login` вместо `/admin/reset-password`
- [x] **Stripe Payment Links + Webhook + ENV vars** (2026-05-13) — 4 линка (15/19/29/49€), webhook на `salonapp.pro/api/webhooks/stripe`, всички ENV в Vercel, редеплой — системата е live
- [x] **GDPR export security fix** (2026-05-12) → PR #30 — двустъпков email verification flow + rate limiting
- [x] **Cookie consent banner** (2026-05-12) → PR #25–27 — GDPR-compliant, 3 категории
- [x] **GDPR export endpoint** (2026-05-12) → PR #23
- [x] **Upstash Redis** (2026-05-12) — DB създадена, ENV vars в Vercel
- [x] **Sentry** — работи от Apr 22, config файлове добавени PR #21
- [x] **Лого upload** — `ImageUpload` + `/api/admin/upload` вече работят
- [x] **Analytics pixels** (2026-05-12) → PR #19 — FB Pixel, GTM, Clarity
- [x] **Unsubscribe endpoint** (2026-05-12) → PR #18 — GDPR-compliant
- [x] **Dunning email при failed payment** (2026-05-12) → PR #18
- [x] **Rename планове** (2026-05-12) → PR #13–17 — starter/standard/pro/premium
- [x] **Пълен одит на кодовата база** (2026-05-11) — 84 unit теста
- [x] **Имейл нотификация до салона при резервация** (2026-05-11) → PR #11
- [x] **Нормализиране на телефони** (2026-05-11) — migration 024
- [x] **Банер при super-admin impersonation** — в `layout.tsx`
- [x] **Изтриване на всички шаблони** (2026-06-02) — bloom, clean, zen, luxe и др. изтрити; всеки салон има уникален компонент в `components/tenants/`
- [x] **Свързване на домейн + Stripe** (2026-06-02) — `salonapp.pro` + `*.salonapp.pro` в Vercel, всички Stripe ENV + webhook ✅
- [x] **Clean шаблон primary_color** — legacy, не се ползва
- [x] **Lead нотификация до супер-админ** — `lib/lead-notify.ts`
- [x] **Автоматична деактивация cron** — `billing-expiry` + `vercel.json`
- [x] **Google Calendar интеграция Phase 1+2+3** (2026-05-05)
- [x] **Security fixes** (2026-04-22) — cron auth, XSS, booking integrity
- [x] **Rate limiting** — Upstash Redis (production) + in-memory fallback
- [x] **Stripe webhook** — автоматично активиране при `invoice.paid`
- [x] **Галерия** — drag-and-drop, toggle видимост
- [x] **Цветова палитра** — 6 preset + custom hex
- [x] **Потвърдителен имейл до клиента при резервация**
