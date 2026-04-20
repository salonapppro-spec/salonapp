---
name: salonapp-performance
description: Use when optimizing SalonApp performance — page speed, database queries, caching, bundle size. Triggers on phrases like "performance", "бавно зарежда", "optimize", "caching", "ISR", "slow query", "scale".
---

# SalonApp Performance

## Цели
- Lighthouse > 90 mobile
- LCP < 2.5s на 4G
- Database query < 100ms p95
- API response < 500ms p95
- Bundle < 200KB initial JS

## Caching

### Public pages (ISR)
export const revalidate = 300; // 5 минути за landing
export const revalidate = 3600; // 1 час за booking форма

### Admin pages
export const dynamic = 'force-dynamic';

## Database

### Задължителни indexes
CREATE INDEX idx_bookings_salon_slug ON bookings(salon_slug);
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_salon_date ON bookings(salon_slug, booking_date);

### Query patterns

ПРАВИЛНО:
.select('id, client_name, booking_time') // само нужните полета
.eq('salon_slug', slug)
.gte('booking_date', today)
.limit(50)

ГРЕШНО:
.select('*') // всички колони
без LIMIT, без filter

### N+1 query — никога
Винаги JOIN или .in() с array от ids.

## Bundle size
npm run build → виж "First Load JS" → < 200KB

## Image optimization
import Image from 'next/image';
<Image src="/photo.jpg" width={800} height={600} sizes="(max-width: 768px) 100vw, 50vw" />

## Connection pooling Supabase
Use pooler URL (port 6543) за runtime, direct URL за migrations.
