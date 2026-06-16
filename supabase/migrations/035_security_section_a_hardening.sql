-- Section A hardening (2026-06): page_events anon insert, design_tokens drift, google integrations schema

-- A7: Analytics — only server (service role) may insert page_events
DROP POLICY IF EXISTS page_events_anon_insert ON public.page_events;

-- A8: tenants.design_tokens (used by tenant sites; missing from repo migrations)
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS design_tokens jsonb;

-- A8: tenant_google_integrations — idempotent schema for fresh deploys (prod may already have table)
CREATE TABLE IF NOT EXISTS public.tenant_google_integrations (
  id                            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                     uuid REFERENCES public.tenants (id) ON DELETE CASCADE,
  salon_slug                    text NOT NULL REFERENCES public.tenants (salon_slug) ON DELETE CASCADE,
  google_email                  text NOT NULL DEFAULT '',
  calendar_id                   text NOT NULL DEFAULT 'primary',
  calendar_name                 text,
  refresh_token_encrypted       text NOT NULL DEFAULT '',
  access_token_encrypted        text,
  token_expires_at              timestamptz,
  sync_enabled                  boolean NOT NULL DEFAULT false,
  needs_reconnect               boolean NOT NULL DEFAULT false,
  last_sync_error               text,
  watch_channel_id              text,
  watch_resource_id             text,
  watch_sync_token              text,
  watch_expiration_at           timestamptz,
  watch_channel_token_encrypted text,
  created_at                    timestamptz NOT NULL DEFAULT now(),
  updated_at                    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (salon_slug)
);

CREATE INDEX IF NOT EXISTS idx_tenant_google_integrations_salon
  ON public.tenant_google_integrations (salon_slug);

ALTER TABLE public.tenant_google_integrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_google_integrations_owner_all ON public.tenant_google_integrations;
CREATE POLICY tenant_google_integrations_owner_all ON public.tenant_google_integrations
  FOR ALL TO authenticated
  USING  (salon_slug = (auth.jwt()->'app_metadata'->>'salon_slug'))
  WITH CHECK (salon_slug = (auth.jwt()->'app_metadata'->>'salon_slug'));
