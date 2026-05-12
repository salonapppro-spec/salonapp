-- GDPR export tokens for two-step identity verification
-- Token is sent to the user's email; data is only exported after they click the link

CREATE TABLE IF NOT EXISTS gdpr_export_tokens (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  token       text        NOT NULL UNIQUE,
  email       text        NOT NULL,
  phone       text,
  expires_at  timestamptz NOT NULL,
  used_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE gdpr_export_tokens ENABLE ROW LEVEL SECURITY;
-- No public RLS policies — table is accessed only via service role client
