-- Billing visibility for super-admin (manual/bank flows)
alter table public.tenants
  add column if not exists expiry_date date,
  add column if not exists grace_until_date date;

comment on column public.tenants.expiry_date is 'Край на текущия платен период.';
comment on column public.tenants.grace_until_date is 'Гратисен срок (примерно +3 дни) преди деактивация.';
