---
name: salonapp-gdpr-compliance
description: Use when implementing GDPR features in SalonApp. Triggers on phrases like "GDPR", "data deletion", "data export", "cookie banner", "privacy", "право на изтриване", "лични данни", "съгласие".
---

# SalonApp GDPR Compliance

EU SaaS = задължително. Глоби до 4% от оборота.

## Основни права

### 1. Right to access (Чл. 15)
/api/gdpr/export → връща JSON с всички данни

### 2. Right to deletion (Чл. 17)
- Анонимизирай (не изтривай) booking history
- client_name → "Изтрит клиент"
- client_phone → NULL
- client_email → "deleted-{hash}@deleted.local"
- Запази record за финансов одит

### 3. Right to rectification (Чл. 16)
UI за редакция в client portal

### 4. Right to data portability (Чл. 20)
Export в JSON/CSV

## Cookie consent

### Категории
- Necessary (винаги): auth, booking
- Analytics (opt-in): Vercel Analytics
- Marketing (opt-in): Facebook Pixel, GTM

### Implementation
Cookie cookie_consent={necessary|analytics|all}
Зареждай analytics САМО след consent

## Privacy Policy (задължителна)
1. Кой сме (адрес, EIK)
2. Какви данни събираме
3. Защо (legal basis)
4. С кого споделяме (Supabase, Stripe, Resend, Vercel)
5. Колко време пазим
6. Права на потребителя
7. Как да упражни правата
8. DPO email
9. Право на жалба до КЗЛД

## Data retention
- Booking data: 5 години (счетоводно)
- Marketing data: до withdrawal of consent
- Logs: 90 дни
- Backups: 30 дни
- Изтрит tenant: 30 дни grace, после permanent

## DPA (Data Processing Agreement)
- Supabase ✓
- Stripe ✓
- Resend ✓
- Vercel ✓

## Sub-processor list (публично)
Страница /privacy/subprocessors

## Pre-launch checklist
- Cookie banner active
- Privacy Policy live
- Terms of Service live
- Data export endpoint работи
- Data deletion endpoint работи
- DPA подписан с всички vendors
