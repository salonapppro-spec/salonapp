# HANDOFF — последна актуализация: 2026-05-12

---

## 2026-05-12 — Поли: Планове, super-admin UI, GDPR, analytics, dunning email

**PR #13–19 мержнати и деплойнати.**

### Rename на плановете
- Стари: `standard(19€) | pro(29€) | premium(49€) | collective(49€)`
- Нови: `starter(15€) | standard(19€) | pro(29€) | premium(49€)`
- Migration 026 приложена в production Supabase
- 19 файла обновени (types, schemas, components, pages)
- Super-admin dropdowns показват само **Име — Цена** (без ID)
- `lib/marketing-data.ts` имена: Стартер / Стандарт / Про / Премиум

### Super-admin UI
- Премахнати **Шаблон** и **Цвят** от tenant edit форма (ненужни там)
- CI fix: `app/super-admin/leads/actions.ts` добавен в service-role allowlist

### Unsubscribe endpoint (GDPR)
- `app/api/unsubscribe/route.ts` — GET `?booking=<id>&token=<confirmation_token>`
- Верифицира token, записва `email_unsubscribed=true` в bookings
- Migration 027 (`email_unsubscribed boolean DEFAULT false`) — **приложена от Лина**
- `lib/email.tsx` → URL е `/api/unsubscribe` (беше `/unsubscribe`)
- Reminder cron пропуска bookings с `email_unsubscribed=true`

### Dunning email
- `app/api/webhooks/stripe/route.ts` — `invoice.payment_failed`:
  вече изпраща имейл до `owner_email` с инструкции за обновяване на плащане

### Analytics pixels
- `components/AnalyticsPixels.tsx` — server component, инжектира FB Pixel, GTM, Clarity
- Активира се от super-admin → tenant detail → Facebook Pixel / GTM ID полета
- IDs се санитизират (само `[A-Za-z0-9_-]`) за защита от XSS

### Вече беше готово (одитирано и маркирано):
- Impersonation banner → `app/admin/(protected)/layout.tsx` ред 49-57 ✅
- Clean шаблон primary_color → `Clean.tsx` ред 24 ✅
- Lead нотификация → `lib/lead-notify.ts` ✅
- Auto-деактивация → `billing-expiry` route + `vercel.json` cron ✅

---

## Текущо състояние — 2026-05-12

| | |
|---|---|
| **Branch** | `main` |
| **Vercel deploy** | автоматично при push |
| **TypeScript грешки** | Няма |
| **Unit тестове** | 84/84 ✔ |
| **DB миграции** | 026 + 027 приложени в production |

### Работи ✅
- Всичко от предишния handoff +
- Unsubscribe от имейли (GDPR) ✅
- Dunning email при failed payment ✅
- FB Pixel / GTM / Clarity per tenant ✅
- Планове с правилни имена и цени навсякъде ✅

### Чака ❌ (само Лина)

| Задача | Бележка |
|--------|---------|
| Stripe ENV в Vercel | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, 4x Payment Links |
| Stripe Webhook регистрация | в Stripe Dashboard → `https://salonapp.pro/api/webhooks/stripe` |
| Upstash Redis | без него rate limiting е in-memory (не работи при 100 салона) |

---

# HANDOFF — последна актуализация: 2026-05-11 (нощта)

---

## 2026-05-11 — Поли: Пълен одит на кодовата база + тестове

**Направено:**
- Пълен статичен анализ на 40+ lib модула, 25 миграции, 12 шаблона, 8 admin страници
- Идентифицирани критични пропуски преди launch за 100 салона
- Добавени 74 нови unit теста за критичната бизнес логика:

| Файл | Тестове | Тества |
|------|---------|--------|
| `tests/scheduling.test.ts` | 22 | Slot generation, complex duration 3×3 matrix, magnetic slots, buffer minutes |
| `tests/finance-abc.test.ts` | 32 | ABC analysis, VAT, cost/minute, margin bands, buildAbcRows |
| `tests/phone.test.ts` | 20 | normalizePhone — всички варианти и edge cases |

- `package.json` → `npm test` актуализиран да включва новите тестове (84 total, 0 failing)
- `AUDIT_AND_TODO.md` — пълна документация на одита в корена на проекта

**Резултати от тестовете:** `npx tsc --noEmit` → 0 грешки | `npm test` → 84/84 ✔

**Нови критични открития (документирани в AUDIT_AND_TODO.md):**
- ❌ Unsubscribe endpoint липсва — `lib/email.tsx` генерира URL но няма handler
- ❌ Dunning email при failed payment — само `console.warn()` в webhook, без нотификация
- ❌ Analytics pixels (`facebook_pixel_id`, `gtm_id`, `clarity_id`) не се инжектират в шаблоните
- ⚠️ In-memory rate limiter не е cluster-safe при Vercel serverless без Upstash Redis

---

## 2026-05-11 — Поли: Имейл нотификация до салона при нова резервация

**Проблем:** Собственикът на салона не получаваше имейл когато клиент запази час от публичния сайт.

**Решено:**
- `lib/email.tsx` — нова функция `sendSalonBookingNotification(booking, tenant)`: изпраща HTML имейл на `owner_email` на салона (fallback на `email`). Съдържа: клиент, телефон, имейл (ако има), услуга, дата/час, бележки.
- `lib/booking-mutations.ts` — извиква `sendSalonBookingNotification` веднага след `sendConfirmationEmail` в `runCreateBooking()`.

**Деплой:** PR #11 merge-нат → `main` → Vercel деплоя автоматично.

**Важно:** Работи само ако `owner_email` е попълнен за тенанта в Supabase. Всички текущи салони (The Skin, Lindy, Еуфория) имат попълнен `owner_email` → работи веднага.

---

## 2026-05-11 — Поли: Нормализиране на телефони / чиста клиентска база

**Проблем:** `0888123456`, `+359888123456`, `+359 888 123 456` се записваха като различни клиенти → дублажи.

**Решено:**
- `lib/phone.ts` (нов) — `normalizePhone()`: `08XXXXXXXX` → `+359XXXXXXXX`, маха интервали/тирета/скоби
- `lib/tenant-db.ts` — нормализира при `upsertByPhone` и `lookupByPhone`
- `lib/data.ts` — нормализира при lookup и търсене на резервации
- `lib/booking-mutations.ts` — нормализира `client_phone` при всяка резервация
- `app/api/clients/lookup/route.ts` — **бъг fix:** сега връща и `email` (преди само `name` → автофилът с имейл не работеше)
- `app/api/admin/clients/route.ts` + `[id]/route.ts` — нормализира при ръчно добавяне/редактиране
- `supabase/migrations/024_normalize_phone_numbers.sql` — почиства стари данни и слива дублирани клиенти (вече приложена в production)

**Резултат:** Автофил на Име + Имейл при въвеждане на телефон (публичен сайт + Бърз час). Никакви нови дублажи занапред.

---

## 2026-05-05 — Лина: Google Calendar интеграция (Phase 1 — foundation)

- `supabase/migrations/024_google_calendar_integration.sql`: добавени `tenant_google_integrations` + Google sync/cancel полета в `bookings`.
- `lib/google-calendar.ts`: OAuth helpers (state/signature, token exchange), calendar list и token encryption/decryption.
- `app/api/admin/integrations/google/*`: `start`, `callback`, `status`, `disconnect` endpoints.
- `components/admin/GoogleCalendarIntegrationCard.tsx` + `app/admin/(protected)/settings/page.tsx`: UI карта за свързване/прекъсване и статус.
- `lib/tenant-db.ts` + `types/*`: добавени методи/типове за integration и booking sync metadata.
- Verification: `npx tsc --noEmit` passed.

## 2026-05-05 — Лина: Google Calendar интеграция (Phase 2 — core sync)

- `lib/google-calendar-sync.ts`: tenant-aware token lifecycle (refresh + needs_reconnect), FreeBusy заявка за ден и booking→Google event sync.
- `app/api/bookings/route.ts`: slot генераторът включва Google FreeBusy като допълнителни busy интервали.
- `lib/booking-mutations.ts`: повторна проверка срещу Google busy преди запис; async sync към Google event след запис.
- `app/api/admin/integrations/google/apply-change/route.ts`: inbound apply route за move/cancel от Google към local booking.
- `lib/email.tsx`: нов `sendCancellationEmailFromGoogle()` за имейл при анулация от Google.
- Verification: `npx tsc --noEmit` passed.

## 2026-05-05 — Лина: Google Calendar интеграция (Phase 3 — inbound automation)

- `supabase/migrations/025_google_watch_channels.sql`: watch channel/sync token полета в `tenant_google_integrations`.
- `lib/google-calendar.ts`: watch API, events.list (sync token), event PATCH/DELETE helpers.
- `lib/google-calendar-sync.ts`: автоматично регистриране/подновяване на watch, webhook notification processing и inbound apply.
- `app/api/admin/integrations/google/webhook/route.ts`: endpoint за Google push notifications.
- `app/api/cron/google-watch-renew/route.ts`: cron endpoint за подновяване на watch каналите.
- `app/api/admin/bookings/[id]/route.ts`: booking update/delete синхронизира и към Google event lifecycle.
- Midnight clamp fix: Google busy интервалите се ограничават коректно в рамките на деня.
- Verification: `npx tsc --noEmit` passed.

## 2026-05-05 — Лина: Fix BookingCalendar — коса за сложни услуги

- `components/templates/BookingCalendar.tsx`: добавен `hairLength`/`hairDensity` selector при `is_complex=true` услуги.
- Submit disabled докато не са избрани и двете стойности.
- `hair_length` и `hair_density` се изпращат в POST payload.
- Засяга всички шаблони с BookingCalendar (Bloom, Luxe, Luxe2, Zen, Bold, Groom).

---

## 2026-04-22 — Лина: Security fixes

### Cron API auth
- `lib/cron-auth.ts`: shared `CRON_SECRET` Bearer validation (fail-closed).
- `app/api/cron/reminders/route.ts`, `app/api/cron/billing-expiry/route.ts`: `x-vercel-cron` вече не е достатъчен.

### Design tokens Stored XSS
- `schemas/design-tokens.ts`: strict Zod allowlist за font/radius.
- Премахнат `<style dangerouslySetInnerHTML>` — заменен с React `style` object.

### Booking service integrity
- `schemas/booking.ts`: клиентът изпраща само `service_id`; сървърът чете name/price/duration от DB.
- `lib/booking-mutations.ts`: server-side service lookup + specialist ownership validation.

---

## Състояние на проекта — 2026-05-11 (нощта)

| | |
|---|---|
| **Branch** | `main` |
| **Vercel deploy** | `salonapp-ten.vercel.app` — деплоява при push |
| **TypeScript грешки** | Няма |
| **Unit тестове** | 84/84 ✔ (10 стари + 74 нови) |
| **DB миграции** | 025 приложени в production |

### Работи ✅

- Публичен сайт — 8 шаблона (bloom, luxe, luxe2, bold, zen, groom, clean, theskin)
- Routing: `salonapp-ten.vercel.app/salon-bizhu` ✅ | `salon-bizhu.salonapp.pro` ⚠️ (чака DNS)
- Резервации: публична форма + Бърз час в админа
- Автофил на клиентски данни при въвеждане на телефон ✅
- Чиста клиентска база без дублажи ✅
- Салонски админ: dashboard, резервации, клиенти, услуги, галерия, настройки, работни часове, финанси
- Цветова палитра — 6 preset + custom hex → записва и показва на сайта
- Финансов панел: приходи, разходи, ABC анализ, принт
- Супер-админ: всички тенанти, leads, детайл, ръчно активиране, архивиране
- Stripe webhook: автоматично активиране при плащане (код ✅, env vars ⚠️)
- Имейли: нов тенант, активиране, Stripe, анулация от Google, нотификация до салона при резервация ✅
- Rate limiting: Upstash Redis (ако е конфигурирано) + in-memory fallback
- Google Calendar интеграция (OAuth + FreeBusy + sync + webhook) — за `theskin`

### Счупено / Чака ❌

| Проблем | Кой трябва | Бележка |
|---------|-----------|---------|
| `salonapp.pro` DNS не е свързан с Vercel | Лина | A `@` → `76.76.21.21`, CNAME `*` → `cname.vercel-dns.com` |
| Stripe ENV не са в Vercel | Лина | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, payment links |
| Stripe webhook не е регистриран | Лина | в Stripe Dashboard |
| Upstash Redis не е конфигуриран | Лина | без него rate limiting е in-memory (не работи при 100 салона) |
| `clean` шаблон игнорира `primary_color` | Поли | `templates/Clean.tsx` ред ~19 — хардкодиран `#0066CC` |
| Банер при super-admin impersonation | Поли | `app/admin/(protected)/layout.tsx` |
| Автоматична деактивация при изтекъл план | Поли | Vercel Cron Job |
| Unsubscribe endpoint | Поли | URL се генерира, handler липсва |
| Dunning email при failed payment | Поли | само console.warn() в момента |

---

## ВНИМАНИЕ — Не пипай без да разбереш

- `middleware.ts` — засяга ВСИЧКИ салони едновременно
- `app/super-admin/actions.ts` → `requireSuperAdminUser()` — не махай
- `createSupabaseServiceRoleClient()` — само в server/API, НИКОГА в client компоненти
- `primary_color` — само от салонски админ; супер-админ само чете
- Supabase RLS — service role заобикаля RLS; внимавай при UPDATE
- `groom` шаблон — за мъжки бръснарници, не смесвай с дамска логика
- `lib/phone.ts` `normalizePhone()` — ако правиш промени тук, пусни и миграция за DB
- `lib/scheduling.ts` `generateSlots()` — covered с 22 unit теста; промени → пусни `npm test` първо
