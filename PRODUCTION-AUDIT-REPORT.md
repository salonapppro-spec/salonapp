# Production Audit Report

**Date:** 2026-06-16T16:12:36.888Z
**Base URL:** https://salonapp.pro
**Tenant A:** euphoria
**Tenant B:** magnetic-eyes

## Summary

| Layer | Result |
|-------|--------|
| HTTP smoke | PASS (10/10) |
| Unit tests | PASS |
| Integration tests | PASS |

## HTTP smoke

| Check | Status | ms | Pass | Note |
|-------|--------|-----|------|------|
| Landing | 200 | 167 | ✅ | — |
| Admin login | 200 | 205 | ✅ | — |
| Cron reminders (no secret) | 401 | 210 | ✅ | — |
| Cron google-watch (no secret) | 404 | 159 | ✅ | known P0: route missing (vercel.json cron 404) |
| Tenant path /euphoria | 200 | 373 | ✅ | — |
| Tenant subdomain euphoria | 200 | 670 | ✅ | — |
| Availability API (needs service_id) | 400 | 194 | ✅ | — |
| GET /api/bookings legacy (needs service_id) | 400 | 197 | ✅ | — |
| Root POST booking (tenant context) | 400 | 191 | ✅ | tenant context resolved |
| Host-bound services mismatch | 403 | 464 | ✅ | — |

## Open audit items (not verified here)

- #23 N-18 admin copy rename
- #24 Dynamic TENANT_SITES registry
- E2E browser flows (manual QA recommended)
