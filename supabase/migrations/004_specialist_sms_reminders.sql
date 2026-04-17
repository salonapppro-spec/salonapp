-- SMS напомняния за Колектив (опция по специалист)
alter table public.specialists
  add column if not exists sms_reminders_enabled boolean not null default false;
