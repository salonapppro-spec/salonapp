-- RLS политики (Промпт 2) + публичен RPC за резолв на тенант (middleware с anon key)

-- ---------------------------------------------------------------------------
-- Helper: super_admin от JWT (app_metadata или user_metadata)
-- ---------------------------------------------------------------------------
-- salon_slug за собственик: auth.jwt()->'user_metadata'->>'salon_slug'

-- ---------------------------------------------------------------------------
-- Публичен RPC — обхожда RLS на tenants (SECURITY DEFINER)
-- ---------------------------------------------------------------------------
create or replace function public.resolve_tenant_public(p_salon_slug text default null, p_domain text default null)
returns table (salon_slug text, status text)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if (p_salon_slug is not null and p_domain is not null) or (p_salon_slug is null and p_domain is null) then
    return;
  end if;
  if p_salon_slug is not null then
    return query
    select t.salon_slug::text, t.status::text
    from public.tenants t
    where t.salon_slug = p_salon_slug
    limit 1;
    return;
  end if;
  return query
  select t.salon_slug::text, t.status::text
  from public.tenants t
  where t.domain = p_domain
  limit 1;
end;
$$;

revoke all on function public.resolve_tenant_public(text, text) from public;
grant execute on function public.resolve_tenant_public(text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.tenants enable row level security;
alter table public.specialists enable row level security;
alter table public.services enable row level security;
alter table public.working_hours enable row level security;
alter table public.bookings enable row level security;
alter table public.blocked_slots enable row level security;
alter table public.clients enable row level security;
alter table public.financial_settings enable row level security;
alter table public.expenses enable row level security;
alter table public.gallery enable row level security;
alter table public.email_logs enable row level security;
alter table public.page_events enable row level security;
alter table public.platform_leads enable row level security;

-- TENANTS: само super_admin
create policy tenants_super_admin_all on public.tenants
  for all to authenticated
  using (
    coalesce((auth.jwt()->'app_metadata'->>'role'), (auth.jwt()->'user_metadata'->>'role')) = 'super_admin'
  )
  with check (
    coalesce((auth.jwt()->'app_metadata'->>'role'), (auth.jwt()->'user_metadata'->>'role')) = 'super_admin'
  );

-- BOOKINGS
create policy bookings_owner_select on public.bookings
  for select to authenticated
  using (salon_slug = (auth.jwt()->'user_metadata'->>'salon_slug'));

create policy bookings_public_insert on public.bookings
  for insert to anon, authenticated
  with check (
    exists (
      select 1 from public.tenants t
      where t.salon_slug = bookings.salon_slug
        and t.status in ('active', 'trial')
    )
  );

create policy bookings_owner_update on public.bookings
  for update to authenticated
  using (salon_slug = (auth.jwt()->'user_metadata'->>'salon_slug'))
  with check (salon_slug = (auth.jwt()->'user_metadata'->>'salon_slug'));

create policy bookings_owner_delete on public.bookings
  for delete to authenticated
  using (salon_slug = (auth.jwt()->'user_metadata'->>'salon_slug'));

-- SERVICES, CLIENTS, WORKING_HOURS, BLOCKED_SLOTS, FINANCIAL_SETTINGS, EXPENSES, GALLERY, EMAIL_LOGS: owner по salon_slug
create policy services_owner_all on public.services
  for all to authenticated
  using (salon_slug = (auth.jwt()->'user_metadata'->>'salon_slug'))
  with check (salon_slug = (auth.jwt()->'user_metadata'->>'salon_slug'));

create policy clients_owner_all on public.clients
  for all to authenticated
  using (salon_slug = (auth.jwt()->'user_metadata'->>'salon_slug'))
  with check (salon_slug = (auth.jwt()->'user_metadata'->>'salon_slug'));

create policy working_hours_owner_all on public.working_hours
  for all to authenticated
  using (salon_slug = (auth.jwt()->'user_metadata'->>'salon_slug'))
  with check (salon_slug = (auth.jwt()->'user_metadata'->>'salon_slug'));

create policy blocked_slots_owner_all on public.blocked_slots
  for all to authenticated
  using (salon_slug = (auth.jwt()->'user_metadata'->>'salon_slug'))
  with check (salon_slug = (auth.jwt()->'user_metadata'->>'salon_slug'));

create policy financial_settings_owner_all on public.financial_settings
  for all to authenticated
  using (salon_slug = (auth.jwt()->'user_metadata'->>'salon_slug'))
  with check (salon_slug = (auth.jwt()->'user_metadata'->>'salon_slug'));

create policy expenses_owner_all on public.expenses
  for all to authenticated
  using (salon_slug = (auth.jwt()->'user_metadata'->>'salon_slug'))
  with check (salon_slug = (auth.jwt()->'user_metadata'->>'salon_slug'));

create policy gallery_owner_all on public.gallery
  for all to authenticated
  using (salon_slug = (auth.jwt()->'user_metadata'->>'salon_slug'))
  with check (salon_slug = (auth.jwt()->'user_metadata'->>'salon_slug'));

create policy email_logs_owner_all on public.email_logs
  for all to authenticated
  using (salon_slug = (auth.jwt()->'user_metadata'->>'salon_slug'))
  with check (salon_slug = (auth.jwt()->'user_metadata'->>'salon_slug'));

-- SPECIALISTS: owner + публично четене на активни
create policy specialists_owner_all on public.specialists
  for all to authenticated
  using (salon_slug = (auth.jwt()->'user_metadata'->>'salon_slug'))
  with check (salon_slug = (auth.jwt()->'user_metadata'->>'salon_slug'));

create policy specialists_public_read on public.specialists
  for select to anon
  using (is_active = true);

-- PAGE_EVENTS: анонимен insert (CTR); четене само super_admin
create policy page_events_anon_insert on public.page_events
  for insert to anon, authenticated
  with check (true);

create policy page_events_super_select on public.page_events
  for select to authenticated
  using (
    coalesce((auth.jwt()->'app_metadata'->>'role'), (auth.jwt()->'user_metadata'->>'role')) = 'super_admin'
  );

-- PLATFORM_LEADS: без политики за anon/authenticated — само service role
-- (insert от Next.js API)

-- ---------------------------------------------------------------------------
-- ЗАДАЧА 3 — Supabase Auth metadata (оперативно, не SQL):
-- Собственик: user_metadata = { "salon_slug": "<slug>", "plan": "standard", "role": "owner" }
-- Супер админ: user_metadata или app_metadata = { "role": "super_admin" }
-- ---------------------------------------------------------------------------
