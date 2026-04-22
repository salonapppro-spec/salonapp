# Доклад: завършени стъпки и предстоящи промени (SalonApp)

*Алтернативни имена на файла, ако преименуваш: `REMEDIATION-BACKLOG.md`, `security-roadmap-next.md`.*

---

## Резюме

Този документ обобщава **какво вече е внедрено** по одитния план (етапи 1–4 и допълнения към rate limit) и **какво предстои** (етапи 5–9 и свързани follow-up). Не замества детайлен пентест или правен преглед на Supabase RLS в Dashboard.

---

## Завършено (референция)

| Област | Съдържание |
|--------|------------|
| Публични URL (настройки) | Строга валидация + безопасен рендер (социални, Google Maps embed). |
| Upload hardening | Magic bytes, MIME↔bytes, Sharp→WebP, admin upload routes; път от сървърен tenant slug. |
| Builder preview | `postMessage` с `targetOrigin`; allowlist за `origin` + preview token (`?builderPreview=1&pt=`). |
| Rate limiting / abuse | Централен `applyRateLimit` (Upstash при `UPSTASH_*`, иначе in-memory); middleware за публични API + **cron** + **Stripe webhook**; `logAbuseEvent` при 429; примерен 5xx лог при booking POST. |
| Production env (препоръчително) | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` в Vercel за глобални лимити. |

---

## Предстоящи промени по план

### Етап 5 — MEDIUM: Stripe lifecycle

- Запис и ползване на **`stripe_subscription_id`** (и стабилен **`stripe_customer_id`**) при подходящи webhook събития.
- **`findTenant` / email fallback**: остави само като временен път; ясно логване/предупреждение при употреба; намаляване на риска при споделен имейл между тенанти.
- **Тестове / ръчен чеклист**: duplicate event, processing error + retry, `customer.subscription.deleted`, failed invoice.

### Етап 6 — MEDIUM: Sentry

- **`instrumentation.ts`**: server/edge init според текущата Sentry + Next 15 документация (build предупрежденията за липсващ instrumentation).
- **`instrumentation-client.ts`** / преместване от deprecated client config.
- **`app/global-error.tsx`**: React render errors към Sentry.
- **Source maps**: токени само в CI / Vercel env (не в клиентски bundle по невнимание).

### Етап 7 — MEDIUM/LOW: Оперативни и качество

- **`npm audit fix`** за `follow-redirects` (и повторен build).
- **`billing-expiry`**: при 5xx без `raw error.message` в JSON към клиента — само generic + server log.
- **Impersonation**: server action „изход от салон“ → clear cookie; по-кратък TTL (напр. 1h вместо 12h); по желание audit log (super-admin id, target slug, action, time).
- **Performance (follow-up)**: `next/image` където има `@next/next/no-img-element` (напр. Groom, Luxe2) — не P0 security.

### Етап 8 — GDPR / legal (ако продуктът го изисква)

- Заявка → таблица + статуси + audit trail.
- Export процес.
- Anonymization където е уместно вместо грубо триене.
- Retention job според privacy policy.
- Cookie consent, ако има analytics/marketing зад CSP.

### Етап 9 — Финал преди release

- **Security smoke**: URL validation, upload, postMessage, cron secret, tenant isolation, booking payload, rate limits с Upstash.
- **Business smoke**: услуга → сайт → резервация → имейл → admin → Stripe → inactive по grace.

---

## Допълнителни follow-up (от одит, извън номерацията на етапите)

- **CSP**: коментар в `next.config.mjs` споменава report-only, а headerът е enforcing — подравни документация или режим според решение.
- **Builder allowlist**: при custom домейни / www vs apex добави съответния origin в `builderPostMessageParentOrigins` (или env списък).
- **WAF / Cloudflare**: Layer 1 за DDoS; rate limit в приложението не замества edge firewall.
- **Service role + RLS**: периодични тестове за изолация по `salon_slug` (и Storage prefix policies, migration 016).

---

## Име на файла

Използвано е **`docs/planned-changes-report.md`**, за да е ясно, че е **план и доклад**, не changelog на минали версии. Ако предпочиташ по-кратко име в root: **`PLANNED-WORK.md`**.

---

*Последна актуализация на доклада: по състоянието на репото и одитния план (етапи 1–4 завършени; 5–9 предстоят).*
