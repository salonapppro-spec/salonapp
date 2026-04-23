---
name: salonapp-rate-limit-ddos
description: Use when configuring rate limits, DDoS protection, or anti-abuse measures. Triggers on phrases like "rate limit", "DDoS", "spam", "brute force", "abuse", "защита от атаки", "scraping", "Cloudflare".
---

# SalonApp Rate Limiting & DDoS Protection

## Текущо: bookings 40/min, leads 15/min ✓

## Слоеве

### Layer 1: Cloudflare
- DNS proxy
- DDoS protection
- Bot Fight Mode
- WAF rules

### Layer 2: Vercel Edge
- Edge middleware geo blocking
- IP-based rate limiting

### Layer 3: Application
| Endpoint | Limit | Window |
| POST /api/bookings | 40 | 1 min |
| POST /api/leads | 15 | 1 min |
| POST /api/auth/login | 5 | 5 min |
| POST /api/auth/signup | 3 | 1 hour |
| POST /api/auth/reset-password | 3 | 1 hour |
| GET /api/* | 100 | 1 min |

## Implementation
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(40, '1 m'),
});

const ip = req.headers.get('x-forwarded-for') ?? 'anonymous';
const { success } = await ratelimit.limit(ip);
if (!success) return Response.json({ error: 'Rate limit' }, { status: 429 });

## Anti-spam booking
- Phone validation (BG format)
- Email verification
- Honeypot field
- hCaptcha или Cloudflare Turnstile
- Block disposable emails

## Brute force
- Login: 5/15 min per IP+email
- Account lockout: 15 min след 10 неуспешни

## Monitoring
- Track 429 в Sentry
- Alert при > 100 blocked/min
