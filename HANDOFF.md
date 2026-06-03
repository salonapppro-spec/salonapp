# HANDOFF — последна актуализация: 2026-05-14

---

## 2026-06-03 — Redesign: desktop AdminShowcase section

**Промяна:** В `components/landing/AdminShowcase.tsx` desktop layout-ът е преработен от ляво-залепен phone mockup + празно пространство към центриран `max-w-[1450px]` grid. Phone mockup-ът е по-голям визуален anchor, floating cards са с по-мек shadow, а copy/tabs/features/stat блоковете са в подредена дясна колона.

**Цел:** Секцията "Админ панел" да запълва страницата естествено на desktop и да изглежда като завършен product showcase, не като малък елемент вляво с празно поле вдясно.

**Проверка:** `npx tsc --noEmit` минава чисто. Headless Chrome проверка:
- 1920x980: `scrollWidth=1920`, section width `1920`
- 390x844: `scrollWidth=390`, section width `390`

---

## 2026-06-03 — Fix: landing hero композиция

**Промяна:** В `app/page.tsx` hero mockup-ът `hero-mockup-new.png` е центриран вертикално, намален до `86%` от hero височината и дръпнат навътре от десния край (`right: 9.5%`). Текстовата колона е разширена до `48%`, центрирана вертикално и с по-голям desktop ляв отстъп. Mobile hero image-ът вече използва същия `hero-mockup-new.png` вместо стария `mobile-mockup.png`.

**Цел:** Hero image-ът стои по-близо до текста, двата елемента са по-центрирани и има повече въздух от краищата на desktop.

**Проверка:** `npx tsc --noEmit` минава чисто. Headless Chrome проверка:
- 1920x952: mockup `left=921`, `right=1738`, `scrollWidth=1920`
- 390x844: desktop mockup скрит, mobile `hero-mockup-new.png` видим, `scrollWidth=390`

---

## 2026-05-23 — Fix: horizontal scroll на Magnetic Eyes

**Проблем:** Публичният сайт на tenant `magnetic-eyes` имаше хоризонтален скрол на mobile.

**Fix:** В `components/tenants/magnetic-eyes/Page.tsx` са добавени responsive правила за свиване/пренасяне на дълги CTA текстове, stack layout за услугите на mobile, корекция на `about` stats grid-а и wrapping за FAQ/contact/footer текстове. Добавен е scoped `overflow-x: clip` на `.me-root` като предпазна мрежа.

**Допълнение:** Hero снимката на mobile вече се crop-ва към лицето/окото (`background-position: 86% top`) вместо към ухото; hero бутоните се подреждат един под друг на mobile.

**Допълнение 2:** Добавен е document-level lock за horizontal scroll (`me-no-x-scroll` class върху `html` и `body`) при mount на Magnetic Eyes, защото Samsung/mobile browser все още позволяваше плъзване надясно въпреки root overflow guard-а.

**Проверка:** Локално през headless Chrome:
- 375px viewport: `scrollWidth = 375`, `overflow = 0`, offenders: `[]`
- 320px viewport: `scrollWidth = 320`, `overflow = 0`, offenders: `[]`
- Hero mobile check: `heroPosition = 86% 0%`, `heroButtons = column`, `overflow = 0`
- Forced horizontal scroll check: след `window.scrollTo(200, 0)` → `scrollX = 0`, `html/body overflow-x = hidden`, offenders: `[]`
- `npx tsc --noEmit` минава чисто.

---

## 2026-05-14 — Поли: Fix на регистрация на нов тенант (задаване на парола)

**Проблем:** Новорегистриран собственик на салон кликва линка от welcome имейла → попада на `/admin/login` (форма за вход) вместо на `/admin/reset-password` (форма за задаване на парола). Потребителят не можеше да си зadadе парола.

**Причина:** `lib/owner-recovery-link.ts` генерираше recovery линк с `redirectTo: /admin/login`. След като Supabase верифицираше токена, изпращаше потребителя към `/admin/login` с токени в hash фрагментите. Middleware-ът не улавяше recovery параметрите на `/admin/login` (само улавяше на `/`). Страницата `/admin/reset-password` имаше цялата логика за обработка, но потребителят никога не стигаше до нея.

**Fix:** Сменен `redirectTo` от `/admin/login` на `/admin/reset-password` в `lib/owner-recovery-link.ts` (1 ред).

**Деплой:** Качено в Vercel — работи.

### Текущо състояние
- **Регистрационният flow е изправен** — нови тенанти получават welcome имейл, кликват линка, задават парола, влизат в админ панела
- Проектът е production-ready

---

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
