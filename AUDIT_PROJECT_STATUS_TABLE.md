# Audit Tracking Table

Последна актуализация: 2026-04-23

Подробен отчет: [AUDIT_PROJECT_STATUS.md](./AUDIT_PROJECT_STATUS.md)


| Задача | Статус | Риск | Owner | Priority |
| --- | --- | --- | --- | --- |
| P0.1 Fix на public API tenant context spoof path (`x-salon-slug` trust на root host) | Остава | Критичен | Engineering | P0 |
| P0.2 Backend RBAC/capability enforcement (owner/admin/specialist, backend deny checks) | Остава | Критичен | Engineering + Security | P0 |
| P0.3 Stripe tenant resolution: email fallback default OFF (IDs-only, fail-closed) | Остава | Критичен | Engineering + Billing | P0 |
| P0.4 Storage runtime isolation proof (A->A PASS, A->B mutation 401/403) | Остава | Критичен | Engineering | P0 |
| P0.5 Confirm/Cancel token flow hardening (one-time, TTL, tenant-bound) | Остава | Висок към критичен | Engineering | P0 |
| Runtime integration execution (`test:integration` с реални secrets/IDs/tokens) | Остава | Критичен | Engineering + Security | P0 |
| Public host/slug mismatch runtime proof (`services`, `availability`, `bookings`, `clients/lookup`) | Остава | Критичен | Engineering | P0 |
| Tenant API isolation runtime proof (A cannot read/write/delete B) | Остава | Критичен | Engineering | P0 |
| Admin boundary runtime proof (`/super-admin/*` и super-admin API deny за tenant admin) | Остава | Критичен | Engineering | P0 |
| Export/report leakage runtime proof (A не вижда B данни) | Остава | Критичен | Engineering + Product Analytics | P0 |
| Настройка на GitHub Secrets за integration suite-овете | Остава | Висок | Repo Admin | P0 |
| CI execution с integration suite-овете и зелен build | Остава | Висок | Engineering | P0 |
| Branch protection: CI да е required check за merge | Остава | Висок | Repo Admin | P0 |
| P1.1 Finance scope trusted-source cleanup (без `user_metadata.specialist_id`) | Остава | Висок | Engineering + Security | P1 |
| P1.2 Access control/auth финален пас (roles/sessions/cookies/CSRF/impersonation) | Вероятно остава | Висок | Security | P1 |
| P1.3 Finance/admin integrity пас (billing/webhook/cron/manual consistency, retry/replay) | Вероятно остава | Висок | Engineering + Finance Ops | P1 |
| P2.1 Cleanup на remaining raw platform modules (`lib/get-tenant.ts`, `lib/owner-recovery-link.ts`, token routes, track/leads/consultation) | Остава | Среден | Engineering | P2 |
| Поддържане на service-role guard (`check:service-role-boundary`) | Готово | Нисък | Engineering | P2 |
| Production SQL verification (RLS/storage/fallback) | Готово | Нисък | Security | P2 |


## Легенда

- **Статус**: Готово / Остава / Вероятно остава
- **Риск**: Критичен / Висок / Среден / Нисък
- **Priority**: P0 (блокер), P1 (силно препоръчително преди launch), P2 (след launch или в hardening цикъл)

## Definition of Done (Launch Gate)

Всички P0 задачи са маркирани като `Готово` и последният CI run е зелен с:

- `check:service-role-boundary`
- unit test suite
- integration suite-ове (runtime)

