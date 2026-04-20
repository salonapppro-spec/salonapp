-- Migration: 011_resolve_tenant_public_rpc.sql
-- Creates RPC function used by middleware for subdomain tenant resolution.
-- Called via fetch() in middleware.ts → resolveTenant() for every
-- subdomain request (e.g. salon-bizhu.salonapp.pro).

CREATE OR REPLACE FUNCTION resolve_tenant_public(
  p_salon_slug TEXT DEFAULT NULL,
  p_domain     TEXT DEFAULT NULL
)
RETURNS TABLE (salon_slug TEXT, status TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_salon_slug IS NOT NULL THEN
    RETURN QUERY
      SELECT t.salon_slug::TEXT, t.status::TEXT
      FROM tenants t
      WHERE t.salon_slug = p_salon_slug
      LIMIT 1;
  ELSIF p_domain IS NOT NULL THEN
    RETURN QUERY
      SELECT t.salon_slug::TEXT, t.status::TEXT
      FROM tenants t
      WHERE t.domain = p_domain
      LIMIT 1;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION resolve_tenant_public(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION resolve_tenant_public(TEXT, TEXT) TO authenticated;
