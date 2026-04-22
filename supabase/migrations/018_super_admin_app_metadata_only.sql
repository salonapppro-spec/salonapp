-- Migration 018: Super admin RLS — app_metadata only (remove user_metadata fallback)
--
-- ПРИЧИНА: coalesce(app_metadata.role, user_metadata.role) позволява всеки
-- потребител да си постави user_metadata.role = 'super_admin' и да получи
-- достъп до всички тенанти. user_metadata е user-writable. Fix: само app_metadata.
--
-- Засяга: tenants_super_admin_all, page_events_super_admin_select

DROP POLICY IF EXISTS tenants_super_admin_all ON public.tenants;
CREATE POLICY tenants_super_admin_all ON public.tenants
  FOR ALL TO authenticated
  USING  ((auth.jwt()->'app_metadata'->>'role') = 'super_admin')
  WITH CHECK ((auth.jwt()->'app_metadata'->>'role') = 'super_admin');

DROP POLICY IF EXISTS page_events_super_admin_select ON public.page_events;
CREATE POLICY page_events_super_admin_select ON public.page_events
  FOR SELECT TO authenticated
  USING ((auth.jwt()->'app_metadata'->>'role') = 'super_admin');
