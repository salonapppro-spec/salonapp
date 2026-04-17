-- SalonApp.pro — пълна начална схема (MASTER / Промпт 2)
-- Изисква: PostgreSQL 15+ (NULLS NOT DISTINCT)

create extension if not exists "pgcrypto";
create extension if not exists "btree_gist";

-- ---------------------------------------------------------------------------
-- TENANTS
-- ---------------------------------------------------------------------------
create table public.tenants (
  id                    uuid primary key default gen_random_uuid(),
  salon_slug            text unique not null,
  salon_name            text not null,
  plan                  text not null default 'standard'
    check (plan in ('standard', 'pro', 'premium', 'collective')),
  status                text not null default 'trial'
    check (status in ('trial', 'active', 'inactive')),
  start_date            date not null default current_date,
  payment_type          text not null default 'stripe'
    check (payment_type in ('stripe', 'bank')),
  stripe_customer_id    text,
  stripe_subscription_id text,
  domain                text unique,
  template              text not null default 'bloom'
    check (template in ('bloom', 'luxe', 'clean', 'zen', 'bold')),
  primary_color         text not null default '#F2A58E',
  font                  text not null default 'Inter',
  facebook_pixel_id     text,
  capi_token            text,
  clarity_id            text,
  gtm_id                text,
  phone                 text,
  address               text,
  description           text,
  instagram_url         text,
  facebook_url          text,
  hero_title            text,
  hero_subtitle         text,
  hero_image_url        text,
  about_text1           text,
  about_text2           text,
  about_image_url       text,
  email                 text,
  tiktok_url            text,
  google_maps_embed     text,
  owner_email           text,
  owner_phone           text,
  created_at            timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- SPECIALISTS (Колектив и др.)
-- ---------------------------------------------------------------------------
create table public.specialists (
  id                  uuid primary key default gen_random_uuid(),
  salon_slug          text not null references public.tenants (salon_slug) on delete cascade,
  name                text not null,
  role                text,
  bio                 text,
  avatar_url          text,
  is_active           boolean not null default true,
  is_technical_admin  boolean not null default false,
  created_at          timestamptz not null default now()
);

create index idx_specialists_salon on public.specialists (salon_slug);

-- ---------------------------------------------------------------------------
-- SERVICES
-- ---------------------------------------------------------------------------
create table public.services (
  id                  uuid primary key default gen_random_uuid(),
  salon_slug          text not null references public.tenants (salon_slug) on delete cascade,
  specialist_id       uuid references public.specialists (id) on delete set null,
  name                text not null,
  price_eur           numeric(10, 2) not null,
  duration_minutes    integer,
  is_complex          boolean not null default false,
  active_start_min    integer,
  active_start_max    integer,
  waiting_min         integer,
  waiting_max         integer,
  active_finish_min   integer,
  active_finish_max   integer,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  constraint check_service_mode check (
    (is_complex = false and duration_minutes is not null)
    or
    (is_complex = true
      and active_start_min is not null and active_start_max is not null
      and waiting_min is not null and waiting_max is not null
      and active_finish_min is not null and active_finish_max is not null)
  )
);

create index idx_services_salon on public.services (salon_slug);

-- ---------------------------------------------------------------------------
-- WORKING HOURS
-- ---------------------------------------------------------------------------
create table public.working_hours (
  id              uuid primary key default gen_random_uuid(),
  salon_slug      text not null references public.tenants (salon_slug) on delete cascade,
  specialist_id   uuid references public.specialists (id) on delete cascade,
  day_of_week     integer not null check (day_of_week between 0 and 6),
  start_time      time not null,
  end_time        time not null,
  is_day_off      boolean not null default false,
  unique nulls not distinct (salon_slug, specialist_id, day_of_week)
);

-- ---------------------------------------------------------------------------
-- BOOKINGS
-- ---------------------------------------------------------------------------
create table public.bookings (
  id                    uuid primary key default gen_random_uuid(),
  created_at            timestamptz not null default now(),
  salon_slug            text not null references public.tenants (salon_slug) on delete cascade,
  specialist_id         uuid references public.specialists (id) on delete set null,
  service_id            uuid references public.services (id) on delete set null,
  service_name          text not null,
  service_price_eur     numeric(10, 2) not null,
  service_duration    integer not null,
  booking_date          date not null,
  booking_time          time not null,
  booking_end_time      time not null,
  client_name           text not null,
  client_phone          text not null,
  client_email          text,
  status                text not null default 'pending'
    check (status in ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  confirmation_token    uuid not null default gen_random_uuid(),
  confirmed_at          timestamptz,
  notes                 text,
  hair_length           text check (hair_length in ('short', 'medium', 'long')),
  hair_density          text check (hair_density in ('thin', 'medium', 'thick')),
  constraint bookings_no_overlap exclude using gist (
    salon_slug with =,
    (coalesce(specialist_id, '00000000-0000-0000-0000-000000000000'::uuid)) with =,
    tsrange(
      (booking_date + booking_time)::timestamp,
      (booking_date + booking_end_time)::timestamp
    ) with &&
  ) where ((status)::text <> all (array['cancelled', 'no_show']::text[]))
);

create index idx_bookings_salon_date on public.bookings (salon_slug, booking_date);
create index idx_bookings_specialist on public.bookings (specialist_id);
create index idx_bookings_status on public.bookings (status);

-- ---------------------------------------------------------------------------
-- BLOCKED SLOTS
-- ---------------------------------------------------------------------------
create table public.blocked_slots (
  id              uuid primary key default gen_random_uuid(),
  salon_slug      text not null references public.tenants (salon_slug) on delete cascade,
  specialist_id   uuid references public.specialists (id) on delete cascade,
  blocked_date    date not null,
  start_time      time not null,
  end_time        time not null,
  reason          text,
  created_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- CLIENTS
-- ---------------------------------------------------------------------------
create table public.clients (
  id              uuid primary key default gen_random_uuid(),
  salon_slug      text not null references public.tenants (salon_slug) on delete cascade,
  specialist_id   uuid references public.specialists (id) on delete set null,
  name            text not null,
  phone           text not null,
  email           text,
  notes           text,
  created_at      timestamptz not null default now(),
  unique (salon_slug, phone)
);

create index idx_clients_salon_phone on public.clients (salon_slug, phone);

-- ---------------------------------------------------------------------------
-- FINANCIAL SETTINGS
-- ---------------------------------------------------------------------------
create table public.financial_settings (
  id                      uuid primary key default gen_random_uuid(),
  salon_slug              text unique not null references public.tenants (salon_slug) on delete cascade,
  monthly_expenses        numeric(10, 2) not null default 0,
  desired_salary          numeric(10, 2) not null default 0,
  rent_eur                numeric(10, 2) not null default 0,
  electricity_eur         numeric(10, 2) not null default 0,
  water_eur               numeric(10, 2) not null default 0,
  accounting_eur          numeric(10, 2) not null default 0,
  monthly_revenue_goal_eur numeric(10, 2) not null default 0,
  working_days_per_week   integer not null default 5,
  working_hours_per_day   integer not null default 8,
  vat_enabled             boolean not null default false,
  booking_window_days     integer not null default 30,
  buffer_minutes          integer not null default 10,
  magnetic_scheduling     boolean not null default true,
  created_at              timestamptz not null default now()
);

comment on column public.financial_settings.monthly_expenses is 'Други месечни разходи (прочие), без наем/ток/вода/счетоводство — виж отделните колони.';

-- ---------------------------------------------------------------------------
-- EXPENSES
-- ---------------------------------------------------------------------------
create table public.expenses (
  id              uuid primary key default gen_random_uuid(),
  salon_slug      text not null references public.tenants (salon_slug) on delete cascade,
  date            date not null,
  amount          numeric(10, 2) not null,
  description     text not null,
  supplier        text,
  created_at      timestamptz not null default now()
);

create index idx_expenses_salon_date on public.expenses (salon_slug, date);

-- ---------------------------------------------------------------------------
-- GALLERY
-- ---------------------------------------------------------------------------
create table public.gallery (
  id              uuid primary key default gen_random_uuid(),
  salon_slug      text not null references public.tenants (salon_slug) on delete cascade,
  specialist_id   uuid references public.specialists (id) on delete cascade,
  url             text not null,
  order_index     integer not null default 0,
  is_visible      boolean not null default true,
  created_at      timestamptz not null default now()
);

create index idx_gallery_salon_order on public.gallery (salon_slug, order_index);

-- ---------------------------------------------------------------------------
-- EMAIL LOGS
-- ---------------------------------------------------------------------------
create table public.email_logs (
  id              uuid primary key default gen_random_uuid(),
  salon_slug      text not null references public.tenants (salon_slug) on delete cascade,
  booking_id      uuid references public.bookings (id) on delete cascade,
  type            text not null check (type in ('confirmation', 'reminder')),
  sent_at         timestamptz not null default now(),
  status          text not null check (status in ('sent', 'failed'))
);

-- ---------------------------------------------------------------------------
-- PAGE EVENTS (CTR / маркетинг)
-- ---------------------------------------------------------------------------
create table public.page_events (
  id              uuid primary key default gen_random_uuid(),
  event_type      text not null,
  source          text,
  created_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- PLATFORM LEADS (лендинг /get-started)
-- ---------------------------------------------------------------------------
create table public.platform_leads (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  plan            text not null check (plan in ('standard', 'pro', 'premium', 'collective')),
  salon_name      text not null,
  contact_name    text not null,
  email           text not null,
  phone           text,
  message         text,
  source          text not null default 'get-started' check (source in ('get-started', 'pricing', 'other')),
  status          text not null default 'new' check (status in ('new', 'contacted', 'converted', 'dismissed'))
);

create index platform_leads_created_at_idx on public.platform_leads (created_at desc);
