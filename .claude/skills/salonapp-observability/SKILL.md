---
name: salonapp-observability
description: Use when adding logging, monitoring, error tracking to SalonApp. Triggers on phrases like "logging", "monitoring", "Sentry", "alerts", "observability", "не виждам грешки", "production errors".
---

# SalonApp Observability

## Stack
- Errors: Sentry (free до 5k/month)
- Analytics: Vercel Analytics
- Speed: Vercel Speed Insights
- Database: Supabase Dashboard
- Uptime: UptimeRobot

## Setup
npx @sentry/wizard@latest -i nextjs

## Logging patterns

### Server actions
import * as Sentry from '@sentry/nextjs';
try {
  // logic
} catch (error) {
  Sentry.captureException(error, {
    tags: { action: 'book_appointment' },
    extra: { salon_slug, booking_date },
  });
  return { error: 'Booking failed' };
}

### Webhook errors (КРИТИЧНО)
catch (error) {
  Sentry.captureException(error, {
    level: 'fatal',
    tags: { webhook: 'stripe', event_type: event.type },
    extra: { event_id: event.id },
  });
  return new Response('Error', { status: 500 }); // 500 за Stripe retry
}

## Alerts

### Critical (immediate)
- Stripe webhook failure
- Database connection lost
- Auth failures > 50/min (potential attack)
- 5xx errors > 10/min

### Warning (daily)
- Slow queries > 1s
- Failed bookings > 5%

## Никога не log-вай
- Passwords (дори hashed)
- Credit card numbers
- Stripe secret keys
- PII в plain text

## GDPR logging
- Hash или first chars от emails
- Auto-delete logs > 90 дни
