# HANDOFF — 2026-04-20

### 2026-05-05 — Google Calendar интеграция (Phase 1 foundation)

- `supabase/migrations/024_google_calendar_integration.sql`: добавени `tenant_google_integrations` + Google sync/cancel полета в `bookings`.
- `lib/google-calendar.ts`: OAuth helpers (state/signature, token exchange), calendar list и token encryption/decryption.
- `app/api/admin/integrations/google/*`: `start`, `callback`, `status`, `disconnect` endpoints.
- `components/admin/GoogleCalendarIntegrationCard.tsx` + `app/admin/(protected)/settings/page.tsx`: UI карта за свързване/прекъсване и статус.
- `lib/tenant-db.ts` + `types/*`: добавени методи/типове за integration и booking sync metadata.
- Verification: `npx tsc --noEmit` passed.

### 2026-05-05 — Google Calendar интеграция (Phase 2 core sync)

- `lib/google-calendar-sync.ts`: добавен tenant-aware token lifecycle (refresh + needs_reconnect), FreeBusy заявка за ден и booking→Google event sync.
- `app/api/bookings/route.ts`: slot генераторът вече включва Google FreeBusy като допълнителни busy интервали.
- `lib/booking-mutations.ts`: преди запис прави повторна проверка срещу Google busy; след запис пуска async sync към Google event.
- `app/api/admin/integrations/google/apply-change/route.ts`: inbound apply route за move/cancel от Google към local booking.
- `lib/email.tsx`: нов `sendCancellationEmailFromGoogle()` за имейл при анулация от Google.
- Verification: `npx tsc --noEmit` passed.

### 2026-05-05 — Google Calendar интеграция (Phase 3 inbound automation)

- `supabase/migrations/025_google_watch_channels.sql`: добавени watch channel/sync token полета в `tenant_google_integrations`.
- `lib/google-calendar.ts`: добавени watch API, events.list (sync token), event PATCH/DELETE helpers.
- `lib/google-calendar-sync.ts`: автоматично регистриране/подновяване на watch, webhook notification processing и inbound apply към bookings.
- `app/api/admin/integrations/google/webhook/route.ts`: endpoint за Google push notifications.
- `app/api/cron/google-watch-renew/route.ts`: cron endpoint за подновяване на watch каналите.
- `app/api/admin/bookings/[id]/route.ts`: booking update/delete вече синхронизира и към Google event lifecycle.
- Midnight clamp fix: Google busy интервалите се ограничават коректно в рамките на деня при slot generation.
- Verification: `npx tsc --noEmit` passed.

### 2026-04-22 — Security fix: cron API auth

- `lib/cron-auth.ts`: added shared fail-closed `CRON_SECRET` Bearer validation.
- `app/api/cron/reminders/route.ts`, `app/api/cron/billing-expiry/route.ts`: removed `x-vercel-cron` as an auth bypass; cron jobs now require `Authorization: Bearer <CRON_SECRET>`.
- `README.md`: documented Vercel `CRON_SECRET` env and manual curl tests.
- Production note: Vercel project must have `CRON_SECRET` set; Vercel Cron sends it automatically as the Authorization header.

### 2026-04-22 — Security fix: design tokens Stored XSS

- `schemas/design-tokens.ts`: design tokens now use strict Zod validation with font/radius allowlists and constrained CSS length patterns.
- `app/super-admin/actions.ts`: `saveDesignTokens` validates with `SaveDesignTokensSchema.safeParse` before writing to `tenants.design_tokens`.
- `lib/design-tokens.ts`: saved tokens are parsed before merge; invalid stored values fall back to safe defaults.
- `app/(public)/[salon_slug]/page.tsx`: removed token-driven `<style dangerouslySetInnerHTML>` and now renders CSS variables via a React `style` object; builder preview updates also validate token values before applying them.
- Verification: `npx tsc --noEmit` and `npm run build` passed.

### 2026-04-22 — Security fix: booking service integrity

- `schemas/booking.ts`: public/admin booking payload now requires only `service_id` and no longer trusts client-sent `service_name`, `service_price_eur`, or `service_duration`.
- `lib/booking-mutations.ts`: booking creation now loads the active service server-side by `salon_slug + service_id`, validates specialist ownership, calculates complex duration server-side, and inserts DB-derived name/price/duration.
- `components/booking/BookingFlow.tsx`, `components/admin/QuickBooking.tsx`, `components/templates/InlineBookingForm.tsx`: forms now send only `service_id` plus date/time/contact details.
- Verification: `npx tsc --noEmit` and `npm run build` passed.

## От: Лина → За: Поли

---

### Какво направих в тази сесия

**1. `middleware.ts` — Routing за Vercel preview URL**
- **Проблем:** `salonapp-ten.vercel.app/salon-bizhu` не зареждаше салона — middleware връщаше early без да постави `x-salon-slug` header.
- **Промяна:** Добавена логика за `*.vercel.app` хостове — извлича първия path сегмент като `salon_slug`, идентично с localhost behavior.
- **Файл:** `middleware.ts`, блока `if (isVercelDeploymentHost(hostname))`

**2. `schemas/settings.ts` — Цветът на салона не се запазваше**
- **Проблем:** `UpdateTenantPublicFieldsSchema` нямаше поле `primary_color` → Zod тихо го изтриваше преди DB update → цветът никога не стигаше до базата.
- **Промяна:** Добавено `primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional()`
- **Файл:** `schemas/settings.ts`, ред 23

**3. `app/super-admin/actions.ts` — Шаблонът не се отразяваше веднага на сайта**
- **Проблем:** `updateTenantBasics` revalidate-ваше само супер-админ страниците, не публичния сайт → до 60 секунди закъснение.
- **Промяна:** Добавен `revalidatePath(\`/${salonSlug}\`)` след запазване.
- **Файл:** `app/super-admin/actions.ts`, ред ~118

**4. `app/super-admin/[salon_slug]/page.tsx` + `actions.ts` — Успешен feedback при запазване**
- **Проблем:** Натискаш "Запази промените" — нищо не се случва видимо, нямаше потвърждение.
- **Промяна:** `updateTenantBasics` прави redirect към `?saved=1`; страницата показва зелен банер.
- **Файлове:** `app/super-admin/[salon_slug]/page.tsx` (banner), `app/super-admin/actions.ts` (redirect)

**5. `app/api/webhooks/stripe/route.ts` — Stripe webhook за автоматично активиране**
- **Нов файл:** Обработва `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`.
- При успешно плащане: обновява `status`, `expiry_date`, `grace_until_date` + изпраща имейл чрез Resend.

---

### Състояние на проекта СЕГА

| | |
|---|---|
| **Branch** | `main` |
| **Последен commit** | `cdcde84` — Add PROJECT_STATUS.md |
| **Vercel deploy** | Качено на `salonapp-ten.vercel.app` — билдва автоматично при push |
| **Некомитнати промени** | Не |
| **TypeScript грешки** | Няма (`npx tsc --noEmit` минава чисто) |

---

### Какво РАБОТИ ✅

- Публичен сайт на салоните — 6 шаблона (bloom, luxe, luxe2, bold, zen, groom)
- Routing: `salonapp-ten.vercel.app/salon-bizhu` ✅ | `salon-bizhu.salonapp.pro` ⚠️ (чака DNS)
- Inline форма за резервации вградена в всички шаблони
- Салонски админ панел: dashboard, резервации, клиенти, услуги, галерия, настройки
- Цветова палитра в настройките — 6 preset + custom hex → записва се и се вижда на сайта
- Галерия — drag-and-drop upload, toggle видимост
- Супер-админ панел: таблo, всички тенанти с филтри, детайл, заявки (leads)
- Смяна на шаблон от супер-админа → веднага се отразява на сайта
- Ръчно активиране от супер-админ (банков превод) + изпраща имейл
- Stripe webhook за автоматично активиране при плащане
- Stripe Payment Link с префилнат имейл в детайл на тенант
- Нов тенант от супер-админа → създава auth user + изпраща welcome имейл с link за парола
- Имейли чрез Resend при: нов тенант, активиране, Stripe плащане
- Rate limiting: bookings (40/min), leads (15/min)

---

### Какво Е СЧУПЕНО СЕГА ❌

| Проблем | Файл/Място | Бележка |
|---------|-----------|---------|
| `salon-bizhu.salonapp.pro` → DNS грешка | DNS / Vercel Settings | Домейнът `salonapp.pro` не е свързан с Vercel — не е код проблем |
| `clean` шаблон игнорира `primary_color` | `templates/Clean.tsx`, ред ~19 | Ползва hardcoded `#0066CC` вместо `tenant.primary_color` |
| Stripe ENV не са в Vercel | Vercel → Settings → Env Vars | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, payment link URLs |
| Stripe webhook не е регистриран | Stripe Dashboard | Endpoint `https://salonapp.pro/api/webhooks/stripe` трябва да се добави |
| Няма автоматична деактивация | Няма cron job | Салони с изтекъл `grace_until_date` остават `active` |

---

### Следваща задача за Поли

**Задача 1 — Оправи `clean` шаблона (15 минути)**
- Файл: `templates/Clean.tsx` (или `app/(public)/templates/Clean.tsx` — провери точния път)
- Проблем: Хардкодиран цвят `const ACCENT = "#0066CC"` не чете `primary_color` на салона
- Направи:
  1. Намери реда с `const ACCENT = "#0066CC"` (или подобен)
  2. Смени на: `const ACCENT = tenant.primary_color ?? "#0066CC";`
  3. Увери се че `tenant` prop се подава на компонента

**Задача 2 — Банер при влизане в салонски акаунт от супер-админ**
- Файл: `app/admin/layout.tsx` (или `app/admin/(protected)/layout.tsx`)
- Проблем: Супер-админ влиза в чужд акаунт — няма индикация кой акаунт гледа
- Направи:
  1. Прочети cookie `super_admin_impersonate_salon` (или `SUPER_ADMIN_SALON_COOKIE` от `lib/admin-tenant.ts`)
  2. Ако cookie присъства → показвай горен банер: `"⚠️ Гледаш като: [Salon Name] — Излез"`
  3. Бутонът "Излез" → server action, изтрива cookie, redirect към `/super-admin`

**Задача 3 — Свързване на домейна (НУЖНО от Лина, не код)**
- Верcel → Settings → Domains → добави `salonapp.pro` и `*.salonapp.pro`
- DNS: `A` запис `@` → `76.76.21.21`, `CNAME` `*` → `cname.vercel-dns.com`

---

### ВНИМАНИЕ / Не пипай

- `middleware.ts` — логиката за routing е деликатна; промените засягат ВСИЧКИ салони
- `app/super-admin/actions.ts` → `requireSuperAdminUser()` — не махай тази проверка
- `createSupabaseServiceRoleClient()` — само в server actions/API routes, НИКОГА в client компоненти
- `primary_color` — управлява се САМО от салонския админ; супер-админ само чете (read-only swatch)
- Supabase RLS — service role key заобикаля RLS; внимавай какво update-ваш
- Шаблонът `groom` е за мъжки бръснарници — не го смесвай с дамски салон логика
### 2026-05-05 â€” Booking + Google Calendar planning doc

- Added `BOOKING_GOOGLE_SYNC_PLAN_BG.md` in project root.
- Document includes combined booking stabilization plan + clarified Google Calendar two-way sync model.
- Scope is planning only: no code changes to booking flow, middleware, or sync logic.
