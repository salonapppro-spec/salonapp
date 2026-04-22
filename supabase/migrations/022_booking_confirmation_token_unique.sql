-- Enforce uniqueness on confirmation_token to prevent token collisions
-- and make lookup by token safe (currently only indexed, not constrained).
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_confirmation_token_key UNIQUE (confirmation_token);
