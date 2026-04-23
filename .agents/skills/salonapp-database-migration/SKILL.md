---
name: salonapp-database-migration
description: Use when creating, modifying, or rolling back Supabase database migrations. Triggers on phrases like "migration", "ALTER TABLE", "нова колона", "промени схема", "rollback", "database update".
---

# SalonApp Database Migration

## Workflow

### 1. Backup ПРЕДИ migration
Supabase Dashboard → Settings → Backups → Manual backup
Или: supabase db dump > backup_$(date +%Y%m%d_%H%M%S).sql

### 2. Test на staging първо
- Apply на staging Supabase project
- Smoke tests
- RLS check
- Performance check

### 3. Apply на production (off-peak)
В България: 02:00-05:00 ч.

### 4. Verify
- Schema check
- RLS check
- Sample query check
- App still works

## Safe operations
- ADD COLUMN (с default или NULLABLE)
- ADD INDEX (CONCURRENTLY)
- CREATE TABLE
- ADD FOREIGN KEY (NOT VALID, after VALIDATE)

## Dangerous (изискват downtime)
- DROP COLUMN
- ALTER COLUMN TYPE
- DROP TABLE
- ADD NOT NULL on existing nullable

## Two-phase migration за dangerous ops
Phase 1: Add new column, write to both
Phase 2: Switch reads to new
Phase 3: Drop old column

## Migration template
-- Migration: 2026_04_20_add_notes_to_bookings.sql
-- UP
ALTER TABLE bookings ADD COLUMN notes TEXT;
-- DOWN
ALTER TABLE bookings DROP COLUMN IF EXISTS notes;

## Pre-migration checklist
- Backup направен
- Tested на staging
- Rollback script готов
- Off-peak hours
- Лина уведомена
