-- Allow clients to opt out of reminder emails via unsubscribe link
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS email_unsubscribed boolean NOT NULL DEFAULT false;
