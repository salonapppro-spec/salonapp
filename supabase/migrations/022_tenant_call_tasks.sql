create table if not exists public.tenant_call_tasks (
  id uuid primary key default gen_random_uuid(),
  salon_slug text not null references public.tenants (salon_slug) on delete cascade,
  call_type text not null check (call_type in ('expiry_plus_15', 'expiry_plus_25', 'manual')),
  due_date date not null,
  status text not null default 'pending' check (status in ('pending', 'called', 'no_answer', 'closed')),
  last_called_at timestamptz,
  next_call_at date,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (salon_slug, call_type, due_date)
);

create index if not exists idx_tenant_call_tasks_due_status
  on public.tenant_call_tasks (status, due_date);

create index if not exists idx_tenant_call_tasks_salon
  on public.tenant_call_tasks (salon_slug, created_at desc);
