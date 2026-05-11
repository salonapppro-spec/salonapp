# HANDOFF — последна актуализация: 2026-05-11

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

**Резултат:** Автофил на Име + Имейл при въвеждане на телефон (публичен сайт + Бърз час). Фризьорът не пише пак данните на редовните клиенти. Никакви нови дублажи занапред.

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

## Състояние на проекта — 2026-05-11

| | |
|---|---|
| **Branch** | `main` |
| **Vercel deploy** | `salonapp-ten.vercel.app` — деплоява при push |
| **TypeScript грешки** | Няма |
| **DB миграции** | 024 normalize phones — приложена в production |

### Работи ✅

- Публичен сайт — 6 шаблона (bloom, luxe, luxe2, bold, zen, groom)
- Routing: `salonapp-ten.vercel.app/salon-bizhu` ✅ | `salon-bizhu.salonapp.pro` ⚠️ (чака DNS)
- Резервации: публична форма + Бърз час в админа
- Автофил на клиентски данни при въвеждане на телефон ✅ (ново)
- Чиста клиентска база без дублажи ✅ (ново)
- Салонски админ: dashboard, резервации, клиенти, услуги, галерия, настройки
- Цветова палитра — 6 preset + custom hex → записва и показва на сайта
- Супер-админ: всички тенанти, leads, детайл, ръчно активиране
- Stripe webhook: автоматично активиране при плащане
- Имейли чрез Resend: нов тенант, активиране, Stripe, анулация от Google
- Rate limiting: bookings (40/min), leads (15/min)
- Google Calendar интеграция (OAuth + FreeBusy + sync + webhook) — за `theskin`

### Счупено / Чака ❌

| Проблем | Кой трябва | Бележка |
|---------|-----------|---------|
| `salonapp.pro` DNS не е свързан с Vercel | Лина | A `@` → `76.76.21.21`, CNAME `*` → `cname.vercel-dns.com` |
| `clean` шаблон игнорира `primary_color` | Поли | `templates/Clean.tsx` ред ~19 — хардкодиран `#0066CC` |
| Stripe ENV не са в Vercel | Лина | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, payment link URLs |
| Stripe webhook не е регистриран | Лина | `https://salonapp.pro/api/webhooks/stripe` в Stripe Dashboard |
| Няма автоматична деактивация при изтекъл план | Поли | Cron job или pg_cron |
| Банер при super-admin impersonation | Поли | `app/admin/(protected)/layout.tsx` |

---

## ВНИМАНИЕ — Не пипай без да разбереш

- `middleware.ts` — засяга ВСИЧКИ салони едновременно
- `app/super-admin/actions.ts` → `requireSuperAdminUser()` — не махай
- `createSupabaseServiceRoleClient()` — само в server/API, НИКОГА в client компоненти
- `primary_color` — само от салонски админ; супер-админ само чете
- Supabase RLS — service role заобикаля RLS; внимавай при UPDATE
- `groom` шаблон — за мъжки бръснарници, не смесвай с дамска логика
- `lib/phone.ts` `normalizePhone()` — ако правиш промени тук, пусни и миграция за DB
