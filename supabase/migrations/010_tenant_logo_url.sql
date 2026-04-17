alter table public.tenants
  add column if not exists logo_url text;

comment on column public.tenants.logo_url is 'Квадратно/хоризонтално лого в хедъра на публичния сайт (https URL).';
