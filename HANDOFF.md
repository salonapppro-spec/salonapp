# HANDOFF — последна актуализация: 2026-06-16

---

## 2026-06-16 — PR #63 (Section A hardening) review + merge

**Контекст:** Лина/Cursor разработиха PR #63 (`feature/security-section-a-hardening`) паралелно — RBAC capabilities, confirm/cancel `?salon=` IDOR fix, finance scope fix, admin middleware guard, migration 035. Поискан пълен code review преди merge заради разминаващ се "progress audit" доклад.

**Какво проверих ред по ред:**
- `lib/admin-rbac.ts` — capability модел (owner/technical_admin пълен достъп, specialist_staff само `clients_write`+`schedule_write`) — коректно
- `app/api/confirm/[token]/route.ts`, `app/api/cancel/[token]/route.ts` — потвърдено: запазват atomic conditional UPDATE паттерна от по-ранния P0 sprint, добавят `salon_slug` scope отгоре (IDOR fix) — добра еволюция, не регресия
- `lib/admin-finance-scope.ts` — важен fix: премахнат `user_metadata.specialist_id` fallback (client-settable от самия потребител през Supabase Auth SDK — privilege escalation risk); сега само `app_metadata`
- `lib/email.tsx` — confirm/cancel линкове в reminder имейли вече носят `?salon=`; потвърдих няма други stale референции без него
- Всичките 18 admin API routes — консистентен паттерн: GET (read) = `requireAdminTenantSlugForApi()`, write = `requireAdminCapabilityForApi(capability)`
- Migration 034 + 035 — **потвърдено реално приложени в production** (директна SQL проверка): RLS policies, `bookings_public_insert`/`specialists_public_read` premahнати, `design_tokens` колона, `tenant_google_integrations` таблица
- `middleware.ts` Step 10 (silent fail fix) — вече merge-нат по-рано (PR #61), потвърден правилен

**Намерени и поправени 2 реални проблема (преди merge):**
1. 🔴 **`npm run check:service-role-boundary` щеше да fail-не CI** — нов shared helper `lib/booking-token-action.ts` не беше в allowlist-а, въпреки че routes-ите, от които е extracted (`confirm/[token]`, `cancel/[token]`) вече са. Добавен в `ALLOWED_EXACT`.
2. 🟡 Dead import (`requireAdminTenantSlugForApi`) в `app/api/admin/clients/route.ts`, останал след RBAC рефакторинга — премахнат.

**Дребна находка, без действие:** `tenant_activity_logs`/`tenant_call_tasks`/`lead_call_tasks` имат по 2-3 редундантни super_admin policies (стари + от migration 034) — функционално безвредно (multiple permissive policies просто се OR-ват), само cosmetic cleanup за по-късно.

**Merge:** Fast-forward в `main` (`eb7c23a`), PR #63 автоматично маркиран MERGED от GitHub. Verification: `tsc --noEmit`, `npm run test` (84/84), `npm run lint`, `npm run check:service-role-boundary` — всички минават.

---

## 2026-06-15 — Security Section A hardening (audit comparison)

**Branch:** `feature/security-section-a-hardening` — pushed, **PR #63** (чака merge → Vercel)

### Какво е направено

| ID | Задача | Статус |
|----|--------|--------|
| A1 | Backend RBAC (`owner` / `technical_admin` / `specialist_staff`) на admin write API | ✅ |
| A2 | Finance scope — `specialist_id` само от `app_metadata` (не `user_metadata`) | ✅ |
| A3 | Confirm/cancel линкове — задължителен `?salon=` + lookup по slug+token | ✅ (breaking за стари имейли) |
| A4 | Премахнат `debugDbErrors: true` от admin booking | ✅ |
| A5 | Admin middleware — не само session, изисква salon admin access | ✅ |
| A6 | `googleIntegration.listActive()` без slug | ⏭ пропуснато (Правило 5) |
| A7 | `page_events` anon INSERT | ✅ migration `035` — **applied в Supabase (Лина)** |
| A8 | Schema drift: `design_tokens`, `tenant_google_integrations` | ✅ migration `035` — **applied в Supabase (Лина)** |

**Нови файлове:** `lib/admin-rbac.ts`, `lib/booking-token-action.ts`, `supabase/migrations/035_security_section_a_hardening.sql`

**RBAC capabilities:** `settings_write`, `finances_write`, `clients_export`, `specialists_manage`, `services_write`, `gallery_write`, `clients_write`, `schedule_write` — specialist_staff получава само последните две.

**Засегнати API:** settings, working-hours, upload, financial-settings, expenses, clients (+ export, GDPR delete), specialists, services, gallery (+ upload/reorder/[id]), bookings, blocked-slots; server action `createAdminBooking` → `schedule_write`.

**Verification:** `npx tsc --noEmit`.

**След deploy на код:** тествай confirm/cancel с `?salon=`; admin owner login нормален достъп. Migration `035` — applied в Supabase.

---

## 2026-06-16 — Gmail: потвърдителен имейл — пълна видимост

**Branch:** `feature/email-gmail-full-visibility`

Gmail сгъваше Calendar/контакти/отписване при повторни тестове с един subject (threading). Fix:

1. **Уникален subject** — дата + час + салон (`lib/email.tsx`)
2. **Уникален HTML ref** — `messageRef={booking.id}` + preview с дата/час (`emails/BookingConfirmation.tsx`)
3. **Layout** — контакти в бяла карта, без `<Hr>` преди footer (по-малко „quoted text“)
4. **Headers** — `X-Entity-Ref-ID`, `List-Unsubscribe`
5. **Дата в имейла** — `d MMMM yyyy` вместо ISO `2026-06-17`

**Verification:** `npx tsc --noEmit`.

---

**Branch:** `feature/migration-034-rls-sync`

1. **`034_sync_production_rls.sql`** — документира production security state в repo migrations:
   - RLS + `super_admin` policies на `tenant_activity_logs`, `tenant_call_tasks`, `lead_call_tasks`
   - `DROP bookings_public_insert` (sync с production — anon INSERT блокиран)
   - `DROP specialists_public_read` (публичните сайтове четат specialists през server/service role, не anon PostgREST)
2. **Unsubscribe IDOR fix** — линкът в имейла вече включва `salon=`; route валидира `salon_slug + booking_id + token` и scoped UPDATE
3. **Middleware** — при липсващ Supabase env на tenant subdomain/custom domain → `/temporarily-unavailable` вместо silent passthrough

**След deploy на код:** пусни migration `034` в Supabase SQL Editor (idempotent, no-op ако production вече е sync-нат).

**Verification:** `npx tsc --noEmit`, `npm run test` (84/84).

---

## 2026-06-16 — P1 sprint (6/8 от security audit, 2 умишлено пропуснати)

Продължение на P0 sprint-а по-долу, същата сесия. Branch-workflow: всяка задача отделен branch → tsc/test/lint/boundary check → fast-forward merge в `main` → push → branch delete.

1. **Specialist active validation** — `lib/tenant-db.ts` `specialists.getById()` сега включва `is_active`; `runCreateBooking` отказва при неактивен/несъществуващ специалист (защитава и срещу crafted requests, и срещу легитимен случай: admin деактивира специалист, чиято услуга все още го реферира)
2. **`bookings_public_insert` RLS** — проверка показа policy-то вече не съществува в production (вероятно изтрито при прехода `user_metadata`→`app_metadata`, никога пресъздадено) → anon INSERT е напълно блокиран от RLS. По-сигурно от очакваното, без действие.
3. **Complex услуги hair params** — 0 complex услуги в production в момента (проверено), но fix-нато превентивно: `Math.max(duration_minutes, calculateDuration(service,"long","thick"))` вместо суров `duration_minutes` при липсващи/невалидни hair params
4. **GDPR delete-request persistence** — нов `lib/internal/gdpr-deletion-requests.ts`; route вече пише в `gdpr_deletion_requests` (таблицата вече съществуваше от migration 020, просто никой не пишеше в нея) преди да изпрати email
5. **Super-admin Zod schema** — `UpdateTenantBasicsSchema` в `schemas/tenant.ts`, заменя manual Set-based guards в `updateTenantBasics`; останалите FormData actions имат само 1-2 прости поля, по-нисък риск, оставени за по-късно
6. **Phone enumeration** — нов `clientsLookupPerPhone` policy (5/10мин) в `lib/rate-limit-policies.ts`, прилаган в `/api/clients/lookup` keyed by `salon_slug + normalizePhone(phone)`, върху съществуващия per-IP лимит

**Съзнателно пропуснати:**
- `googleIntegration.listActive()` — изисква Правило 5 разрешение (Google Calendar), не дадено
- Standardize tenant sites на `BookingFlow` (4 сайта: paw-empire, magnetic-eyes, lindy, euphoria) — root cause вече фикснат на middleware ниво (виж P0 sprint #7 по-долу); самият рефакторинг е инвазивен за живи тенанти без visual QA достъп оттук, оставен за отделен sprint

**Verification:** `tsc --noEmit`, `npm run test` (84/84), `npm run lint`, `npm run check:service-role-boundary` — всички минават след всеки от 6-те fix-а.

---

## 2026-06-16 — Security/database audit fix sprint (10 P0 + 5 follow-up)

**Контекст:** Сравнени два независими одита (Claude 12.06 + Cursor 15.06), кръстосани с реалния production DB/код (не само migration файлове), и систематично fix-нати всичките открити проблеми.

**Backup преди всичко:** git tag `backup-pre-audit-fixes-2026-06-16` (push-нат на GitHub) + пълен `pg_dump` на production база в `backups/` (локално, в `.gitignore`, никога не commit-ва се — съдържа PII).

### Какво е направено (всичко merge-нато в `main`, push-нато, deploy-нато)

1. **RLS на `tenant_activity_logs`/`tenant_call_tasks`/`lead_call_tasks`** — оказа се вече оправено в production (одитите четяха само .sql файлове, не живата база)
2. **`specialists_public_read` cross-tenant leak** — вече оправено в production
3. **Migration 026** — грешна таблица (`leads` вместо `platform_leads`); + `platform_leads_plan_check` constraint никога не бил обновен да позволява `'starter'` — нов bug, открит и поправен (corrective migration 032, applied директно в production)
4. **Stripe webhook** — `DELETE` на failed event → `UPDATE status='failed'` (запазва audit trail); `shortenGrace()` при `payment_failed` (7 дни) и `subscription.deleted` (3 дни) вместо да чака пълните 30 дни grace
5. **Confirm/cancel token reuse** — atomic conditional UPDATE вместо SELECT-then-UPDATE; вече не може token да presъздаде `confirmed`/`completed` статус
6. **Cron reminders** — batch+parallelize (`Promise.all`, concurrency=10) вместо последователен loop; премахнат dead `google-watch-renew` cron entry (route не съществувал)
7. **Root domain booking break** (`salonapp.pro/{slug}` → 400 "Missing tenant context") — `middleware.ts` Step 8 сега инферира `x-salon-slug` за `/api/*` от query/Referer; **потвърдено работещо в production от Лина**
8. **`booking_min_notice_minutes`/`booking_window_days`** — вече enforced server-side в `runCreateBooking`, не само UI hint
9. **Phone `"00000"` placeholder** — server (`admin-booking.ts`, `runCreateBooking`) вече отказва вместо да default-ва; после открито и фиксирано същото в `QuickBooking.tsx` (client-side fallback все още пращал `"00000"`) → уникален `anon-<uuid>` per booking
10. **CI scripts** — `check:service-role-boundary`/`test`/`test:integration` бяха referenced в `.github/workflows/ci.yml`, но не съществували в `package.json`; добавени + `tsx` devDependency; 2 реални boundary violations (GDPR confirm, sitemap) поправени чрез `lib/internal/gdpr-export.ts` + `lib/internal/sitemap-tenants.ts`

**Follow-up gaps (намерени при втори review pass):**
- Migration 029 пипа `public.leads`, но таблицата никога не се `CREATE TABLE`-ва в migration history — добавен `CREATE TABLE IF NOT EXISTS` (no-op в production, fix за fresh deploy)
- `QuickBooking.tsx` slots fetch никога не пращал `specialist_id` → грешни free slots на premium multi-specialist салони — извлечена shared `effectiveSpecialistId` логика
- Super-admin impersonation cookie slug никога не се re-verify-вал срещу базата при четене (само при писане) — добавена проверка + activity log при impersonation start
- **Съзнателно пропуснато:** HMAC-signing на impersonation cookie — `httpOnly` вече блокира основния risk vector, ROI нисък

**Bonus:** Trial >30 дни tracking в Super Admin dashboard (нова red urgent секция + stat card).

**Verification:** `npx tsc --noEmit` чисто през цялата сесия; `npm run test` 84/84; `npm run lint` само pre-existing warnings; `npm run check:service-role-boundary` passed.

**Важно техническо откритие:** Local migration файлове и remote Supabase migration history са значително разминати (различни имена при същи timestamp версии) — вероятно от ръчни промени през SQL Editor без проследяване. Не пипано систематично (риск > полза), но `leads`/`platform_leads` drift-ът конкретно е closed.

---

## 2026-06-03 — Fix: mobile forced dark mode on landing

**Проблем:** На някои Android/Samsung браузъри `salonapp.pro` се показваше с тъмен hero фон, а на други със светлия бежов фон. Причината беше глобалният `@media (prefers-color-scheme: dark)` в `app/globals.css`, който сменяше root цветовете при dark mode.

**Fix:** `app/globals.css` вече заключва `color-scheme: only light` и не обръща `--background/--foreground` в dark mode. `app/layout.tsx` добавя `themeColor`, `colorScheme` и meta тагове за light схема, а `app/page.tsx` подсилва същото за landing страницата.

**Проверка:** `npx tsc --noEmit` минава чисто. `npm run build` минава успешно със съществуващи lint warnings.

---

## 2026-06-03 — Redesign: desktop AdminShowcase section

**Промяна:** В `components/landing/AdminShowcase.tsx` desktop layout-ът е преработен от ляво-залепен phone mockup + празно пространство към центриран `max-w-[1450px]` grid. Phone mockup-ът е по-голям визуален anchor, floating cards са с по-мек shadow, а copy/tabs/features/stat блоковете са в подредена дясна колона.

**Допълнение:** Phone mockup-ът е преместен вляво в по-широка visual колона, а floating cards са позиционирани вдясно от телефона в празното пространство преди copy колоната. Така не покриват нито екрана, нито заглавието. `SMS напомняне` е сменено на `Имейл напомняне`, а feature редът `Промени влизат веднага в живо` е премахнат.

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
| ~~`salon-bizhu.salonapp.pro` → DNS грешка~~ | ~~DNS / Vercel Settings~~ | ✅ Домейнът е свързан (2026-06-03) |
| ~~`clean` шаблон игнорира `primary_color`~~ | ~~`templates/Clean.tsx`~~ | ✅ Оправено (шаблонът е и премахнат) |
| ~~Stripe ENV не са в Vercel~~ | ~~Vercel → Settings → Env Vars~~ | ✅ Добавени (2026-06-03) |
| ~~Stripe webhook не е регистриран~~ | ~~Stripe Dashboard~~ | ✅ Регистриран (2026-06-03) |
| ~~Няма автоматична деактивация~~ | ~~Няма cron job~~ | ✅ `billing-expiry` cron е активен |

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
