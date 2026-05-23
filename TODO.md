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

## 🟢 ПО-КЪСНО (след launch, при растеж)

- [ ] **Google Calendar** — НЕ СЕ ПИПА без изрично разрешение от Лина (кодът е готов, тест при нужда)
- [ ] **Статистика в салонския админ** — графики по месец, топ услуги
- [ ] **Клиентски портал** — клиентът да вижда/отменя резервациите си
- [ ] **SMS (Twilio)** — `lib/sms.ts` е stub, нужен реален акаунт
- [ ] **Финансов панел** — верификация на формули и метрики

---

## ✅ ЗАВЪРШЕНО

- [x] **Fix: horizontal scroll на Magnetic Eyes** (2026-05-23) — mobile responsive CSS в `components/tenants/magnetic-eyes/Page.tsx`; проверено на 375px и 320px с `overflow = 0`
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
- [x] **Clean шаблон primary_color** — оправено
- [x] **Lead нотификация до супер-админ** — `lib/lead-notify.ts`
- [x] **Автоматична деактивация cron** — `billing-expiry` + `vercel.json`
- [x] **Google Calendar интеграция Phase 1+2+3** (2026-05-05)
- [x] **Security fixes** (2026-04-22) — cron auth, XSS, booking integrity
- [x] **Rate limiting** — Upstash Redis (production) + in-memory fallback
- [x] **Stripe webhook** — автоматично активиране при `invoice.paid`
- [x] **Галерия** — drag-and-drop, toggle видимост
- [x] **Цветова палитра** — 6 preset + custom hex
- [x] **Потвърдителен имейл до клиента при резервация**
