# SalonApp.pro — TODO

- [x] **Security: cron API auth** — reminders and billing-expiry require `Authorization: Bearer <CRON_SECRET>`; `x-vercel-cron` alone no longer authorizes access
- [x] **Security: design tokens Stored XSS** — strict Zod allowlist validation, safe fallback for stored tokens, no token-driven raw `<style dangerouslySetInnerHTML>`
- [x] **Security: booking service integrity** — server-side service lookup by `salon_slug + service_id`; client no longer controls service name, price, or duration

> Актуализирай след всяка задача. Последна промяна: 2026-07-29

---

## ✅ 2026-07-29 — B2B блог `/blog` + SEO (виж HANDOFF)

- [x] **Блог на `/blog`** — markdown статии (`content/blog/*.md`), списък + единична статия с JSON-LD, sitemap, „Блог" в навигацията, 3 стартови статии
- [x] **GSC достъп за анализи** — service account чете Search Console данни (Domain property)
- [x] **Пренаписване на началната страница за SEO** — хибриден H1 (емоция + ключови думи), keyword-bearing H2-та, нова секция „по тип салон" (long-tail), вътрешни линкове към блога
- [ ] **Още блог статии** — таргет: „софтуер за фризьорски салон", „система за нокти студио" и др. по тип салон
- [x] **AEO/GEO старт** — обновен `public/llms.txt` (реални цени + разграничение от Booksy/Fresha), сравнителна статия „Най-добрите системи за резервации за салони в България" (AI цитира такъв формат). AI видимост baseline: ~10/100 (нов бранд, невидим; конкуренти Booksy/Fresha/Treatwell)
- [ ] **AEO/GEO продължение** — off-site споменавания (отзиви, каталози, форуми); „директен отговор" интро в старите статии; проследяване на AI видимостта след седмици

## 🟡 Facebook реклами (в процес)

- [x] **Meta CAPI сървър** — `lib/meta-capi.ts` (server-side Conversions API, SHA-256 hashing, дедупликация по eventId) + вграден Lead в `app/api/consultation`. **Инертен** докато няма env. Env: `NEXT_PUBLIC_META_PIXEL_ID`, `META_CAPI_ACCESS_TOKEN` (таен), `META_CAPI_TEST_EVENT_CODE` (по избор)
- [x] **Браузър пиксел на маркетинг сайта** — Pixel ID `1579340717259752`; consent-gated чрез нов `MarketingConsent` (CookieBanner + ConsentAnalytics) в root layout; GA4 също минат през consent; fbq Lead на consultation формата със същия eventId като CAPI. Верифицирано: преди consent нищо не се зарежда, след „Приемам всички" пикселът стреля с правилния ID
- [x] **CAPI token в Vercel** — Лина го качи (`META_CAPI_ACCESS_TOKEN`); Pixel ID е hardcoded fallback, така че CAPI работи само с токена
- [ ] **Domain verification** на salonapp.pro в Meta Business Settings (meta-таг/DNS)
- [ ] **Тествай на production** през Events Manager → Test Events (browser Lead + server CAPI Lead → 1 дедупликирана конверсия)
- [ ] **Карта в рекламния акаунт** + пусни първата кампания
- [ ] **Включи GA4 Data API** в проект `salonapp-495413` (после SA чете и GA4)
- [ ] **Отделна URL-prefix GSC property** само за `https://salonapp.pro/` (чисти данни без тенант шум)

---

## ✅ 2026-07-14 — Демо админ панел `/demo` (виж HANDOFF)

- [x] **Интерактивно демо на админа** — истинските компоненти + локален стор; `fetch` към `/api/admin/*` се прихваща в браузъра. Без база, без имейли, без Stripe. Бутон „Разгледай админ панела“ в hero-то.
- [ ] **По желание:** демо на публичния сайт на салона (сега демото е само админ панелът; hero-то има отделен линк „Виж демо салон“)

---

## ✅ 2026-07-08 — Одит на живата база + бекъпи (виж HANDOFF)

- [x] **Per-tenant бекъпи** — `tenant_backups` + pg_cron дневен job (04:30 BG) + restore (merge/replace) + UI в супер-админ tenant детайла + JSON download; migration 039 приложена и верифицирана в production
- [x] **Анти double-booking constraint** — production НЯМАШЕ `bookings_no_overlap`; migration 040 (booking_time→time, booking_end_time добавена+backfill, hair CHECK на английски, exclusion constraint, индекси) приложена и тествана
- [x] **`set_tenant` RPC заключена** — migration 041 (revoke от anon/authenticated)
- [ ] **`salonapp_posts` anon UPDATE policy** — всеки с anon ключа може да пише в social постовете; чака решение на Лина (външна автоматизация може да зависи от нея)
- [ ] **Supabase Auth: включи Leaked password protection** (Dashboard → Auth, 1 клик)
- [ ] **Billing преглед:** `euphoria` изтича 2026-07-10; `thebeast` active без expiry (никога не се деактивира); trial тенанти не се гонят от billing-expiry cron

---

## 🔴 КРИТИЧНО (сега)

Няма директно експлоатируемо. Одитите от 2026-07-06 (пълен codebase + security) намериха проблеми с приоритет по-долу; регресионните тестове за критичните пътища са добавени (branch `feature/audit-regression-tests`).

---

## 🟠 P1 — Находки от одитите 2026-07-06 (виж HANDOFF + SECURITY_AUDIT_2026-07-06.md)

- [x] **Регресионни тестове bookings/payments/calendar/auth** (2026-07-06) — 7 нови unit + 4 нови integration файла; 3 `todo` теста маркират неоправените находки и стават зелени при фикс
- [x] **A1+A3 Reminders: двойни имейли** (2026-07-07) — error check на dedup заявката (fail closed 500); claim-преди-send с освобождаване при провал; migration 037 (уникален индекс `email_logs(booking_id,type) WHERE status='sent'` + дедуп на стари записи) — **миграцията чака apply в production** (backup + off-peak); нов `tests/cron-reminders-dedup.test.ts`; branch `claude/project-audit-bugs-9nggk1`
- [x] **C1 Миграция за `tenants_plan_check`** (2026-07-07) — migration 038 (идемпотентна спрямо production); todo тестът е реален pass
- [x] **B7 `upsertByPhone`** (2026-07-06) — премахнат fallback „00000“; недеструктивен update (празен имейл/име не трият записаните); branch `fix/quick-booking-client-dedup-email`
- [x] **D1 `listUsers()` пагинация** (2026-07-07) — `findAuthUserByEmail` обхожда всички страници (1000/стр.); auth cleanup при tenant delete е реален best-effort
- [x] **A2 Resend throttle/retry** (2026-07-07) — `sendResendHtml` retry ×3 с backoff при 429/5xx; CONCURRENCY 2 + 1.1s/батч (под Resend 2 req/s); `maxDuration 300`; branch `claude/project-audit-bugs-9nggk1`
- [x] **A5 Unsubscribe на GET** (2026-07-07) — GET=потвърждаваща страница, POST=действие; + `List-Unsubscribe-Post` (RFC 8058 one-click)
- [x] **M4 `IMPERSONATION_HMAC_SECRET` fail-closed** (2026-07-07) — verify отхвърля всичко без секрет, sign хвърля ясна грешка; ✅ env var-ът е зададен във Vercel production (потвърдено 2026-07-07 — impersonation работи)
- [x] **M4 follow-up: консуматори на подписаната бисквитка** (2026-07-07) — банерът в /admin показваше raw `slug.hmac`; rename route-ът сравняваше/записваше гол slug; middleware hint-ът тихо изчезна. И трите поправени + нов `tests/impersonation-cookie-consumers.test.ts`; branch `fix/impersonation-signed-cookie-consumers`
- [x] **B3 Формат-валидация на `booking_date`/`booking_time`** (2026-07-06) — regex + реална календарна дата в `schemas/booking.ts`; todo тестът стана зелен; branch `fix/quick-booking-client-dedup-email`
- [x] **M1 `.gitignore`: добави `.env*`** (2026-07-07) — `.env*` игнорирани, само `.env.example`/`.env.local.example` остават track-нати
- [x] **M2 `npm audit fix`** (2026-07-07) — `ws` (high) + `qs` (moderate) затворени; оставащите 23 moderate искат breaking upgrade на next/@sentry (отделна задача)

---

## 🟡 P1 — Section A security hardening (merge-нато в `main`, 2026-06-16)

- [x] **A1 Backend RBAC** — `lib/admin-rbac.ts` + capability checks на admin write API + `createAdminBooking`; проверени всичките 18 admin routes — консистентен GET=tenant-only / write=capability паттерн
- [x] **A2 Finance scope** — `specialist_id` само от `app_metadata` (премахнат `user_metadata` fallback — client-settable, privilege escalation risk)
- [x] **A3 Confirm/cancel tenant scope** — `?salon=` в имейл линкове + scoped lookup/update; потвърдено запазва atomic-update паттерна от по-ранния P0 sprint
- [x] **A4 Admin booking debug** — премахнат `debugDbErrors`
- [x] **A5 Admin middleware** — salon admin access (owner/specialist provisioned), не само logged-in
- [ ] **A6 Google listActive** — пропуснато (Правило 5)
- [x] **A7 page_events** — migration 035 drop anon insert (tracking вече service role) — потвърдено приложено в production
- [x] **A8 Schema drift** — migration 035 `design_tokens` + `tenant_google_integrations` — потвърдено приложено в production
- [x] **PR review fix: service-role boundary allowlist** (2026-06-16) — `lib/booking-token-action.ts` липсваше от `ALLOWED_EXACT`, щеше да fail-не CI

---

## 🟡 P1 — от security audit 2026-06-15/16 (6/8 затворени, 2 умишлено пропуснати)

- [x] **Specialist active validation в `runCreateBooking`** (2026-06-16) — `db.specialists.getById()` сега проверява `is_active`
- [x] **`bookings_public_insert` RLS** (2026-06-16) — проверено: policy-то вече не съществува, anon insert е напълно блокиран от RLS (по-сигурно от очакваното)
- [x] **Complex услуги без hair params** (2026-06-16) — `Math.max(duration_minutes, worstCase)` вместо суров `duration_minutes`; засега 0 complex услуги в production, latent risk closed превентивно
- [x] **GDPR delete-request persistence** (2026-06-16) — пише в `gdpr_deletion_requests` (таблицата вече съществуваше без writer)
- [x] **Super-admin FormData Zod** (2026-06-16) — `UpdateTenantBasicsSchema` добавена за най-рисковата action (`updateTenantBasics`); останалите actions взимат само `salon_slug` + 1 numeric поле, по-нисък риск
- [x] **Phone enumeration на `/api/clients/lookup`** (2026-06-16) — per-phone rate limit (5/10мин) + masked `email_hint` вместо full email в public response
- [x] **CI integration tests enforcement** (2026-06-16) — `INTEGRATION_REQUIRED=1` в CI; fail при липсващи secrets; fix GET clients/lookup host-bound test
- [ ] **`googleIntegration.listActive()`** — НЕ СЕ ПИПА без изрично разрешение от Лина (Правило 5); latent, не извикан никъде в момента
- [x] **Standardize tenant sites на `BookingFlow`** (2026-06-16) — `InlineBookingForm.tsx`/`BookingCalendar.tsx` мигрирани от `fetch('/api/bookings')` към `createBooking()` server action; верифицирано end-to-end с preview на всичките 4 сайта (`paw-empire`, `magnetic-eyes` — пълен submit + booking в DB; `lindynails`, `euphoria` — визуална проверка), без UI/CSS промени

---

## 🟢 ПО-КЪСНО (след launch, при растеж)

- [x] **Migration 035 в Supabase** (2026-06-15) — `page_events` anon insert off + `design_tokens` + `tenant_google_integrations`

---
- [x] **Unsubscribe tenant scope** (2026-06-16) — `salon_slug` в линка + scoped query/update

- [ ] **Cosmetic: redundant RLS policies** — `tenant_activity_logs`/`tenant_call_tasks`/`lead_call_tasks` имат по 2-3 препокриващи се super_admin policies (стари + migration 034 версия); функционално безвредно, чисто cleanup
- [ ] **Google Calendar** — НЕ СЕ ПИПА без изрично разрешение от Лина (кодът е готов, тест при нужда)
- [ ] **Статистика в салонския админ** — графики по месец, топ услуги
- [ ] **Клиентски портал** — клиентът да вижда/отменя резервациите си
- [ ] **SMS (Twilio)** — `lib/sms.ts` е stub, нужен реален акаунт
- [ ] **Финансов панел** — верификация на формули и метрики

---

## ✅ ЗАВЪРШЕНО

- [x] **Fix: TheBeastSite booking frame contrast** (2026-06-16) — `.tb-booking-frame` нямаше фон, светло-тематичният `BookingFlow` текст се губеше на черния fон; добавен `var(--beast-cream)` фон, верифицирано визуално
- [x] **BookingFlow standardization на 4 тенант сайта** (2026-06-16) — виж P1 секцията по-горе
- [x] **Security/database audit fix sprint** (2026-06-16) — 10 P0 (RLS, migration 026 drift + нов constraint bug, Stripe webhook status tracking + grace policy, confirm/cancel token reuse, cron reminders batching, root domain booking 400 fix, booking_min_notice/window enforcement, phone "00000" reject, CI scripts wiring) + 5 follow-up gaps (migration 029 missing CREATE TABLE, QuickBooking phone + specialist_id, impersonation cookie re-verify + audit log) + trial >30 дни dashboard tracking; пълен database backup преди старт; виж HANDOFF.md за детайли
- [x] **Fix: mobile forced dark mode on landing** (2026-06-03) — `app/globals.css`, `app/layout.tsx` и `app/page.tsx` заключват public landing-а в light color scheme, за да не се обръща в тъмен фон на Samsung/Android браузъри
- [x] **Redesign: desktop AdminShowcase section** (2026-06-03) — `components/landing/AdminShowcase.tsx` вече е центриран two-column product showcase с голям phone mockup, изнесени floating cards, email reminders copy и desktop/mobile проверка без horizontal scroll
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
