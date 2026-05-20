-- Fix: Enable RLS on tables where policies exist but RLS was never turned on.
-- Supabase Security Advisor flagged these as critical (rls_disabled_in_public).

-- 1. tenants — super_admin_all policy already exists
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- 2. specialists — owner_all + public_read policies already exist
ALTER TABLE public.specialists ENABLE ROW LEVEL SECURITY;

-- 3. page_events — anon_insert + super_select policies already exist
ALTER TABLE public.page_events ENABLE ROW LEVEL SECURITY;

-- 4. leads — public landing page submissions; no existing policies
--    Allow anyone to INSERT (public form), deny all reads (service role only).
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS leads_anon_insert ON public.leads;
CREATE POLICY leads_anon_insert ON public.leads
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);
