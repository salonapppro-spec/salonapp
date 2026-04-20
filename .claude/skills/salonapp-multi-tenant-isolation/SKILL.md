---
name: salonapp-multi-tenant-isolation
description: Use when adding new database tables, modifying queries, or testing tenant data isolation. Triggers on phrases like "tenant isolation", "data leak", "RLS test", "multi-tenant", "проверка за изолация".
---

# Multi-Tenant Isolation Testing

Един изтекъл ред между tenants = край на SaaS.

## Тест workflow за нова таблица

### 1. Schema проверка
SELECT column_name, is_nullable FROM information_schema.columns 
WHERE table_name = 'YOUR_TABLE' AND column_name = 'salon_slug';
salon_slug → is_nullable = NO ОБЕЗАТЕЛНО.

### 2. RLS policies
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'YOUR_TABLE';
Трябва 4 policies (SELECT, INSERT, UPDATE, DELETE) с salon_slug check.

### 3. Manual isolation test
SET request.jwt.claim.salon_slug = 'tenant-a';
INSERT INTO YOUR_TABLE (salon_slug, ...) VALUES ('tenant-a', ...);
SET request.jwt.claim.salon_slug = 'tenant-b';
SELECT count(*) FROM YOUR_TABLE WHERE salon_slug = 'tenant-a';
ТРЯБВА да върне 0. Ако върне > 0 → СЧУПЕНО RLS.

## Code patterns

### ПРАВИЛНО
const { user } = await supabase.auth.getUser();
const salonSlug = user.app_metadata.salon_slug;
const data = await supabase.from('table').select().eq('salon_slug', salonSlug);

### ОПАСНО
const { salon_slug } = await req.json(); // tenant A може да прати tenant-b в body
const data = await supabase.from('table').select().eq('salon_slug', salon_slug);

## Super-admin impersonation safety
- Cookie set explicit
- Постоянен banner
- Audit log
- Auto-expire след 1 час
