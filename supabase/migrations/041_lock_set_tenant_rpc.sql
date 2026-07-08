-- Migration: 041_lock_set_tenant_rpc.sql
-- Hardening (одит 2026-07-08): public.set_tenant() е SECURITY DEFINER и беше
-- изпълнима от anon/authenticated през /rest/v1/rpc/set_tenant. Тя задава
-- app.salon_slug, върху който стъпват legacy "Tenant isolation" RLS политиките
-- (ALL за public role) на bookings/clients и др. Кодът НИКЪДЕ не я вика
-- (всичко минава през service role / tenantDb) — заключваме я, за да не може
-- външен клиент с anon ключа да експериментира с нея.
--
-- UP
revoke execute on function public.set_tenant(text) from public, anon, authenticated;

-- DOWN
-- grant execute on function public.set_tenant(text) to anon, authenticated;
