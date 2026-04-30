create table if not exists public.lead_call_tasks (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.platform_leads (id) on delete cascade,
  call_day integer not null check (call_day in (15, 25)),
  due_date date not null,
  status text not null default 'pending' check (status in ('pending', 'called', 'no_answer', 'closed')),
  last_called_at timestamptz,
  next_call_at date,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lead_id, call_day)
);

create index if not exists idx_lead_call_tasks_due_status
  on public.lead_call_tasks (status, due_date);
