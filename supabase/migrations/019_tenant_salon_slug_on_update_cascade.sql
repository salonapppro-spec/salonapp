-- Allow updating tenants.salon_slug so CASCADE propagates to all tenant child rows.
-- Required for controlled salon URL slug renames (super_admin API + auth metadata update).

ALTER TABLE public.specialists DROP CONSTRAINT IF EXISTS specialists_salon_slug_fkey;
ALTER TABLE public.specialists
  ADD CONSTRAINT specialists_salon_slug_fkey
  FOREIGN KEY (salon_slug) REFERENCES public.tenants (salon_slug) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public.services DROP CONSTRAINT IF EXISTS services_salon_slug_fkey;
ALTER TABLE public.services
  ADD CONSTRAINT services_salon_slug_fkey
  FOREIGN KEY (salon_slug) REFERENCES public.tenants (salon_slug) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public.working_hours DROP CONSTRAINT IF EXISTS working_hours_salon_slug_fkey;
ALTER TABLE public.working_hours
  ADD CONSTRAINT working_hours_salon_slug_fkey
  FOREIGN KEY (salon_slug) REFERENCES public.tenants (salon_slug) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_salon_slug_fkey;
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_salon_slug_fkey
  FOREIGN KEY (salon_slug) REFERENCES public.tenants (salon_slug) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public.blocked_slots DROP CONSTRAINT IF EXISTS blocked_slots_salon_slug_fkey;
ALTER TABLE public.blocked_slots
  ADD CONSTRAINT blocked_slots_salon_slug_fkey
  FOREIGN KEY (salon_slug) REFERENCES public.tenants (salon_slug) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS clients_salon_slug_fkey;
ALTER TABLE public.clients
  ADD CONSTRAINT clients_salon_slug_fkey
  FOREIGN KEY (salon_slug) REFERENCES public.tenants (salon_slug) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public.financial_settings DROP CONSTRAINT IF EXISTS financial_settings_salon_slug_fkey;
ALTER TABLE public.financial_settings
  ADD CONSTRAINT financial_settings_salon_slug_fkey
  FOREIGN KEY (salon_slug) REFERENCES public.tenants (salon_slug) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_salon_slug_fkey;
ALTER TABLE public.expenses
  ADD CONSTRAINT expenses_salon_slug_fkey
  FOREIGN KEY (salon_slug) REFERENCES public.tenants (salon_slug) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public.gallery DROP CONSTRAINT IF EXISTS gallery_salon_slug_fkey;
ALTER TABLE public.gallery
  ADD CONSTRAINT gallery_salon_slug_fkey
  FOREIGN KEY (salon_slug) REFERENCES public.tenants (salon_slug) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public.email_logs DROP CONSTRAINT IF EXISTS email_logs_salon_slug_fkey;
ALTER TABLE public.email_logs
  ADD CONSTRAINT email_logs_salon_slug_fkey
  FOREIGN KEY (salon_slug) REFERENCES public.tenants (salon_slug) ON UPDATE CASCADE ON DELETE CASCADE;
