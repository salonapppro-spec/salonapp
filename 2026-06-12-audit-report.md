# MASTER AUDIT REPORT — SalonApp.pro

**Дата:** 2026-06-12  
**Статус:** ⚠️ PARTIAL — Критични проблеми изискват незабавно действие  
**Агенти:** 6 специализирани (Functional Flow, Booking, Multi-Tenant, Security, Database/RLS, Code Quality)

---

## 1. Executive Summary

Архитектурата е солидна — multi-tenant routing, `tenantDb()` wrapper, RLS с `app_metadata`, EXCLUDE constraint за bookings. Системата е добре замислена. Но има конкретни пропуски, седем от които са production-критични.

### Топ 5 критични проблема

1. **Confirmation/cancel tokens не се инвалидират след употреба** — могат да се ползват безкрайно
2. **Migrations 026 и 029 референцират несъществуваща таблица `leads`** — ще fail-нат при deploy
3. **3 нови таблици нямат никакъв RLS** — всеки authenticated user може да чете/пише данни на всички салони
4. **Cron `/api/cron/reminders` връща bookings от ВСИЧКИ салони** без `salon_slug` филтър
5. **`/api/unsubscribe` няма tenant validation** — IDOR, може да unsubscribe клиент на друг салон

### Какво работи добре

- Tenant routing (middleware) — правилно имплементиран за subdomain/path/custom domain
- `tenantDb()` wrapper — автоматично scope-ва всички queries
- RLS policies с `app_metadata` (не `user_metadata`) — правилно след migration 018
- EXCLUDE constraint за double-booking — решава race condition на DB ниво
- Booking token entropy (UUID `gen_random_uuid()`) — криптографски сигурен
- Image upload security — magic bytes + WebP ре-енкодинг
- Storage policies — изолирани по `salon_slug` path
- GDPR anonymization и deletion endpoints — имплементирани

### Какво е критично

Token reuse, missing RLS на нови таблици, грешни table names в migrations, unscoped cron query, IDOR в unsubscribe.

---

## 2. Critical Fixes

| Priority | Area | Problem | Why It Matters | Fix |
|----------|------|---------|----------------|-----|
| 🔴 P0 | Token Security | `confirm/[token]` и `cancel/[token]` не маркират token като използван. Може да се преизползва безкрайно. | Клиент с потвърдителен линк може да отменя/потвърждава резервации многократно | Добави `confirmed_at`/`cancelled_at` timestamp. Провери `IS NULL` преди action. Маркирай **преди** изпълнение. |
| 🔴 P0 | DB Migrations | Migration 026 и 029 пишат `UPDATE leads` / `ENABLE RLS ON leads` — таблицата се казва `platform_leads` | Migrations ще fail-нат при следващ deploy; planning data и RLS ще се изпуснат | Провери дали са изпълнени успешно. Ако не — корективна migration с правилното table name. |
| 🔴 P0 | RLS — нови таблици | `tenant_activity_logs`, `tenant_call_tasks`, `lead_call_tasks` нямат `ENABLE ROW LEVEL SECURITY` | Всеки authenticated user вижда/пише данни от всички салони | Нова migration: `ALTER TABLE tenant_activity_logs ENABLE ROW LEVEL SECURITY;` + policies по `salon_slug` |
| 🔴 P0 | Cron unscoped query | `app/api/cron/reminders/route.ts` — query без `salon_slug` филтър връща bookings от ВСИЧКИ салони | Reminder emails може да се изпратят с данни от грешен салон | Добави `.eq("salon_slug", ...)` или итерирай per-tenant през `tenantDb()` |
| 🔴 P0 | IDOR — Unsubscribe | `app/api/unsubscribe/route.ts` — приема `booking_id + token` без tenant context. Може да unsubscribe клиент на друг салон | Privacy violation, GDPR риск | Добави `requireTenantFromHeaders()`. Провери `booking.salon_slug === x-salon-slug` header. |
| 🔴 P0 | Stripe — Event Deletion | Webhook handler трие event от idempotency таблицата при грешка. Event е загубен завинаги, tenant не се активира. | Платен клиент не получава достъп след плащане | Смени `DELETE` на `UPDATE status='failed'`. Добави retry queue или alert. |
| 🔴 P0 | Phone "00000" | `app/actions/admin-booking.ts:28` — при липсващ телефон дефолт е `"00000"`. `upsertByPhone("00000")` слива различни клиенти в един фантомен запис | Корупция в client records | Reject при невалиден телефон. Или генерирай UUID за anonymous clients вместо `"00000"`. |
| 🟠 P1 | GDPR Token Expiry | `app/api/gdpr/export/confirm/route.ts` — не проверява `expires_at`. Изтекъл token (>1 час) все още работи | GDPR compliance риск — expired request може да exportне данни | Добави `WHERE expires_at > NOW()` в token lookup |
| 🟠 P1 | XSS в emails | `app/api/gdpr/delete-request/route.ts`, `app/api/leads/route.ts` — user input (`name`, `details`) вмъква директно в email HTML без escaping | HTML injection в admin/owner email inboxes | HTML-escape всички user inputs преди вмъкване в email templates |
| 🟠 P1 | Google listActive() | `lib/tenant-db.ts` — `googleIntegration.listActive()` без `salon_slug` филтър. Unused, но latent vulnerability | При извикване — всички Google integrations на всички салони са видими | Добави `salon_slug` параметър или изтрий метода |
| 🟠 P1 | Gallery Race Condition | `app/api/admin/gallery/route.ts` и `upload/route.ts` — `count()` + `create()` не са атомични. Concurrent uploads → дублирани `order_index` стойности | Объркан ред на снимките в галерията | Atomic `INSERT ... SELECT MAX(order_index) + 1` или DB sequence |
| 🟠 P1 | Impersonation Cookie | `lib/admin-tenant.ts` — impersonation cookie не е HMAC-signed. Няма audit log за impersonation actions | Super-admin може да tamper-ва стойността. Няма трасировка кой e impersonated кого | Подпиши cookie с HMAC-SHA256. Логвай всеки switch: `{user_id, target_slug, timestamp, ip}` |

---

## 3. Functional Flow Status

| Flow | Status | Risk Level | Notes |
|------|--------|-----------|-------|
| Multi-tenant routing | ✅ OK | LOW | Middleware правилно обработва subdomain/path/custom domain. JWT validation с regex. |
| Public tenant sites | ⚠️ WARNING | MEDIUM | Неизвестни slugs показват "Under Construction" вместо 404 → tenant enumeration |
| Booking flow | ⚠️ WARNING | HIGH | Race condition window (mitigated by EXCLUDE constraint). Token reuse е критичен проблем. |
| Admin flow | ⚠️ WARNING | MEDIUM | Admin calendar не е real-time. Client endpoint разчита на implicit tenant trust. |
| Super-admin flow | ✅ OK | LOW | Impersonation cookie правилно имплементиран. RLS с `app_metadata` е secure. |
| Stripe flow | ❌ BROKEN | CRITICAL | Event deletion при грешка → загубени webhook events. Owner email fallback — риск. |
| Email flow | ⚠️ WARNING | MEDIUM | Silent failures без retry. XSS risk в email templates. |
| Cron jobs | ❌ BROKEN | CRITICAL | Reminders query е tenant-unscoped. Email logs check също. |
| Google Calendar | ℹ️ INFO | LOW | Само outbound template URL. Няма bi-directional sync. Cancellations от GCal не се синхронизират. |
| Supabase RLS | ⚠️ WARNING | CRITICAL | 3 нови таблици без RLS. Migrations 026/029 с грешни table names. |
| TypeScript safety | ⚠️ WARNING | MEDIUM | `as` casts за Supabase responses без runtime Zod validation |
| Server/client boundary | ✅ OK | LOW | `supabase-admin.ts` е server-only. Няма service role leaks в client components. |
| Broken imports | ✅ OK | LOW | Няма broken imports. Смесени relative/absolute imports — minor. |

---

## 4. Security Status

| Area | Status | Risk Level | Notes |
|------|--------|-----------|-------|
| Authentication | ✅ OK | LOW | Supabase Auth правилно имплементиран. Protected routes проверяват auth. |
| Authorization (RLS) | ⚠️ WARNING | CRITICAL | 3 таблици без RLS. `app_metadata` policies иначе са правилни. |
| Token Security | ❌ BROKEN | CRITICAL | Confirm/cancel tokens без инвалидация. GDPR tokens без expiry check. |
| IDOR | ❌ BROKEN | HIGH | `/api/unsubscribe` без tenant validation. Admin clients с implicit trust. |
| CSRF | ⚠️ WARNING | MEDIUM | Няма explicit CSRF tokens. Разчита на SameSite cookies — провери настройката. |
| XSS | ⚠️ WARNING | MEDIUM | Email templates с unescaped user input. Client-facing UI е clean. |
| SQL Injection | ✅ OK | LOW | Supabase SDK parameterized queries. Slug validation с regex. |
| File Uploads | ✅ OK | LOW | Magic bytes + WebP re-encoding — потвърдено от Code Quality агент. |
| Stripe Webhook | ⚠️ WARNING | HIGH | Signature verification е ОК. Owner email fallback е риск. Event deletion е критично. |
| Cron Protection | ⚠️ WARNING | MEDIUM | Само Bearer token. Няма IP allowlist за Vercel cron endpoints. |
| Secrets | ✅ OK | LOW | Service role key не е exposed в client. `NEXT_PUBLIC_` vars са чисти (освен `NEXT_PUBLIC_DEV_SALON_SLUG`). |
| PII/Logging | ⚠️ WARNING | MEDIUM | Email addresses логват се в Stripe webhook handler — маскирай ги. |
| Password Generation | ✅ OK | LOW | `randomBytes(12)` = ~96 bits entropy. Acceptable. |

---

## 5. Tenant Isolation Status

| Area | Status | Risk Level | Notes |
|------|--------|-----------|-------|
| Middleware slug resolution | ✅ OK | LOW | JWT → impersonation cookie order е правилен. |
| Subdomain routing | ✅ OK | LOW | `salon-bizhu.salonapp.pro` → правилно |
| Path routing | ✅ OK | LOW | `salonapp.pro/salon-bizhu` → правилно |
| Custom domain routing | ✅ OK | LOW | RPC lookup с domain, правилно |
| `tenantDb()` wrapper | ✅ OK | LOW | Всички queries автоматично scope-нати по `salon_slug` |
| Admin tenant context | ✅ OK | LOW | `requireAdminTenantSlugForApi()` на всяка admin route |
| Super-admin impersonation | ⚠️ WARNING | MEDIUM | Cookie не е HMAC-signed. Няма audit log за impersonation actions. |
| RLS policies | ⚠️ WARNING | CRITICAL | 3 нови таблици без RLS: `tenant_activity_logs`, `tenant_call_tasks`, `lead_call_tasks` |
| Service role usage | ⚠️ WARNING | MEDIUM | 13 API routes ползват service role — ad-hoc validation, без централизиран audit log |
| Cron jobs | ❌ BROKEN | CRITICAL | `reminders` route — unscoped query връща data от всички тенанти |
| Public RPC functions | ⚠️ WARNING | LOW | `resolve_tenant_public()` — позволява tenant existence enumeration |
| Google integration | ⚠️ WARNING | HIGH | `listActive()` без slug filter (unused, но latent vulnerability) |
| Specialists public SELECT | ⚠️ WARNING | LOW | Policy позволява `select to anon using (is_active = true)` без tenant scope — leak на имена на служители |

---

## 6. Booking Flow Deep Dive

**Статус: ⚠️ ФУНКЦИОНАЛЕН, но с важни security gaps**

| Step | Status | Problem | Impact | Fix |
|------|--------|---------|--------|-----|
| Service selection | ✅ OK | — | — | — |
| Specialist selection | ✅ OK | — | — | — |
| Availability API | ✅ OK | `generateSlots()` правилно merge-ва bookings + blocked slots + working hours | — | — |
| Working hours | ✅ OK | `is_day_off`, specialist override работят правилно | — | — |
| Blocked slots | ✅ OK | Merge в busy ranges, third as hard blocks | — | — |
| Double-booking prevention | ✅ OK | PostgreSQL EXCLUDE constraint `bookings_no_overlap` | — | — |
| Race condition | ⚠️ WARNING | App-level check → INSERT не е atomic. DB constraint е единствената защита. | HIGH | Документирай зависимостта от constraint. Ако constraint се деактивира — double-booking е възможен. |
| Complex services | ✅ OK | 3×3 interpolation matrix за `hair_length × hair_density` | — | — |
| Confirm token | ❌ BROKEN | Token може да се reuse многократно | CRITICAL | `confirmed_at IS NULL` check + set преди action |
| Cancel token | ❌ BROKEN | Същото като confirm | CRITICAL | Същото |
| Admin calendar | ⚠️ WARNING | Server-rendered, не е real-time. При нова резервация — admin трябва да refresh ръчно. | MEDIUM | Supabase Realtime subscription или polling на 30s |
| Client upsert | ⚠️ WARNING | Phone `"00000"` collision risk при admin bookings без телефон | HIGH | Reject или UUID за anonymous |
| Phone enumeration | ⚠️ WARNING | `/api/clients/lookup` — IP rate limit, но не per-phone. Enumeration е възможна. | MEDIUM | Добави per-phone rate limit |
| Advance notice | ✅ OK | `booking_min_notice_minutes` правилно прилагат при slot generation | — | — |
| Booking upper bound | ⚠️ WARNING | Няма максимален хоризонт. Клиент може да резервира 1 година напред. | LOW | Enforce `booking_window_days` от settings |
| Email on booking | ⚠️ WARNING | Silent failure ако Resend е down. Не се retry-ва. | MEDIUM | Retry 3x с exponential backoff или queue |

### Детайл: Race Condition

```
1. Клиент A проверява slot 10:00–11:00 → свободен
2. Клиент B проверява slot 10:00–11:00 → свободен (едновременно)
3. A изпраща booking → INSERT успешен
4. B изпраща booking → INSERT хваща PostgreSQL 23P01 (EXCLUDE violation)
5. B вижда "Този час току-що беше зает" ← правилно поведение, но само защото constraint съществува
```

**Риск:** Ако constraint се деактивира (дори акцидентно чрез migration error), double-booking е напълно възможен без никаква друга защита.

---

## 7. Database & Migrations Detail

| Table/Function | Issue | Risk | Fix |
|----------------|-------|------|-----|
| `leads` (migrations 026, 029) | Референциран table не съществува. Реалният table е `platform_leads` | CRITICAL | Провери изпълнение. Корективна migration ако failed. |
| `tenant_activity_logs` | Без RLS | CRITICAL | `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` + policy |
| `tenant_call_tasks` | Без RLS | CRITICAL | Същото |
| `lead_call_tasks` | Без RLS | CRITICAL | Същото |
| `working_hours` | Липсва composite index `(salon_slug, day_of_week, specialist_id)` | MEDIUM | `CREATE INDEX` за по-бързи working hours queries |
| `blocked_slots` | Липсва composite index `(salon_slug, blocked_date, specialist_id)` | MEDIUM | Същото |
| `specialists` | Public SELECT policy без tenant scope — leak на имена/bio на служители | LOW | Премахни policy или изисквай auth + salon_slug |
| `gdpr_export_tokens` | RLS enabled, без explicit policies (deny-all по default) — трябва коментар | LOW | Добави `FOR ALL TO public USING (false)` за яснота |
| `page_events` | Public INSERT без ограничение — може да се spam-не | LOW | App-level rate limit |
| Phone normalization | `normalize_bg_phone()` функция е drop-ната след migration. Бъдещи промени няма да нормализират | LOW | Добави permanent функция или application-level validation |

---

## 8. Code Quality Findings

| File | Issue | Type | Risk | Fix |
|------|-------|------|------|-----|
| `app/api/admin/gallery/route.ts` | Race condition: `count()` + `create()` не е atomic. Concurrent uploads → дублиран `order_index` | BUG | MEDIUM | Atomic `INSERT ... SELECT MAX(order_index) + 1` |
| `app/api/admin/gallery/reorder/route.ts` | Sequential loop от individual UPDATE queries. 100 снимки = 100 round-trips. Partial update при failure. | PERF | MEDIUM | Batch UPDATE с `CASE` statement |
| `app/api/webhooks/stripe/route.ts` | Email send errors catch-нати с `.catch()` и логнати, но не се retry-ват. Critical за dunning. | BUG | MEDIUM | Queue за retry или alert в dashboard |
| `lib/booking-mutations.ts:70` | `normalizePhone(rawPhone) \|\| rawPhone` — fallback към оригинал при failed normalization. Невалидни телефони минават. | BUG | MEDIUM | Reject при failed normalization вместо fallback |
| `lib/booking-mutations.ts:123-125` | Boundary check `serviceEnd > 24*60` не включва buffer minutes. Booking може да завърши след полунощ. | BUG | LOW | Добави buffer: `if (serviceEnd + bufferMinutes > 24 * 60)` |
| `app/super-admin/layout.tsx` | `isSuperAdminRole()` дефинирана на 3 места: `lib/routing/auth-guard.ts`, `lib/super-admin-auth.ts`, `app/super-admin/layout.tsx` | BUG | MEDIUM | Единствен source в `lib/auth-utils.ts`, import навсякъде |
| `lib/booking-mutations.ts:102,166,221` | `as HairLength`, `as Array<{...}>`, `as Booking` — casts без runtime validation | STYLE | MEDIUM | Zod schemas за Supabase responses вместо `as` casts |
| `app/api/admin/clients/[id]/route.ts` | GET връща 404 при липсващ телефон. DELETE връща 400. Inconsistent error codes за same condition. | STYLE | LOW | Нормализирай: двете да връщат 404 |
| `lib/tenant-db.ts:80` | Non-null assertion `sorted[0]!` без explicit length check (макар предишен check го covers) | STYLE | LOW | Добави explicit guard за яснота |

---

## 9. Recommended Fix Order

### 🔴 Спешно — преди следващ производствен deploy

1. Провери дали migrations 026 и 029 са изпълнени успешно (`leads` vs `platform_leads`)
2. Нова migration: `ENABLE ROW LEVEL SECURITY` на `tenant_activity_logs`, `tenant_call_tasks`, `lead_call_tasks` + policies
3. Token inactivation: `confirmed_at`/`cancelled_at` timestamp + `IS NULL` check преди action
4. Cron reminders: добави `salon_slug` scope в query
5. Unsubscribe IDOR: добави tenant validation
6. Stripe event: смени `DELETE` на `UPDATE status='failed'` при грешка

### 🟠 Важно — следващата седмица

7. GDPR token expiry: `WHERE expires_at > NOW()` в confirm route
8. XSS в email templates: HTML-escape всички user inputs
9. Phone `"00000"` default: reject или UUID за anonymous
10. Google `listActive()`: добави `salon_slug` или изтрий метода
11. Impersonation audit log: `{user_id, target_slug, timestamp, ip}`
12. Gallery order_index: atomic INSERT
13. `isSuperAdminRole()`: единствен source of truth

### 🟡 Може по-късно — следващ месец

14. Admin calendar real-time (Supabase Realtime или 30s polling)
15. Phone enumeration rate limit (per-phone, не само per-IP)
16. CSV injection в client export (apostrophe prefix)
17. Cron IP allowlist (Vercel CIDR range)
18. Branded TypeScript type за `TenantSlug`
19. Zod runtime validation на Supabase responses (вместо `as` casts)
20. Booking upper bound (enforce `booking_window_days` от settings)
21. Email retry механизъм (3x exponential backoff)
22. Gallery reorder: batch UPDATE вместо sequential loop

---

## 10. Tests To Add

### Unit Tests

```typescript
// Token security
test("confirmation token cannot be reused after first use")
test("cancellation token cannot be reused after first use")
test("GDPR export token is rejected after expires_at")
test("GDPR export token is rejected if used_at is set")

// Phone validation
test("admin booking with empty phone rejects with 400, not defaults to 00000")
test("phone normalization rejects truly invalid formats without fallback")

// Booking boundaries
test("booking beyond booking_window_days is rejected")
test("booking with service + buffer ending after midnight is rejected")
```

### Integration Tests

```typescript
// Tenant isolation
test("admin from salon A cannot access bookings of salon B via ID guessing")
test("POST /api/unsubscribe without valid salon_slug header returns 400")
test("cron reminders only processes bookings for the correct salon")
test("confirm token from salon A cannot cancel booking in salon B")

// Stripe webhooks
test("webhook event is marked failed (not deleted) on email send error")
test("webhook with duplicate event_id returns 200 without re-processing")
test("webhook with missing customer_id falls back correctly to email lookup")

// GDPR
test("GDPR export token cannot be used after 1-hour expiry")
test("GDPR delete request removes all bookings across all salons for email")
```

### Security Tests

```typescript
// RLS
test("unauthenticated user cannot SELECT from tenant_activity_logs")
test("salon A authenticated user cannot SELECT salon B rows in tenant_call_tasks")
test("service role can access tenant_activity_logs (for cron/admin use)")

// IDOR
test("GET /api/unsubscribe?bookingId=X without salon context returns error")
test("POST /api/confirm/:token marks token as used — second call returns error")

// Migrations
test("SELECT COUNT(*) FROM platform_leads WHERE plan IS NOT NULL > 0 (migration 026 worked)")
test("pg_catalog check: tenant_activity_logs has RLS enabled")
test("pg_catalog check: tenant_call_tasks has RLS enabled")
test("pg_catalog check: lead_call_tasks has RLS enabled")
```

### E2E Tests

```
[ ] Пълен booking flow: service → specialist → slot → confirm → receipt email
[ ] Double-booking: два браузъра → same slot → само един успява, втори вижда грешка
[ ] Token reuse: confirm URL → втора употреба → error page
[ ] Admin вижда нова резервация след manual refresh (или real-time ако имплементирано)
[ ] Stripe webhook → tenant активация → login работи end-to-end
[ ] GDPR: request export → email → confirm → CSV download
[ ] GDPR: request deletion → admin email → data anonymized
[ ] Unsubscribe: email link → unsubscribe confirmed → no more booking emails
[ ] Super-admin impersonation: switch salon → действия → audit log запис
```

---

## Appendix: Files Audited

| Area | Key Files |
|------|-----------|
| Routing | `middleware.ts`, `lib/routing/tenant-resolution.ts`, `lib/admin-tenant.ts` |
| Booking | `lib/booking-mutations.ts`, `app/api/bookings/route.ts`, `app/api/availability/route.ts` |
| Cron | `app/api/cron/reminders/route.ts`, `app/api/cron/billing-expiry/route.ts` |
| Stripe | `app/api/webhooks/stripe/route.ts` |
| GDPR | `app/api/gdpr/export/route.ts`, `app/api/gdpr/export/confirm/route.ts`, `app/api/gdpr/delete-request/route.ts` |
| Auth | `lib/supabase-admin.ts`, `lib/super-admin-auth.ts`, `lib/routing/auth-guard.ts` |
| DB | `supabase/migrations/` (001–031), `lib/tenant-db.ts` |
| Admin API | `app/api/admin/bookings/[id]/route.ts`, `app/api/admin/clients/[id]/route.ts`, `app/api/admin/gallery/route.ts` |
| Public API | `app/api/confirm/[token]/route.ts`, `app/api/cancel/[token]/route.ts`, `app/api/unsubscribe/route.ts` |
| Schemas | `schemas/settings.ts`, `schemas/tenant.ts` |
| Components | `components/admin/ClientsAdminClient.tsx`, tenant site components |

---

*Докладът е генериран в read-only режим. Нито един файл не е променян.*  
*Следващ одит се препоръчва след имплементиране на P0 fixes.*
