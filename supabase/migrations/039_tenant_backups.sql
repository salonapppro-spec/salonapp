-- Migration: 039_tenant_backups.sql
-- Per-tenant дневни бекъпи на оперативните данни (bookings, clients, services,
-- specialists, working_hours, blocked_slots, financial_settings) в JSONB
-- snapshot-и + функции за възстановяване. Планира се с pg_cron изцяло в
-- базата — не зависи от Vercel cron лимити.
--
-- Достъп: САМО service role (супер-админ actions). RLS е включен без
-- политики; EXECUTE на функциите е отнет от anon/authenticated.
--
-- UP

create extension if not exists pg_cron;

-- ---------------------------------------------------------------------------
-- Таблица със snapshot-и.
-- БЕЗ foreign key към tenants: бекъпът трябва да оцелее и при изтрит тенант
-- (точно това е disaster сценарият, за който съществува).
-- ---------------------------------------------------------------------------
create table if not exists public.tenant_backups (
  id          uuid primary key default gen_random_uuid(),
  salon_slug  text not null,
  backup_date date not null default ((now() at time zone 'Europe/Sofia'))::date,
  source      text not null default 'manual' check (source in ('cron', 'manual')),
  tables      jsonb not null,
  row_counts  jsonb not null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_tenant_backups_slug_created
  on public.tenant_backups (salon_slug, created_at desc);

-- Един cron бекъп на тенант на ден (ръчните са неограничени).
create unique index if not exists uq_tenant_backups_cron_daily
  on public.tenant_backups (salon_slug, backup_date)
  where source = 'cron';

alter table public.tenant_backups enable row level security;
-- Без политики: достъп само през service role / postgres.

-- ---------------------------------------------------------------------------
-- Snapshot на един тенант. Връща id на новия бекъп (null при cron дубликат).
-- ---------------------------------------------------------------------------
create or replace function public.create_tenant_backup(
  p_salon_slug text,
  p_source text default 'manual'
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_tables jsonb;
  v_counts jsonb;
  v_id uuid;
begin
  if p_salon_slug is null or p_salon_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
    raise exception 'Invalid salon_slug';
  end if;
  if p_source not in ('cron', 'manual') then
    raise exception 'Invalid source';
  end if;

  select jsonb_build_object(
    'tenant',             (select to_jsonb(t) from tenants t where t.salon_slug = p_salon_slug),
    'bookings',           coalesce((select jsonb_agg(to_jsonb(x)) from bookings x where x.salon_slug = p_salon_slug), '[]'::jsonb),
    'clients',            coalesce((select jsonb_agg(to_jsonb(x)) from clients x where x.salon_slug = p_salon_slug), '[]'::jsonb),
    'services',           coalesce((select jsonb_agg(to_jsonb(x)) from services x where x.salon_slug = p_salon_slug), '[]'::jsonb),
    'specialists',        coalesce((select jsonb_agg(to_jsonb(x)) from specialists x where x.salon_slug = p_salon_slug), '[]'::jsonb),
    'working_hours',      coalesce((select jsonb_agg(to_jsonb(x)) from working_hours x where x.salon_slug = p_salon_slug), '[]'::jsonb),
    'blocked_slots',      coalesce((select jsonb_agg(to_jsonb(x)) from blocked_slots x where x.salon_slug = p_salon_slug), '[]'::jsonb),
    'financial_settings', coalesce((select jsonb_agg(to_jsonb(x)) from financial_settings x where x.salon_slug = p_salon_slug), '[]'::jsonb)
  ) into v_tables;

  select jsonb_build_object(
    'bookings',           jsonb_array_length(v_tables->'bookings'),
    'clients',            jsonb_array_length(v_tables->'clients'),
    'services',           jsonb_array_length(v_tables->'services'),
    'specialists',        jsonb_array_length(v_tables->'specialists'),
    'working_hours',      jsonb_array_length(v_tables->'working_hours'),
    'blocked_slots',      jsonb_array_length(v_tables->'blocked_slots'),
    'financial_settings', jsonb_array_length(v_tables->'financial_settings')
  ) into v_counts;

  insert into tenant_backups (salon_slug, source, tables, row_counts)
  values (p_salon_slug, p_source, v_tables, v_counts)
  on conflict do nothing
  returning id into v_id;

  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Дневен job: бекъп на всички тенанти + retention
-- (cron бекъпи > 35 дни и ръчни > 180 дни се трият).
-- ---------------------------------------------------------------------------
create or replace function public.run_tenant_backups()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_slug text;
  v_done int := 0;
  v_failed int := 0;
  v_errors jsonb := '[]'::jsonb;
begin
  for v_slug in select t.salon_slug from tenants t order by t.salon_slug loop
    begin
      perform create_tenant_backup(v_slug, 'cron');
      v_done := v_done + 1;
    exception when others then
      v_failed := v_failed + 1;
      v_errors := v_errors || jsonb_build_object('salon_slug', v_slug, 'error', SQLERRM);
    end;
  end loop;

  delete from tenant_backups
  where (source = 'cron'   and created_at < now() - interval '35 days')
     or (source = 'manual' and created_at < now() - interval '180 days');

  return jsonb_build_object('done', v_done, 'failed', v_failed, 'errors', v_errors);
end;
$$;

-- ---------------------------------------------------------------------------
-- Възстановяване от бекъп.
--   p_mode = 'merge'   (default): добавя САМО липсващите редове (по id);
--                      конфликти се пропускат ред по ред — нищо не се трие.
--   p_mode = 'replace': за избраните таблици ТРИЕ текущите редове на тенанта
--                      и вкарва редовете от бекъпа. Строг режим — при грешка
--                      цялата операция се отменя (rollback).
-- Възстановява само данните на тенанта от бекъпа; таблица 'tenant' (ред от
-- tenants) НЕ се възстановява автоматично — планове/статуси са на супер-админа.
-- ---------------------------------------------------------------------------
create or replace function public.restore_tenant_backup(
  p_backup_id uuid,
  p_tables text[] default array['bookings','clients','services','specialists','working_hours','blocked_slots','financial_settings'],
  p_mode text default 'merge'
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_backup tenant_backups%rowtype;
  v_slug text;
  -- Ред на възстановяване: справочните таблици преди bookings.
  v_order text[] := array['specialists','services','working_hours','blocked_slots','financial_settings','clients','bookings'];
  v_table text;
  v_rows jsonb;
  v_row jsonb;
  v_inserted int;
  v_skipped int;
  v_failed int;
  v_summary jsonb := '{}'::jsonb;
  v_row_errors jsonb;
begin
  if p_mode not in ('merge', 'replace') then
    raise exception 'Invalid mode: % (merge|replace)', p_mode;
  end if;

  select * into v_backup from tenant_backups where id = p_backup_id;
  if not found then
    raise exception 'Backup % not found', p_backup_id;
  end if;
  v_slug := v_backup.salon_slug;

  if not exists (select 1 from tenants t where t.salon_slug = v_slug) then
    raise exception 'Tenant % does not exist — create the tenant first, then restore.', v_slug;
  end if;

  foreach v_table in array v_order loop
    continue when not (v_table = any (p_tables));

    v_rows := coalesce(v_backup.tables -> v_table, '[]'::jsonb);
    v_inserted := 0; v_skipped := 0; v_failed := 0;
    v_row_errors := '[]'::jsonb;

    if p_mode = 'replace' then
      execute format('delete from public.%I where salon_slug = $1', v_table) using v_slug;
    end if;

    for v_row in select * from jsonb_array_elements(v_rows) loop
      -- Никога не възстановяваме ред на друг тенант.
      if (v_row ->> 'salon_slug') is distinct from v_slug then
        v_skipped := v_skipped + 1;
        continue;
      end if;

      if p_mode = 'replace' then
        -- Строг режим: грешка тук проваля (и rollback-ва) цялото възстановяване.
        execute format(
          'insert into public.%I select * from jsonb_populate_record(null::public.%I, $1)',
          v_table, v_table
        ) using v_row;
        v_inserted := v_inserted + 1;
      else
        begin
          execute format(
            'insert into public.%I select * from jsonb_populate_record(null::public.%I, $1)',
            v_table, v_table
          ) using v_row;
          v_inserted := v_inserted + 1;
        exception
          when unique_violation or exclusion_violation then
            v_skipped := v_skipped + 1;
          when others then
            v_failed := v_failed + 1;
            if jsonb_array_length(v_row_errors) < 5 then
              v_row_errors := v_row_errors || jsonb_build_object('id', v_row ->> 'id', 'error', SQLERRM);
            end if;
        end;
      end if;
    end loop;

    v_summary := v_summary || jsonb_build_object(v_table, jsonb_build_object(
      'inserted', v_inserted,
      'skipped', v_skipped,
      'failed', v_failed,
      'errors', v_row_errors
    ));
  end loop;

  return jsonb_build_object('backup_id', p_backup_id, 'salon_slug', v_slug, 'mode', p_mode, 'tables', v_summary);
end;
$$;

-- Заключване на достъпа: само service role (и postgres) могат да ги викат.
revoke all on table public.tenant_backups from public, anon, authenticated;
revoke execute on function public.create_tenant_backup(text, text) from public, anon, authenticated;
revoke execute on function public.run_tenant_backups() from public, anon, authenticated;
revoke execute on function public.restore_tenant_backup(uuid, text[], text) from public, anon, authenticated;
grant execute on function public.create_tenant_backup(text, text) to service_role;
grant execute on function public.run_tenant_backups() to service_role;
grant execute on function public.restore_tenant_backup(uuid, text[], text) to service_role;
grant select, insert, delete on table public.tenant_backups to service_role;

-- Дневен job в 01:30 UTC (04:30 в София — off-peak).
do $$
begin
  if exists (select 1 from cron.job where jobname = 'tenant-backups-daily') then
    perform cron.unschedule('tenant-backups-daily');
  end if;
  perform cron.schedule('tenant-backups-daily', '30 1 * * *', 'select public.run_tenant_backups()');
end;
$$;

-- DOWN
-- select cron.unschedule('tenant-backups-daily');
-- drop function if exists public.restore_tenant_backup(uuid, text[], text);
-- drop function if exists public.run_tenant_backups();
-- drop function if exists public.create_tenant_backup(text, text);
-- drop table if exists public.tenant_backups;
