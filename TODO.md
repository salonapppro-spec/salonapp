# SalonApp.pro — TODO

> Актуализирай след всяка задача. Последна промяна: 2026-05-12
> Цел: пускане на 100 платени салона

---

## 🔴 КРИТИЧНО — инфраструктура преди пускане (Лина)

- [ ] **Добави Stripe ENV в Vercel**
  → `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
  → `NEXT_PUBLIC_STRIPE_PAYMENT_LINK_STARTER/STANDARD/PRO/PREMIUM`
  → Без тях плащанията са напълно изключени

- [ ] **Регистрирай Stripe Webhook endpoint**
  → Stripe Dashboard → Developers → Webhooks
  → URL: `https://salonapp.pro/api/webhooks/stripe`
  → Events: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`

- [ ] **Конфигурирай Upstash Redis** — ЗАДЪЛЖИТЕЛНО за 100 салона
  → Без Redis, rate limiting е in-memory и не работи при Vercel serverless
  → Upstash → Create Database → вземи `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
  → Добави в Vercel Environment Variables

---

## 🟢 ПО-КЪСНО (след launch, при растеж)

- [ ] **Google Calendar — реално тестване с The Skin**
  → Phase 1+2+3 код е готов; нужно: тест с production Google акаунт

- [ ] **GDPR data export endpoint**
  → `/api/gdpr/delete-request` съществува; `/api/gdpr/export` липсва

- [ ] **Sentry конфигурация и alerts**
  → `@sentry/nextjs` е инсталиран — провери дали DSN е добавен в Vercel

- [ ] **Статистика в салонския админ**
  → Графика на резервации по месец, най-популярни услуги, revenue tracking

- [ ] **Клиентски портал**
  → Клиентът да вижда и отменя своите резервации

- [ ] **SMS нотификации (Twilio)**
  → `lib/sms.ts` е stub — нужни са реален Twilio account + ENV vars

- [ ] **Оправи финансовия панел (формули/метрики)**
  → `components/admin/finances/FinanceSummarySection.tsx`, `FinanceAbcSection.tsx`

- [ ] **Профилна снимка / аватар — директен upload**
  → Вместо URL за логото

---

## ✅ ЗАВЪРШЕНО

- [x] **Analytics pixels injection** (2026-05-12, Поли) → PR #19
  → FB Pixel, GTM, Clarity инжектирани от `AnalyticsPixels` компонент
  → Активира се от супер-админ → Facebook Pixel / GTM ID полета
- [x] **Unsubscribe endpoint** (2026-05-12, Поли) → PR #18
  → `/api/unsubscribe?booking=<id>&token=<token>` — GDPR-compliant
  → Migration 027: `email_unsubscribed` колона в `bookings`
  → Reminder cron пропуска отписани клиенти
- [x] **Dunning email при failed payment** (2026-05-12, Поли) → PR #18
  → Stripe webhook `invoice.payment_failed` изпраща имейл до `owner_email`
- [x] **Rename планове** (2026-05-12, Поли) → PR #13, #14, #15, #16, #17
  → starter(15€) / standard(19€) / pro(29€) / premium(49€)
  → Migration 026 приложена в production
  → Super-admin dropdowns показват Име — Цена
- [x] **Пълен одит на кодовата база** (2026-05-11, Поли)
  → `AUDIT_AND_TODO.md` + 84 unit теста (0 failing)
- [x] **Имейл нотификация до салона при нова резервация** (2026-05-11, Поли) → PR #11
- [x] **Нормализиране на телефони — без дублирани клиенти** (2026-05-11, Поли)
  → `lib/phone.ts` + migration 024 в production
- [x] **Банер при super-admin impersonation** — вече беше в `layout.tsx`
- [x] **Clean шаблон — primary_color** — вече беше оправено
- [x] **Lead нотификация до супер-админ** — `lib/lead-notify.ts` вече работи
- [x] **Автоматична деактивация cron** — `billing-expiry` + `vercel.json` вече настроени
- [x] **Google Calendar интеграция Phase 1+2+3** (2026-05-05, Лина)
- [x] **Fix: BookingCalendar коса за сложни услуги** (2026-05-05, Лина)
- [x] **Security: cron API auth, design tokens XSS, booking service integrity** (2026-04-22, Лина)
- [x] **Middleware: path-based routing за Vercel**
- [x] **`primary_color` pipeline**
- [x] **Stripe webhook** — автоматично активиране при `invoice.paid`
- [x] **Галерия redesign** — drag-and-drop, toggle видимост
- [x] **Цветова палитра** — 6 preset + custom hex picker
- [x] **Супер-админ: leads inbox, status badges**
- [x] **Rate limiting** — bookings (40/min), leads (15/min)
- [x] **Потвърдителен имейл до клиента при резервация** (Resend)
