-- GDPR deletion requests — audit trail for compliance
create table public.gdpr_deletion_requests (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  email         text not null,
  phone         text,
  details       text,
  status        text not null default 'pending'
                  check (status in ('pending', 'completed')),
  created_at    timestamptz not null default now(),
  completed_at  timestamptz
);

-- Super admin reads all; no public access
alter table public.gdpr_deletion_requests enable row level security;

create policy gdpr_requests_super_admin_only on public.gdpr_deletion_requests
  for all
  to authenticated
  using (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  );

comment on table public.gdpr_deletion_requests is
  'Audit trail for GDPR Art.17 deletion requests. Required for compliance.';
