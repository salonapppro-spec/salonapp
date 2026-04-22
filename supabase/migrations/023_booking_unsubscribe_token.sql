-- Separate token for email unsubscribe links, so leaking it cannot be used
-- to confirm or cancel a booking (principle of least privilege per token).
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS unsubscribe_token uuid NOT NULL DEFAULT gen_random_uuid();

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_unsubscribe_token_key UNIQUE (unsubscribe_token);
