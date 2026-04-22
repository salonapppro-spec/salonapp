-- Track email opt-out per booking (linked to the unsubscribe link sent in reminder emails)
alter table public.bookings
  add column if not exists email_unsubscribed boolean not null default false;

comment on column public.bookings.email_unsubscribed is
  'Set to true when the client clicks the unsubscribe link in a reminder email. Prevents further reminder emails for this booking.';
