-- SalonApp.pro — Initial schema (v2)

-- Extensions
create extension if not exists "pgcrypto";

-- TENANTS
create table if not exists public.tenants (
  id                  uuid primary key default gen_random_uuid(),
  salon_slug          text unique not null,
  salon_name          text not null,
  plan                text not null check (plan in ('standard','pro','premium','collective')),
  status              text not null default 'trial' check (status in ('trial','active','inactive')),
  start_date          date not null default current_date,
  payment_type        text check (payment_type in ('stripe','bank')),
  stripe_customer_id  text,
  domain              text,
  template            text not null default 'bloom' check (template in ('bloom','luxe','clean','zen','bold')),
  primary_color       text,
  font                text,
  facebook_pixel_id   text,
  capi_token          text,
  clarity_id          text,
  gtm_id              text,
  owner_email         text,
  owner_phone         text,
  created_at          timestamptz default now()
);

-- BOOKINGS
create table if not exists public.bookings (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz default now(),
  salon_slug          text not null,
  specialist_id       text,
  service_id          uuid,
  service_name        text not null,
  service_price_eur   numeric not null,
  service_duration    integer not null,
  booking_date        date not null,
  booking_time        text not null,
  client_name         text not null,
  client_phone        text,
  client_email        text,
  status              text not null default 'pending'
                      check (status in ('pending','confirmed','completed','cancelled','no_show')),
  confirmation_token  uuid default gen_random_uuid(),
  confirmed_at        timestamptz,
  notes               text,
  hair_length         text check (hair_length in ('къса','средна','дълга')),
  hair_density        text check (hair_density in ('рядка','средна','гъста'))
);

-- SERVICES
create table if not exists public.services (
  id                  uuid primary key default gen_random_uuid(),
  salon_slug          text not null,
  specialist_id       text,
  name                text not null,
  price_eur           numeric not null,
  duration_minutes    integer,
  is_complex          boolean default false,
  active_start_min    integer,
  active_start_max    integer,
  waiting_min         integer,
  waiting_max         integer,
  active_finish_min   integer,
  active_finish_max   integer,
  is_active           boolean default true,
  created_at          timestamptz default now()
);

-- CLIENTS
create table if not exists public.clients (
  id                  uuid primary key default gen_random_uuid(),
  salon_slug          text not null,
  specialist_id       text,
  name                text not null,
  phone               text,
  email               text,
  notes               text,
  created_at          timestamptz default now()
);

-- BLOCKED SLOTS
create table if not exists public.blocked_slots (
  id                  uuid primary key default gen_random_uuid(),
  salon_slug          text not null,
  specialist_id       text,
  blocked_date        date not null,
  start_time          text not null,
  end_time            text not null,
  reason              text,
  created_at          timestamptz default now()
);

-- FINANCIAL SETTINGS
create table if not exists public.financial_settings (
  id                    uuid primary key default gen_random_uuid(),
  salon_slug            text unique not null,
  monthly_expenses      numeric default 0,
  desired_salary        numeric default 0,
  working_days_per_week integer default 5,
  working_hours_per_day integer default 8,
  vat_enabled           boolean default false,
  booking_window_days   integer default 30,
  buffer_minutes        integer default 10,
  magnetic_scheduling   boolean default true
);

-- EXPENSES
create table if not exists public.expenses (
  id           uuid primary key default gen_random_uuid(),
  salon_slug   text not null,
  date         date not null,
  amount       numeric not null,
  description  text,
  supplier     text,
  created_at   timestamptz default now()
);

-- WORKING HOURS
create table if not exists public.working_hours (
  id             uuid primary key default gen_random_uuid(),
  salon_slug     text not null,
  specialist_id  text,
  day_of_week    integer not null check (day_of_week between 0 and 6),
  start_time     text not null,
  end_time       text not null,
  is_day_off     boolean default false
);

-- GALLERY
create table if not exists public.gallery (
  id             uuid primary key default gen_random_uuid(),
  salon_slug     text not null,
  specialist_id  text,
  url            text not null,
  sort_order     integer default 0,
  is_visible     boolean default true,
  created_at     timestamptz default now()
);

-- EMAIL LOGS
create table if not exists public.email_logs (
  id          uuid primary key default gen_random_uuid(),
  salon_slug  text not null,
  booking_id  uuid,
  type        text check (type in ('confirmation','reminder','sms')),
  sent_at     timestamptz default now(),
  status      text
);

-- PAGE EVENTS (CTR tracking за salonapp.pro)
create table if not exists public.page_events (
  id          uuid primary key default gen_random_uuid(),
  event_type  text not null,
  source      text,
  created_at  timestamptz default now()
);

-- LEADS
create table if not exists public.leads (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  phone       text not null,
  created_at  timestamptz default now()
);

-- Helper for RLS tenant isolation.
-- Your API layer must set `set_config('app.salon_slug', <slug>, true)` per request.
create or replace function public.set_tenant(salon_slug text)
returns void
language plpgsql
security definer
as $$
begin
  perform set_config('app.salon_slug', salon_slug, true);
end;
$$;

-- RLS policies (apply to every tenant-scoped table)
alter table public.bookings enable row level security;
create policy "Tenant isolation" on public.bookings
  using (salon_slug = current_setting('app.salon_slug', true));

alter table public.services enable row level security;
create policy "Tenant isolation" on public.services
  using (salon_slug = current_setting('app.salon_slug', true));

alter table public.clients enable row level security;
create policy "Tenant isolation" on public.clients
  using (salon_slug = current_setting('app.salon_slug', true));

alter table public.blocked_slots enable row level security;
create policy "Tenant isolation" on public.blocked_slots
  using (salon_slug = current_setting('app.salon_slug', true));

alter table public.financial_settings enable row level security;
create policy "Tenant isolation" on public.financial_settings
  using (salon_slug = current_setting('app.salon_slug', true));

alter table public.expenses enable row level security;
create policy "Tenant isolation" on public.expenses
  using (salon_slug = current_setting('app.salon_slug', true));

alter table public.working_hours enable row level security;
create policy "Tenant isolation" on public.working_hours
  using (salon_slug = current_setting('app.salon_slug', true));

alter table public.gallery enable row level security;
create policy "Tenant isolation" on public.gallery
  using (salon_slug = current_setting('app.salon_slug', true));

alter table public.email_logs enable row level security;
create policy "Tenant isolation" on public.email_logs
  using (salon_slug = current_setting('app.salon_slug', true));

-- Tenants, page_events, leads intentionally have no tenant isolation policy by default.
-- Tenants is used for hostname resolution and provisioning.

