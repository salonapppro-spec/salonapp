-- Migration: 040_bookings_schema_hardening.sql
-- Изравнява production схемата на bookings с това, което кодът очаква
-- (одит 2026-07-08 — production никога не е бил създаван от 001_initial_schema):
--
--   1. booking_time беше TEXT → става TIME (кодът винаги праща HH:MM:SS)
--   2. booking_end_time ИЗОБЩО липсваше → всеки insert падаше веднъж (42703)
--      и минаваше през legacy fallback без края на часа; добавяме я + backfill
--   3. hair_length/hair_density CHECK бяха с БЪЛГАРСКИ стойности
--      ('къса','средна','дълга'), а кодът пише английски ('short','medium',
--      'long') → всеки insert с hair параметри падаше и се retry-ваше БЕЗ тях
--      (тихо губене на данни). Всички съществуващи стойности са NULL —
--      сменяме constraint-ите без remap.
--   4. bookings_no_overlap exclusion constraint (защита от двойни резервации
--      при паралелни заявки) не съществуваше — кодът обработва 23P01, но
--      базата никога не го е хвърляла. Добавяме го върху интервала на самата
--      услуга (буферът остава app-side правило). Проверено: 0 текущи
--      припокривания (2026-07-08).
--   5. Индексите от 001 (salon_slug+date, specialist, status) също липсваха.
--
-- Безопасност: ALTER TYPE пренаписва таблицата (44 реда — милисекунди);
-- всички стойности са проверени, че се парсват ('^\d{1,2}:\d{2}(:\d{2})?$').
--
-- UP

create extension if not exists btree_gist;

-- 1) booking_time: text -> time
alter table public.bookings
  alter column booking_time type time using booking_time::time;

-- 2) booking_end_time + backfill (край на услугата + буфер на тенанта,
--    както го записва кодът; clamp на 23:59:59 при преминаване през полунощ)
alter table public.bookings add column if not exists booking_end_time time;

update public.bookings b
set booking_end_time = case
  when b.booking_time::interval
       + make_interval(mins => b.service_duration + coalesce(
           (select fs.buffer_minutes::int from public.financial_settings fs where fs.salon_slug = b.salon_slug), 10))
       >= interval '24 hours'
  then time '23:59:59'
  else b.booking_time + make_interval(mins => b.service_duration + coalesce(
         (select fs.buffer_minutes::int from public.financial_settings fs where fs.salon_slug = b.salon_slug), 10))
end
where b.booking_end_time is null;

-- 3) hair CHECK-ове: български -> английски стойности (каквито пише кодът)
alter table public.bookings drop constraint if exists bookings_hair_length_check;
alter table public.bookings drop constraint if exists bookings_hair_density_check;
alter table public.bookings
  add constraint bookings_hair_length_check
  check (hair_length in ('short', 'medium', 'long'));
alter table public.bookings
  add constraint bookings_hair_density_check
  check (hair_density in ('thin', 'medium', 'thick'));

-- 4) Анти double-booking: два активни часа на един специалист (или без
--    специалист) в един салон не могат да се застъпват. При паралелна заявка
--    губещата получава 23P01 → кодът връща "Този час току-що беше зает."
alter table public.bookings add constraint bookings_no_overlap exclude using gist (
  salon_slug with =,
  (coalesce(specialist_id, 'none')) with =,
  tsrange(
    (booking_date + booking_time)::timestamp,
    (booking_date + booking_time)::timestamp + make_interval(mins => service_duration)
  ) with &&
) where (status not in ('cancelled', 'no_show'));

-- 5) Липсващите индекси от 001
create index if not exists idx_bookings_salon_date on public.bookings (salon_slug, booking_date);
create index if not exists idx_bookings_specialist on public.bookings (specialist_id);
create index if not exists idx_bookings_status on public.bookings (status);

-- DOWN
-- alter table public.bookings drop constraint if exists bookings_no_overlap;
-- alter table public.bookings drop constraint if exists bookings_hair_length_check;
-- alter table public.bookings drop constraint if exists bookings_hair_density_check;
-- alter table public.bookings add constraint bookings_hair_length_check check (hair_length in ('къса','средна','дълга'));
-- alter table public.bookings add constraint bookings_hair_density_check check (hair_density in ('рядка','средна','гъста'));
-- alter table public.bookings drop column if exists booking_end_time;
-- alter table public.bookings alter column booking_time type text using booking_time::text;
