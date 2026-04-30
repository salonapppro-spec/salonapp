create table if not exists public.tenant_activity_logs (
  id uuid primary key default gen_random_uuid(),
  salon_slug text not null references public.tenants (salon_slug) on delete cascade,
  event_type text not null,
  actor_user_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_tenant_activity_logs_salon_created
  on public.tenant_activity_logs (salon_slug, created_at desc);
