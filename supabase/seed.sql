-- Тестови данни: тенант lindy-design (след migrations 001–002)
-- Изпълни с: supabase db reset (или ръчно след празна база)

insert into public.tenants (
  salon_slug,
  salon_name,
  plan,
  status,
  template,
  primary_color,
  font,
  payment_type,
  description,
  hero_title,
  hero_subtitle
) values (
  'lindy-design',
  'Lindy Design',
  'standard',
  'active',
  'bloom',
  '#F2A58E',
  'Inter',
  'stripe',
  'Салон за маникюр и красота — демо данни за SalonApp.pro.',
  'Lindy Design',
  'Грижа за детайла'
);

-- Понеделник (1) – Събота (6): 09:00–18:00; Неделя (0) по подразбиране не се сийдва като работен ден
insert into public.working_hours (salon_slug, specialist_id, day_of_week, start_time, end_time, is_day_off) values
  ('lindy-design', null, 1, time '09:00', time '18:00', false),
  ('lindy-design', null, 2, time '09:00', time '18:00', false),
  ('lindy-design', null, 3, time '09:00', time '18:00', false),
  ('lindy-design', null, 4, time '09:00', time '18:00', false),
  ('lindy-design', null, 5, time '09:00', time '18:00', false),
  ('lindy-design', null, 6, time '09:00', time '18:00', false);

insert into public.services (
  salon_slug, name, price_eur, duration_minutes, is_complex, is_active
) values
  ('lindy-design', 'Маникюр', 25.00, 60, false, true),
  ('lindy-design', 'Педикюр', 30.00, 75, false, true),
  ('lindy-design', 'Гел лак', 35.00, 90, false, true),
  ('lindy-design', 'Сваляне', 15.00, 30, false, true);

insert into public.services (
  salon_slug,
  name,
  price_eur,
  is_complex,
  active_start_min,
  active_start_max,
  waiting_min,
  waiting_max,
  active_finish_min,
  active_finish_max,
  is_active
) values (
  'lindy-design',
  'Балеаж',
  85.00,
  true,
  20,
  40,
  60,
  120,
  20,
  30,
  true
);

insert into public.financial_settings (
  salon_slug,
  monthly_expenses,
  desired_salary,
  working_days_per_week,
  working_hours_per_day,
  vat_enabled,
  booking_window_days,
  buffer_minutes,
  magnetic_scheduling
) values (
  'lindy-design',
  580.00,
  1500.00,
  5,
  8,
  false,
  30,
  10,
  true
);
