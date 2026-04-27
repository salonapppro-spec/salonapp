# PROJECT CURRENT STATE — SalonApp.pro

## 1) System Overview

SalonApp.pro is a multi-tenant SaaS for beauty salons built with Next.js App Router and Supabase. The platform has:

- A **root-domain platform** (`salonapp.pro`) for marketing, onboarding, admin, and super-admin.
- **Public tenant websites** served per salon slug/domain.
- A **single shared PostgreSQL database** with strict tenant boundaries (`salon_slug` + RLS).
- Hybrid backend model:
  - Next.js Route Handlers under `app/api/**`
  - Server Actions under `app/actions/**` and `app/super-admin/actions.ts`
  - Shared domain logic in `lib/**`

Current production-oriented design emphasizes tenant isolation, anti-abuse controls (rate limits + abuse logging), and operational flows (Stripe billing lifecycle, reminder cron, graceful deactivation).

---

## 2) Architecture and Code Structure

## 2.1 Top-Level Folders

- `app/` — Next.js App Router routes (public pages, admin, super-admin, APIs, server actions).
- `components/` — UI by domain:
  - `components/admin/**`
  - `components/booking/**`
  - `components/templates/**` (tenant website templates)
  - `components/marketing/**`
- `lib/` — business/domain logic, tenant boundaries, data access, scheduling, finance calculations, integrations.
- `schemas/` — Zod validators used by APIs and server actions.
- `supabase/migrations/` — SQL schema + incremental hardening migrations.
- `types/` and `types/database.ts` — app/domain types and DB-facing contracts.
- `emails/` — React Email templates.
- `tests/integration/` — tenant boundary and storage isolation tests.

## 2.2 App Router Layout

### Root platform routes

- `app/page.tsx` — main landing.
- `app/get-started/**`, `app/privacy/**`, `app/unsubscribe/page.tsx`, `app/temporarily-unavailable/page.tsx`.
- `app/admin/**` — admin auth and protected admin pages.
- `app/super-admin/**` — super-admin dashboard, tenant detail, visual builder.

### Public tenant routes

- `app/(public)/[salon_slug]/page.tsx` — tenant public website renderer.
- `app/(public)/[salon_slug]/booking/page.tsx` — booking flow entry.

Public pages read tenant context from `x-salon-slug` header (set by middleware) and fallback to route param.

### API routes

Under `app/api/**` there are three major categories:

- **Public tenant APIs**: `bookings`, `availability`, `services`, `clients/lookup`, `confirm/[token]`, `cancel/[token]`.
- **Admin APIs**: `api/admin/**` for services/clients/bookings/settings/working-hours/gallery/expenses/specialists/financial settings.
- **Platform/super-admin/infra APIs**: `webhooks/stripe`, `cron/*`, `super-admin/*`, `leads`, `consultation`, `track`, `gdpr/delete-request`.

## 2.3 Server Actions

- `app/actions/booking.ts` — public booking action with Zod + host-bound tenant checks.
- `app/actions/admin-booking.ts` — admin-side booking action, tenant resolved from authenticated context.
- `app/super-admin/actions.ts` — tenant creation, activation, impersonation context, design token/builder save.

## 2.4 Key Shared Libraries

- `lib/tenant-db.ts` — central tenant-scoped data access facade (service-role client + mandatory `.eq("salon_slug", ...)` filters).
- `lib/admin-tenant.ts` / `lib/admin-tenant-page.ts` — resolve tenant for admin APIs/pages from auth metadata and controlled super-admin cookie context.
- `lib/tenant-request.ts` — enforces `x-salon-slug` host-bound checks for public APIs.
- `lib/booking-mutations.ts` + `lib/scheduling.ts` — booking conflict logic and slot generation.
- `lib/data.ts` — aggregated read APIs over `tenantDb`.
- `lib/email.tsx` / `lib/sms.ts` — reminders and notifications (Resend + Twilio).
- `lib/public-tenant-guard.ts` — blocks public APIs for inactive tenants.

---

## 3) Multi-Tenant Isolation (Detailed)

Tenant isolation is implemented in **three stacked layers**:

1. Request-level tenant resolution and host binding.
2. Application-level tenant scoping (`tenantDb`, helpers, API guards).
3. Database-level RLS + storage path isolation.

## 3.1 Middleware Tenant Resolution

`middleware.ts` performs:

- Host classification:
  - root domain (`salonapp.pro`, `www.salonapp.pro`)
  - dev/preview hosts (`localhost`, `127.0.0.1`, `*.vercel.app`)
  - tenant subdomains/custom domains
- Session refresh and auth guards via `@supabase/ssr`.
- Tenant resolution through RPC `resolve_tenant_public` for subdomain/custom-domain hosts.
- Rewrites tenant traffic:
  - `tenant.salonapp.pro/path` -> `/{salon_slug}/path`
  - Adds request headers `x-salon-slug`, `x-pathname`, optionally `x-tenant-domain`.
- Root-domain enforcement for admin/super-admin paths (redirect from tenant/custom domains to root platform domain).
- Rate limiting entrypoint for critical APIs before route execution.

## 3.2 Host-Bound Public API Enforcement

Public APIs (`/api/services`, `/api/availability`, `/api/bookings`, `/api/clients/lookup`) call `requireTenantFromHeaders()`:

- Requires valid `x-salon-slug`.
- If request payload/query includes `salon_slug`, it must match header slug.
- Mismatch -> `403`, missing/invalid -> `400`.

This prevents cross-tenant reads/writes even if an attacker submits another salon slug in URL/body.

## 3.3 Admin Tenant Resolution

Admin APIs use `requireAdminTenantSlugForApi()`:

- Source of truth is authenticated user JWT `app_metadata.salon_slug`.
- For super-admin: controlled impersonation via HTTP-only cookie `salonapp_super_admin_salon`.
- Optional header consistency check if `x-salon-slug` exists.
- No trust in client-submitted tenant data.

## 3.4 DB Access Pattern

All domain tables are accessed through `tenantDb(salonSlug)` in `lib/tenant-db.ts`, which:

- Validates slug format.
- Wraps every query/mutation with tenant filter:
  - `.eq("salon_slug", salonSlug)` for reads/updates/deletes
  - injects `salon_slug` on inserts/upserts.

This is explicit defense-in-depth above RLS.

## 3.5 Supabase RLS Strategy

Baseline in `002_rls_policies.sql`, hardened in `015_rls_app_metadata.sql` and `018_super_admin_app_metadata_only.sql`:

- RLS enabled across tenant tables.
- Owner policies compare row `salon_slug` with `auth.jwt()->'app_metadata'->>'salon_slug'`.
- Super-admin policies depend only on `auth.jwt()->'app_metadata'->>'role' = 'super_admin'`.
- Public booking insert allowed for active/trial tenants.
- `specialists` has anon select for active records.

Important hardening:

- Migration `015` removes `user_metadata` as trust boundary.
- Migration `018` removes `user_metadata.role` fallback for super-admin.

## 3.6 Storage Isolation

`016_storage_tenant_isolation.sql` scopes `storage.objects` policies to folder ownership:

- Path convention: `gallery/<salon_slug>/...`
- Insert/update/delete allowed only when folder slug equals JWT `app_metadata.salon_slug`.

Integration test coverage exists in `tests/integration/storage-boundary-isolation.test.ts`.

---

## 4) Database Model and Frontend Interaction

## 4.1 Core Tables

Main schema originates from `001_initial_schema.sql`.

- `tenants` — tenant identity, plan/status, branding, billing linkage, public site content.
- `specialists` — team members, technical admin flag, optional SMS reminder flag (later migration).
- `services` — per-tenant services, simple/complex duration model, optional specialist ownership.
- `working_hours` — weekly schedule (salon default + specialist override).
- `bookings` — reservation records with overlap exclusion constraint.
- `blocked_slots` — manual blocked intervals.
- `clients` — client directory, unique `(salon_slug, phone)`.
- `financial_settings` — booking window, buffer, scheduling mode, costs/goals.
- `expenses` — tenant expenses by date.
- `gallery` — image metadata and ordering.
- `email_logs` — confirmation/reminder dispatch status.
- `page_events` — platform analytics events.
- `platform_leads` — marketing/consultation funnel entries.
- `stripe_events` (migration `017`) — webhook idempotency table.

## 4.2 Relationships

Most tenant tables reference `tenants(salon_slug)` with cascade delete; migration `019` adds `ON UPDATE CASCADE` to support slug renames across dependent rows.

Selected relations:

- `services.specialist_id` -> `specialists.id`
- `bookings.service_id` -> `services.id`
- `bookings.specialist_id` -> `specialists.id`
- `bookings.salon_slug` + time range protected by exclusion constraint to prevent overlaps.
- `clients.specialist_id` optional relation to specialist.

## 4.3 Frontend/Backend Data Flow

- Pages/components do not directly query raw Supabase in random places; most read operations go through `lib/data.ts`.
- Writes are performed in route handlers/server actions using Zod-validated payloads and `tenantDb`.
- Service role is used in server-side contexts; public clients never receive service-role key.

---

## 5) Key Functional Flows

## 5.1 Booking Flow (Public + Admin)

### Public booking path

1. User lands on `/{salon_slug}/booking`.
2. `BookingFlow` loads tenant/services/hours/gallery/specialists via `loadPublicSalonData`.
3. Slot availability:
   - `/api/availability` or `/api/bookings?date...`
   - computes available slots from working hours, active bookings, blocked slots, service duration, buffer, magnetic scheduling.
4. Booking submit:
   - `/api/bookings` POST or server action `createBooking`.
   - Zod validation (`schemas/booking.ts`).
   - tenant header/body match check.
   - `runCreateBooking()` handles:
     - service validation and specialist compatibility
     - complex duration calculation from hair length/density
     - overlap checks + blocked intervals
     - day-off/working-hours checks
     - DB insert with compatibility fallbacks for legacy schemas
     - upsert client by phone
     - async confirmation email trigger.

### Admin quick booking path

- Uses `createAdminBooking` server action.
- Injects tenant slug from authenticated context (not request body).
- Reuses same `runCreateBooking()` business rules.

## 5.2 Calendar and Scheduling

- Admin pages:
  - `app/admin/(protected)/dashboard/page.tsx` (today view and quick stats)
  - `app/admin/(protected)/calendar/page.tsx` (day/week with status actions)
- Scheduling engine in `lib/scheduling.ts`:
  - supports simple and complex service durations.
  - merges busy intervals from bookings + blocked slots.
  - magnetic slot prioritization.
  - optional parallel-slot helper for higher plans.

## 5.3 Booking Lifecycle Actions

- Confirm link: `api/confirm/[token]` (GET preview + POST update to `confirmed`).
- Cancel link: `api/cancel/[token]` (blocked if <24h; then marks `cancelled`).
- Admin booking status patch/delete: `api/admin/bookings/[id]`.

## 5.4 Financial Tracker / Business Calculator

- Main UI: `app/admin/(protected)/finances/page.tsx`.
- Uses:
  - `getCompletedRevenueBetween` and day/week/month aggregates from completed bookings.
  - `getCompletedBookingAmountsInRange` for chart time series.
  - `financial_settings` for operational assumptions.
  - expenses from `api/admin/expenses`.
- `lib/finance-abc.ts` computes:
  - productive minutes/month
  - cost per minute
  - per-service ABC style profitability rows and margin bands.

## 5.5 Integrations

### Stripe

- Webhook endpoint: `app/api/webhooks/stripe/route.ts`.
- Signature verification using `STRIPE_WEBHOOK_SECRET`.
- Handles:
  - `checkout.session.completed`
  - `invoice.paid`
  - `invoice.payment_failed`
  - `customer.subscription.deleted`
- Tenant lookup precedence:
  1) `stripe_subscription_id`
  2) `stripe_customer_id`
  3) optional owner-email fallback (toggle via env).
- Idempotency via `stripe_events` table (unique event id claim).
- Activates tenant status + extends `expiry_date`/`grace_until_date`.

### Resend

- Used in:
  - booking confirmation and reminder emails (`lib/email.tsx`)
  - tenant activation/deactivation notices
  - lead notifications
  - GDPR delete request forward.

### SMS (Twilio/Infobip-adjacent capability)

- Current implementation uses Twilio in `lib/sms.ts`.
- Reminder SMS sending is plan-gated (`premium` or collective + specialist flag).

---

## 6) Validation, Type Safety, and Runtime Rules

## 6.1 Zod Validation

Zod is consistently used on API/action boundaries, examples:

- `schemas/booking.ts`
- `schemas/service.ts`
- `schemas/settings.ts`
- `schemas/financial-admin.ts`
- `schemas/working-hours-admin.ts`
- `schemas/lead-inquiry.ts`

Pattern: parse -> return `400` with first issue/flattened details.

## 6.2 TypeScript and Build Settings

From `tsconfig.json`:

- `strict: true`
- `moduleResolution: "bundler"`
- `noEmit: true`
- path alias `@/*`.

This enforces strong compile-time guarantees while relying on runtime validation for inputs.

## 6.3 Security/Platform Controls

- Middleware rate-limiting for sensitive public/admin endpoints.
- Abuse event logging (`lib/abuse-log.ts`) for anomalies and server/client errors.
- CSP/security headers in `next.config.mjs` (separate posture for public pages vs admin/api).
- Cron endpoints require `CRON_SECRET` via `assertCronSecret`.

---

## 7) Routing and Tenant Website Rendering

Public tenant rendering:

- Middleware rewrites host-based tenant request to path-based dynamic route.
- `app/(public)/[salon_slug]/page.tsx` chooses template by `tenant.template`:
  - `bloom`, `luxe`, `luxe2`, `clean`, `zen`, `bold`, `groom`.
- Design tokens (per-tenant) merged and injected as CSS variables.
- Super-admin visual builder preview supported via secure postMessage allowlist + preview token.

Admin/super-admin routing:

- Auth/session checks in middleware + protected layout.
- Super-admin-only routes hard-guarded by role checks.

---

## 8) Super-Admin Capabilities

Implemented in `app/super-admin/**` and `app/super-admin/actions.ts`:

- Create tenant + optional owner auth user provisioning.
- Manual bank-plan activation (expiry + grace setup).
- Enter/exit salon admin context (impersonation cookie).
- Update tenant basics and branding/design tokens.
- Save visual builder content.
- Rename tenant slug via `api/super-admin/tenant/slug` with:
  - DB slug migration
  - storage folder copy/rewrite/cleanup
  - URL rewrites in tenant/gallery/specialists assets
  - metadata updates and cache revalidation.

---

## 9) Operations and Scheduled Jobs

- `api/cron/reminders`:
  - finds tomorrow bookings (`pending`/`confirmed`)
  - deduplicates by `email_logs` (`reminder`, `sent`)
  - sends email/SMS reminders.
- `api/cron/billing-expiry`:
  - deactivates tenants where grace period expired
  - sends owner notification email if available.

Both are dynamic handlers protected by cron secret.

---

## 10) Test Coverage Snapshot

Integration tests focus on boundary correctness:

- `tenant-api-isolation.test.ts` — tenant A cannot access/update/delete tenant B resources.
- `host-bound-public-api-enforcement.test.ts` — host/header tenant mismatch rejected.
- `storage-boundary-isolation.test.ts` — storage folder isolation by tenant slug.

This validates critical multi-tenant guarantees beyond unit logic.

---

## 11) Technology Stack (As Implemented)

- **Frontend**: Next.js App Router, React 19, TypeScript.
- **Styling/UI**: Tailwind CSS, Framer Motion, Lucide-based icon usage in admin UI.
- **Backend runtime**: Next.js Route Handlers + Server Actions.
- **Database/Auth**: Supabase Postgres + Supabase Auth + RLS.
- **Payments**: Stripe webhooks.
- **Email**: Resend API + React Email templates.
- **SMS**: Twilio integration for reminders.
- **Monitoring**: Sentry (`@sentry/nextjs`) + internal abuse logs.
- **Rate limiting**: Upstash (with fallback path in app logic).
- **Validation**: Zod at API/action boundaries.

---

## 12) Current State Assessment (Engineering Perspective)

The project is in a strong mid-to-late implementation stage with production-minded architecture already in place:

- Multi-tenant boundaries are implemented in middleware, app logic, and DB/RLS.
- Booking and calendar workflows are mature and include real-world conflict handling.
- Financial/business calculator features are implemented with reusable domain math.
- Stripe billing lifecycle and cron-based operations are integrated.
- Super-admin tooling covers provisioning, impersonation, and slug lifecycle management.

Remaining engineering risk is mostly operational consistency and ongoing hardening (env parity, migration discipline, and full E2E automation), not missing core architecture.

