-- Постоянни разходи по категории + месечна цел за оборот (Промпт 6)
alter table public.financial_settings
  add column if not exists rent_eur numeric(10, 2) not null default 0,
  add column if not exists electricity_eur numeric(10, 2) not null default 0,
  add column if not exists water_eur numeric(10, 2) not null default 0,
  add column if not exists accounting_eur numeric(10, 2) not null default 0,
  add column if not exists monthly_revenue_goal_eur numeric(10, 2) not null default 0;

comment on column public.financial_settings.monthly_expenses is 'Други месечни разходи (прочие), без наем/ток/вода/счетоводство — виж отделните колони.';
