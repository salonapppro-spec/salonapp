-- Harden super-admin select policy: trust only app_metadata.role
drop policy if exists page_events_super_select on public.page_events;

create policy page_events_super_select on public.page_events
  for select to authenticated
  using (
    (auth.jwt()->'app_metadata'->>'role') = 'super_admin'
  );
