---
name: salonapp-security-audit
description: Use when performing security audit on SalonApp before release, after major changes, or before onboarding paid clients. Triggers on phrases like "security audit", "проверка за сигурност", "одит", "OWASP", "пентест", "vulnerability scan".
---

# SalonApp Security Audit

## 1. Secrets scan
git log --all -p | grep -iE "(SUPABASE_SERVICE_ROLE|STRIPE_SECRET|RESEND_API|sk_live_|sk_test_)" | head -50
grep -rE "(SUPABASE_SERVICE_ROLE|STRIPE_SECRET|sk_live_)" --include=".tsx" --include=".ts" --exclude-dir=node_modules .
Ако намериш secret → СПРИ → ротирай ключа → почисти git history.

## 2. Service role key audit
grep -rn "createSupabaseServiceRoleClient" --include="*.tsx" app/
Всеки резултат трябва да е в server actions или API routes — НЕ в "use client" компонент.

## 3. RLS audit
За всяка таблица в Supabase:
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
Всички rowsecurity ТРЯБВА да са true.

## 4. API route audit
За всеки app/api/*/route.ts провери:
- Zod schema за input
- Rate limiting
- Auth check
- Error responses не leak-ват информация

## 5. Webhook audit
- stripe.webhooks.constructEvent() задължително
- Idempotency check
- Try/catch с proper logging

## 6. CSP & Security Headers
В next.config.js или middleware.ts:
- Content-Security-Policy
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security
- Referrer-Policy

## 7. Dependency audit
npm audit --production
High или critical → fix преди release.

## 8. Доклад
Създай SECURITY_AUDIT_[DATE].md с намерени проблеми, файлове, действия, status PASS/FAIL.
