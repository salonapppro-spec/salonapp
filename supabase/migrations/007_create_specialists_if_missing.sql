-- Възстановява липсваща таблица specialists в среди със съкратена начална схема
create table if not exists public.specialists (
  id                  uuid primary key default gen_random_uuid(),
  salon_slug          text not null references public.tenants (salon_slug) on delete cascade,
  name                text not null,
  role                text,
  bio                 text,
  avatar_url          text,
  is_active           boolean not null default true,
  is_technical_admin  boolean not null default false,
  sms_reminders_enabled boolean not null default false,
  created_at          timestamptz not null default now()
);

create index if not exists idx_specialists_salon on public.specialists (salon_slug);
