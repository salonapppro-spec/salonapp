# SalonApp — Пълен Одит и TODO

> Генериран: 2026-05-11  
> Метод: статичен анализ на кода (без изпълнение на продукционни заявки)  
> Изследвани: 40+ lib модула, 25 миграции, 12 шаблона, 6 тест файла, 8 admin страници

---

## 1. Статус на завършените модули

### 1.1 Завършени и продукционно-готови

| Модул | Статус | Доказателство в кода |
|-------|--------|----------------------|
| **Admin панел** (8 стр.) | ✅ Завършен | `app/admin/(protected)/dashboard/`, `calendar/`, `clients/`, `services/`, `gallery/`, `settings/`, `working-hours/`, `finances/` |
| **Онлайн резервации** (6 стъпки) | ✅ Завършен | `components/booking/BookingFlow.tsx` — стъпки: specialist → service → complex → datetime → contact → confirm |
| **Календар** (ден/седмица/месец) | ✅ Завършен | `components/admin/MonthCalendar.tsx`, `WeekTimeGrid.tsx`, `CalendarDayShell.tsx` |
| **Slot generation** | ✅ Завършен | `lib/scheduling.ts` — generateSlots(), magnetic scheduling, 30-мин advance, blocked slots |
| **Финансови отчети + ABC** | ✅ Завършен | `app/admin/(protected)/finances/`, `lib/finance-abc.ts` — buildAbcRows(), costPerMinute, VAT, margin bands |
| **Имейл нотификации** | ✅ Завършен | `lib/email.tsx` — sendConfirmationEmail, sendReminderEmail, sendSalonBookingNotification; шаблони в `emails/` |
| **Stripe webhooks** | ✅ Завършен | `app/api/webhooks/stripe/route.ts` — идемпотентност, checkout.session.completed, invoice.paid, subscription.deleted |
| **Multi-tenant RLS изолация** | ✅ Завършен | `supabase/migrations/002_*.sql`, `lib/tenant-db.ts` — всички заявки са scopeнати по salon_slug |
| **Rate limiting** | ✅ Завършен | `lib/rate-limit-policies.ts` — 13 политики, Upstash Redis + in-memory fallback |
| **Phone normalization** | ✅ Завършен | `lib/phone.ts` — 08XXXXXXXX→+359..., 00359→+359, strip форматиране |
| **Client deduplication** | ✅ Завършен | `supabase/migrations/024_*.sql`, `025_*.sql` — UNIQUE(salon_slug, phone) constraint след deduplicate |
| **Публични шаблони** (8 бр.) | ✅ Завършен | `components/templates/` — Bloom, Bold, Clean, Groom, Luxe, Luxe2, TheSkin, Zen |
| **Gallery management** | ✅ Завършен | `app/admin/(protected)/gallery/`, upload/reorder/visibility, Storage RLS |
| **Working hours** | ✅ Завършен | `app/admin/(protected)/working-hours/`, `lib/working-hours-defaults.ts` |
| **Service management** | ✅ Завършен | Прости (duration_minutes) + сложни (3×3 матрица за коса) |
| **Booking conflict prevention** | ✅ Завършен | PostgreSQL EXCLUSION constraint (gist) в migration 001 |
| **Super-admin panel** | ✅ Завършен | `app/super-admin/` — tenant CRUD, leads, slug rename, archiving |
| **GDPR delete endpoint** | ✅ Завършен | `app/api/gdpr/delete-request/route.ts` — rate limited (3/min) |
| **Cron jobs** | ✅ Завършен | `app/api/cron/reminders/`, `billing-expiry/` — CRON_SECRET auth |
| **Google Calendar (Phase 3)** | 🟡 Код завършен, нетестван в продукция | `lib/google-calendar.ts`, `lib/google-calendar-sync.ts` — OAuth, FreeBusy, webhook sync |
| **SMS напомняния** | 🟡 Stub | `lib/sms.ts` (Twilio) — функцията съществува, не е конфигурирана |

---

## 2. Пропуски спрямо пълноценна Salon SaaS платформа

### 2.1 Критични — преди launch

| # | Пропуск | Доказателство в кода | Приоритет |
|---|---------|----------------------|-----------|
| **C1** | **DNS `salonapp.pro` не е свързан с Vercel** | HANDOFF.md — изрично записано като блокер | 🔴 Блокер |
| **C2** | **Stripe env vars липсват в Vercel production** | HANDOFF.md — `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` не са добавени | 🔴 Блокер |
| **C3** | **Stripe webhook endpoint не е регистриран в Dashboard** | HANDOFF.md — изрично записано | 🔴 Блокер |
| **C4** | **Unsubscribe endpoint липсва** | `lib/email.tsx` генерира URL `${appUrl}/unsubscribe?booking=...&token=...`, но няма `app/api/` или `app/(public)/` handler за тази path | 🟠 Важно |
| **C5** | **Dunning email при failed payment** | `app/api/webhooks/stripe/route.ts`: `case "invoice.payment_failed": console.warn(...)` — само лог, без нотификация до собственика | 🟠 Важно |
| **C6** | **`clean` template хардкоден accent цвят** | TODO.md: "Fix `clean` template hardcoded accent color (not using `primary_color`)" — `components/templates/Clean.tsx` | 🟠 Важно |
| **C7** | **Super-admin impersonation exit banner** | TODO.md: "Super-admin impersonation banner with exit button" — cookie `SUPER_ADMIN_SALON_COOKIE` съществува, но няма UI бутон | 🟠 Важно |

### 2.2 Постепенно — след launch

| # | Пропуск | Бележка |
|---|---------|---------|
| **P1** | **Analytics injection** | Полета `facebook_pixel_id`, `gtm_id`, `clarity_id`, `capi_token` съществуват в `tenants` таблицата, но не са намерени инжектирани в шаблоните |
| **P2** | **Auto-deactivate изтекли салони** | `expiry_date` и `grace_until_date` колоните съществуват в migrations; `billing-expiry` cron job съществува, но точната логика за деактивация не е верифицирана |
| **P3** | **Client portal** | Не съществува — само admin панел. Клиентите нямат достъп до история на резервациите си |
| **P4** | **Onboarding wizard** | Не съществува — новите салони попадат директно в admin панела |
| **P5** | **SMS (Twilio) продукционна конфигурация** | `lib/sms.ts` е stub — `sendSMSReminder()` не е конфигурирана с реален Twilio account |
| **P6** | **GDPR data export** | `DELETE /api/gdpr/delete-request` съществува; не е намерен `GET /api/gdpr/export` endpoint |
| **P7** | **Webhook transaction safety** | При `activateTenant()` в Stripe webhook: DB update успява → email fail → няма rollback. Stripe ще retry, но DB идемпотентността не е верифицирана за email logs |
| **P8** | **Statistics/analytics dashboard** | TODO.md изрично: "Statistics dashboard" — не съществува |
| **P9** | **Паралелни услуги (pro план)** | `lib/scheduling.ts` има `generateParallelSlots()`, но UI за избор на паралелна услуга не е намерен в BookingFlow |
| **P10** | **In-memory rate limiter не е cluster-safe** | `lib/rate-limit.ts`: при липса на Upstash Redis, rate limiting работи само per-instance — Vercel serverless = отделни instances |

---

## 3. Покритие на тестовете

### 3.1 Съществуващи тестове

| Файл | Тип | Тества |
|------|-----|--------|
| `tests/settings-clear-behavior.test.ts` | Unit | Zod schema валидация (social URLs, maps clearing, lat/lng pairs) |
| `tests/safe-tenant-public-image.test.ts` | Unit | URL whitelist за tenant public images |
| `tests/integration/admin-boundary-protection.test.ts` | Integration | Super-admin page/API изолация |
| `tests/integration/tenant-api-isolation.test.ts` | Integration | Cross-tenant data access (Tenant A ≠ Tenant B) |
| `tests/integration/storage-boundary-isolation.test.ts` | Integration | Supabase Storage RLS per-tenant |
| `tests/integration/host-bound-public-api-enforcement.test.ts` | Integration | Public APIs отхвърлят hostname/slug mismatch |

### 3.2 Нови тестове (добавени от одита)

| Файл | Тества |
|------|--------|
| `tests/scheduling.test.ts` | `timeToMinutes`, `minutesToTime`, `calculateComplexDuration`, `generateSlots` |
| `tests/finance-abc.test.ts` | `averageWorkingDaysPerMonth`, `productiveMinutesPerMonth`, `totalMonthlyOverheadEur`, `costPerMinuteEur`, `netPriceEur`, `averageServiceDurationMinutes`, `buildAbcRows` |
| `tests/phone.test.ts` | `normalizePhone` — 08XXXXXXXX, 00359, +359, strip форматиране, idempotent |

### 3.3 Критична бизнес логика все още без покритие

| Модул | Причина за пропуск |
|-------|-------------------|
| `lib/booking-mutations.ts` | Изисква Supabase connection — подходящ за integration тест |
| `lib/google-calendar.ts` | Изисква Google OAuth — подходящ за mock/integration тест |
| `lib/email.tsx` | Изисква Resend API — подходящ за mock тест |

---

## 4. Резултати от тестовете

> Изпълнени: 2026-05-11

```
npx tsc --noEmit → 0 грешки

npm test:
  ✔ 84 теста преминаха   ✗ 0 провалени   ⊘ 0 пропуснати
  duration: ~530ms

Разбивка по файл:
  tests/settings-clear-behavior.test.ts   →  7 теста   (Zod schema settings)
  tests/safe-tenant-public-image.test.ts  →  3 теста   (URL whitelist)
  tests/scheduling.test.ts                → 22 теста   (timeToMinutes, minutesToTime, calculateComplexDuration, calculateDuration, generateSlots)
  tests/finance-abc.test.ts               → 32 теста   (averageWorkingDaysPerMonth, productiveMinutesPerMonth, totalMonthlyOverheadEur, costPerMinuteEur, netPriceEur, averageServiceDurationMinutes, buildAbcRows)
  tests/phone.test.ts                     → 20 теста   (normalizePhone — всички варианти на форматиране и prefix)
```

**Ключови верифицирани поведения:**
- `calculateComplexDuration("short","thin")` → weight=0, дава MIN стойности от матрицата ✔
- `calculateComplexDuration("long","thick")` → weight=1, дава MAX стойности ✔
- `generateSlots()` коректно изключва cancelled/no_show резервации ✔
- `generateSlots()` поставя magnetic слотове на първо място ✔
- `costPerMinuteEur(_, 0)` → 0 (без division-by-zero) ✔
- `netPriceEur(120, true)` → 100 (÷1.2 ДДС) ✔
- `normalizePhone("0888 123 456")` → `"+359888123456"` ✔
- `normalizePhone(normalizePhone(x))` === `normalizePhone(x)` (idempotent) ✔

---

## 5. Архитектурни наблюдения

### Силни страни

- **RLS изолацията** е последователна — всяка таблица има политики per salon_slug
- **Zod валидацията** е строга — URL allowlisting, hex color regex, phone regex
- **Stripe webhook идемпотентност** — `stripe_events` таблица предотвратява двойна обработка
- **Middleware** покрива 4 различни routing сценария (root domain, subdomain, path-based, custom domain)
- **Booking conflict prevention** на DB ниво (EXCLUSION constraint) — не само на application ниво
- **Magnetic scheduling** е имплементиран изцяло в `lib/scheduling.ts` без external deps

### Технически дълг

- `lib/tenant-db.ts` е 16KB монолит — всички DB заявки на едно място. При растеж ще трябва разделяне по домейн
- `middleware.ts` е 442 реда — tenant resolution + rate limiting + auth в един файл
- In-memory rate limiter fallback не е cluster-safe (виж P10)
- Липса на database transaction при Stripe webhook (виж P7)

---

## 6. Следващи задачи (приоритизирани)

### Незабавно (преди launch)

- [ ] **C1** Свърши DNS salonapp.pro → Vercel (DevOps задача)
- [ ] **C2** Добави Stripe env vars в Vercel Dashboard
- [ ] **C3** Регистрирай Stripe webhook endpoint в Dashboard
- [ ] **C4** Имплементирай `/api/unsubscribe` endpoint
- [ ] **C5** Добави dunning email при `invoice.payment_failed`
- [ ] **C6** Fix `clean` template да използва `primary_color` вместо хардкоден цвят
- [ ] **C7** Добави super-admin impersonation exit banner в `app/admin/(protected)/layout.tsx`

### Скоро (след launch)

- [ ] **P1** Инжектирай tracking pixels (FB, GTM, Clarity) в публичните шаблони
- [ ] **P2** Верифицирай auto-deactivate логиката в `billing-expiry` cron
- [ ] **P5** Конфигурирай Twilio за SMS напомняния
- [ ] **P6** Добави GDPR data export endpoint
- [ ] **P10** Мигрирай rate limiter към Upstash Redis в продукция

### По-нататък

- [ ] **P3** Client portal
- [ ] **P4** Onboarding wizard
- [ ] **P8** Statistics/analytics dashboard
- [ ] **P9** UI за паралелни услуги (pro план)
- [ ] Google Calendar реална продукционна верификация с "The Skin" салон
