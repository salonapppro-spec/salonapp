-- Tenant archiving metadata for super-admin operational cleanup.
alter table public.tenants
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid;

create index if not exists idx_tenants_archived_at on public.tenants (archived_at);

comment on column public.tenants.archived_at is 'When set, tenant is archived (soft archive).';
comment on column public.tenants.archived_by is 'Supabase auth user id of super-admin who archived.';
