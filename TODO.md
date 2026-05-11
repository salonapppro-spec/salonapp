# SalonApp.pro — TODO

> Актуализирай след всяка задача. Последна промяна: 2026-05-11 (нощта, след одит)
> Цел: пускане на 100 платени салона

---

## 🔴 КРИТИЧНО — инфраструктура преди пускане (Лина)

- [ ] **Свържи домейн `salonapp.pro` с Vercel**
  → Vercel → Settings → Domains → добави `salonapp.pro` и `*.salonapp.pro`
  → DNS: `A` запис `@` → `76.76.21.21` | `CNAME` `*` → `cname.vercel-dns.com`
  → До тогава резервации от custom domain са невъзможни

- [ ] **Добави Stripe ENV в Vercel**
  → `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
  → `NEXT_PUBLIC_STRIPE_PAYMENT_LINK_STANDARD/PRO/PREMIUM/COLLECTIVE`
  → Без тях плащанията са напълно изключени

- [ ] **Регистрирай Stripe Webhook endpoint**
  → Stripe Dashboard → Developers → Webhooks
  → URL: `https://salonapp.pro/api/webhooks/stripe`
  → Events: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`

- [ ] **Конфигурирай Upstash Redis** — ЗАДЪЛЖИТЕЛНО за 100 салона
  → Без Redis, rate limiting е in-memory и не работи при Vercel serverless (всяка функция е отделен instance)
  → Upstash → Create Database → вземи `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
  → Добави в Vercel Environment Variables
  → При 100 салона рискуваш DDoS без истинско rate limiting

---

## 🔴 КРИТИЧНО — функционалност преди пускане (Поли)

- [ ] **Оправи `clean` шаблон — цвят**
  → `components/templates/Clean.tsx` ред ~19: `const ACCENT = "#0066CC"` → `tenant.primary_color ?? "#0066CC"`
  → Всеки нов салон, избрал `clean`, ще изглежда еднакво

- [ ] **Банер при super-admin impersonation**
  → `app/admin/(protected)/layout.tsx` — чети `SUPER_ADMIN_SALON_COOKIE`
  → `"⚠️ Гледаш като: [Салон X] — Излез"` + бутон изтрива cookie + redirect `/super-admin`
  → Без него Лина може да забрави, че е в чужд акаунт и да промени данни

- [ ] **Unsubscribe endpoint**
  → `lib/email.tsx` генерира `/unsubscribe?booking=...&token=...` но handler не съществува
  → GDPR и Resend изискват работещ unsubscribe; без него рискуваш спам блок на домейна
  → Създай `app/api/unsubscribe/route.ts` — верифицира token, маркира booking като unsubscribed

- [ ] **Dunning email при failed payment**
  → `app/api/webhooks/stripe/route.ts` — `case "invoice.payment_failed"`: само console.warn()
  → Добави `sendResendHtml()` до `owner_email` с линк към Stripe Customer Portal
  → При 100 салона ще имаш failed payments всеки месец

- [ ] **Нотификация до супер-админ при нова заявка (lead)**
  → `app/api/leads/route.ts` — добави Resend fetch след успешен insert
  → Имейл до `admin@salonapp.pro` с данните на потенциалния клиент

---

## 🟡 ВАЖНО — преди пускане на 100 салона (Поли)

- [ ] **Автоматична деактивация при изтекъл grace период**
  → `UPDATE tenants SET status='inactive' WHERE grace_until_date < CURRENT_DATE AND status='active'`
  → Vercel Cron Job (`vercel.json`) + `app/api/cron/billing-expiry/route.ts` (route съществува, провери логиката)
  → Без това никой салон не се деактивира автоматично → неплатени салони остават активни вечно

- [ ] **Analytics pixels injection в шаблоните**
  → `tenants` таблицата има `facebook_pixel_id`, `gtm_id`, `clarity_id`, `capi_token`
  → Нито един шаблон не ги инжектира в `<head>`
  → Блокира продажби на платени клиенти, поискали FB Pixel и GTM

- [ ] **Онбординг wizard за нови салони** — 4 стъпки след регистрация
  → качи лого → добави услуги → задай работно време → виж сайта
  → При 100 салона ръчен onboarding е невъзможен

---

## 🟢 ПО-КЪСНО (след launch, при растеж)

- [ ] **Google Calendar — реално тестване с The Skin**
  → Phase 1+2+3 код е готов; нужно: тест с production Google акаунт + евент. feature flag

- [ ] **GDPR data export endpoint**
  → `/api/gdpr/delete-request` съществува; `/api/gdpr/export` липсва
  → Нужно за GDPR compliance при EU клиенти

- [ ] **Sentry конфигурация и alerts**
  → `@sentry/nextjs` е инсталиран, но не е верифицирано дали DSN е добавен в Vercel
  → При 100 салона production грешки трябва да се виждат

- [ ] **Статистика в салонския админ**
  → Графика на резервации по месец, най-популярни услуги, revenue tracking

- [ ] **Клиентски портал**
  → Клиентът да вижда и отменя своите резервации

- [ ] **SMS нотификации (Twilio)**
  → `lib/sms.ts` е stub — нужни са реален Twilio account + ENV vars

- [ ] **Оправи финансовия панел (формули/метрики)**
  → `components/admin/finances/FinanceSummarySection.tsx`, `FinanceAbcSection.tsx`
  → `lib/finance-dates.ts` — провери helper-ите за периоди

- [ ] **Профилна снимка / аватар — директен upload**
  → Вместо URL за логото

---

## ✅ ЗАВЪРШЕНО

- [x] **Пълен одит на кодовата база** (2026-05-11, Поли)
  → `AUDIT_AND_TODO.md` + 74 нови unit теста (84 total, 0 failing)
  → Идентифицирани всички критични пропуски преди launch
- [x] **Имейл нотификация до салона при нова резервация** (2026-05-11, Поли)
  → `lib/email.tsx` `sendSalonBookingNotification()` → PR #11 merge-нат
- [x] **Нормализиране на телефони — без дублирани клиенти** (2026-05-11, Поли)
  → `lib/phone.ts` + нормализиране навсякъде + migration 024 в production
- [x] **Google Calendar интеграция Phase 1+2+3** (2026-05-05, Лина)
- [x] **Fix: BookingCalendar коса за сложни услуги** (2026-05-05, Лина)
- [x] **Security: cron API auth, design tokens XSS, booking service integrity** (2026-04-22, Лина)
- [x] **Middleware: path-based routing за Vercel** — `salonapp-ten.vercel.app/salon-bizhu`
- [x] **`primary_color` pipeline** — записва и вижда на сайта
- [x] **Stripe webhook** — автоматично активиране при `invoice.paid`
- [x] **Галерия redesign** — drag-and-drop, toggle видимост
- [x] **Цветова палитра** — 6 preset + custom hex picker
- [x] **Супер-админ: leads inbox, status badges**
- [x] **Rate limiting** — bookings (40/min), leads (15/min)
- [x] **Потвърдителен имейл до клиента при резервация** (Resend)
