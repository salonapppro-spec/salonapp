# SalonApp.pro — TODO

- [x] **Security: cron API auth** — reminders and billing-expiry require `Authorization: Bearer <CRON_SECRET>`; `x-vercel-cron` alone no longer authorizes access
- [x] **Security: design tokens Stored XSS** — strict Zod allowlist validation, safe fallback for stored tokens, no token-driven raw `<style dangerouslySetInnerHTML>`
- [x] **Security: booking service integrity** — server-side service lookup by `salon_slug + service_id`; client no longer controls service name, price, or duration

> Актуализирай след всяка задача. Последна промяна: 2026-06-02

---

## 🔴 КРИТИЧНО (сега)

Няма. ✅

---

## 🟢 ПО-КЪСНО (след launch, при растеж)

- [ ] **Google Calendar** — НЕ СЕ ПИПА без изрично разрешение от Лина (кодът е готов, тест при нужда)
- [ ] **Статистика в салонския админ** — графики по месец, топ услуги
- [ ] **Клиентски портал** — клиентът да вижда/отменя резервациите си
- [ ] **SMS (Twilio)** — `lib/sms.ts` е stub, нужен реален акаунт
- [ ] **Финансов панел** — верификация на формули и метрики

---

## ✅ ЗАВЪРШЕНО

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
