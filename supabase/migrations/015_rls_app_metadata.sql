-- Migration 015: RLS policies — user_metadata → app_metadata
--
-- ПРИЧИНА: auth.jwt()->'user_metadata' може да се промени от потребителя чрез
-- supabase.auth.updateUser(). Салон А може да постави salon_slug на салон Б
-- и да чете/трие чуждите данни. app_metadata се записва само server-side
-- (service role) и е истинска trust boundary.
--
-- PREREQUISITE: Преди да пуснеш тази миграция изпълни
-- scripts/set-app-metadata.ts, за да обновиш всички съществуващи потребители.
-- Ако не го направиш, легитимните собственици временно губят достъп.

-- ---------------------------------------------------------------------------
-- BOOKINGS
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS bookings_owner_select ON public.bookings;
DROP POLICY IF EXISTS bookings_owner_update ON public.bookings;
DROP POLICY IF EXISTS bookings_owner_delete ON public.bookings;

CREATE POLICY bookings_owner_select ON public.bookings
  FOR SELECT TO authenticated
  USING (salon_slug = (auth.jwt()->'app_metadata'->>'salon_slug'));

CREATE POLICY bookings_owner_update ON public.bookings
  FOR UPDATE TO authenticated
  USING  (salon_slug = (auth.jwt()->'app_metadata'->>'salon_slug'))
  WITH CHECK (salon_slug = (auth.jwt()->'app_metadata'->>'salon_slug'));

CREATE POLICY bookings_owner_delete ON public.bookings
  FOR DELETE TO authenticated
  USING (salon_slug = (auth.jwt()->'app_metadata'->>'salon_slug'));

-- ---------------------------------------------------------------------------
-- SERVICES
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS services_owner_all ON public.services;

CREATE POLICY services_owner_all ON public.services
  FOR ALL TO authenticated
  USING  (salon_slug = (auth.jwt()->'app_metadata'->>'salon_slug'))
  WITH CHECK (salon_slug = (auth.jwt()->'app_metadata'->>'salon_slug'));

-- ---------------------------------------------------------------------------
-- CLIENTS
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS clients_owner_all ON public.clients;

CREATE POLICY clients_owner_all ON public.clients
  FOR ALL TO authenticated
  USING  (salon_slug = (auth.jwt()->'app_metadata'->>'salon_slug'))
  WITH CHECK (salon_slug = (auth.jwt()->'app_metadata'->>'salon_slug'));

-- ---------------------------------------------------------------------------
-- WORKING_HOURS
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS working_hours_owner_all ON public.working_hours;

CREATE POLICY working_hours_owner_all ON public.working_hours
  FOR ALL TO authenticated
  USING  (salon_slug = (auth.jwt()->'app_metadata'->>'salon_slug'))
  WITH CHECK (salon_slug = (auth.jwt()->'app_metadata'->>'salon_slug'));

-- ---------------------------------------------------------------------------
-- BLOCKED_SLOTS
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS blocked_slots_owner_all ON public.blocked_slots;

CREATE POLICY blocked_slots_owner_all ON public.blocked_slots
  FOR ALL TO authenticated
  USING  (salon_slug = (auth.jwt()->'app_metadata'->>'salon_slug'))
  WITH CHECK (salon_slug = (auth.jwt()->'app_metadata'->>'salon_slug'));

-- ---------------------------------------------------------------------------
-- FINANCIAL_SETTINGS
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS financial_settings_owner_all ON public.financial_settings;

CREATE POLICY financial_settings_owner_all ON public.financial_settings
  FOR ALL TO authenticated
  USING  (salon_slug = (auth.jwt()->'app_metadata'->>'salon_slug'))
  WITH CHECK (salon_slug = (auth.jwt()->'app_metadata'->>'salon_slug'));

-- ---------------------------------------------------------------------------
-- EXPENSES
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS expenses_owner_all ON public.expenses;

CREATE POLICY expenses_owner_all ON public.expenses
  FOR ALL TO authenticated
  USING  (salon_slug = (auth.jwt()->'app_metadata'->>'salon_slug'))
  WITH CHECK (salon_slug = (auth.jwt()->'app_metadata'->>'salon_slug'));

-- ---------------------------------------------------------------------------
-- GALLERY
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS gallery_owner_all ON public.gallery;

CREATE POLICY gallery_owner_all ON public.gallery
  FOR ALL TO authenticated
  USING  (salon_slug = (auth.jwt()->'app_metadata'->>'salon_slug'))
  WITH CHECK (salon_slug = (auth.jwt()->'app_metadata'->>'salon_slug'));

-- ---------------------------------------------------------------------------
-- EMAIL_LOGS
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS email_logs_owner_all ON public.email_logs;

CREATE POLICY email_logs_owner_all ON public.email_logs
  FOR ALL TO authenticated
  USING  (salon_slug = (auth.jwt()->'app_metadata'->>'salon_slug'))
  WITH CHECK (salon_slug = (auth.jwt()->'app_metadata'->>'salon_slug'));

-- ---------------------------------------------------------------------------
-- SPECIALISTS
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS specialists_owner_all ON public.specialists;

CREATE POLICY specialists_owner_all ON public.specialists
  FOR ALL TO authenticated
  USING  (salon_slug = (auth.jwt()->'app_metadata'->>'salon_slug'))
  WITH CHECK (salon_slug = (auth.jwt()->'app_metadata'->>'salon_slug'));
