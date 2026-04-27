# Tenant Isolation & Security Audit Status

Последна актуализация: 2026-04-23

Табличен tracking: [AUDIT_PROJECT_STATUS_TABLE.md](./AUDIT_PROJECT_STATUS_TABLE.md)

## Executive Assessment (Pre-Production)

👉 **Не е минато абсолютно всичко.**  
👉 **Мината е най-рисковата част.**

### Какво е доказано към момента

- Tenant isolation архитектурата е затегната (`tenantDb`, host-bound tenant context, service-role guardrails).
- Production RLS/storage policy verification е PASS.
- Няма `user_metadata` fallback в production policies/routines.
- CI guardrails са активни и минават.

### Какво още не е доказано runtime

- Integration suite-овете са добавени, но още не са изпълнени успешно с реални secrets и test данни.
- Липсва пълно runtime доказателство за A->B граници (API, storage, admin boundaries, export/report).
- Access control/auth и finance/admin integrity пасовете са вероятно незатворени докрай.

### Честна оценка

- Оценка: **80-85% затворена сигурност** (оценъчна стойност, не формален KPI).
- Оставащите 15-20% са най-вече: runtime доказателство, access control финален пас, billing/admin consistency.

### Launch позиция

- **Това е важно преди production launch: да.**
- Етапът вече не е "има ли дупка в архитектурата", а "докажи в runtime, че няма пробив".
- Go/No-Go за paid клиенти минава през зелени runtime integration резултати и липса на cross-tenant leakage.

## Fix Before Launch / Can Wait (Detailed)

Тази секция е детайлен execution списък. Целта е да няма двусмислие какво е блокер и какво може да изчака.

### P0 (Fix Before Launch)

#### P0.1 Public API tenant context spoof (`x-salon-slug` trust path)

- Риск: **Критичен**
- Защо е проблем:
  - Ако backend приема входящ `x-salon-slug` като trusted source на root host, атакуващ може да подаде чужд slug.
  - Това заобикаля host-bound tenant контекста и може да доведе до грешен tenant scope в public API.
- Какво трябва да се направи:
  - На root host да не се trust-ва клиентски `x-salon-slug`.
  - Tenant slug да идва само от server-resolved context (middleware/host mapping), не от клиента.
  - При mismatch: твърд reject (`400/403`) + abuse logging.
- Acceptance критерии:
  - `host A + slug B` е reject за:
    - `/api/services`
    - `/api/availability`
    - `/api/bookings`
    - `/api/clients/lookup`
  - Няма успешен read/write в чужд tenant context.
- Доказателство:
  - Зелен integration suite `host-bound public API enforcement`.
  - Артефакт с реални заявки и response codes.

#### P0.2 Backend RBAC/capability enforcement (вътре в tenant)

- Риск: **Критичен**
- Защо е проблем:
  - Добрата tenant изолация не е достатъчна, ако вътре в tenant липсва строга backend authorization.
  - UI ограничения не са security контрол.
- Какво трябва да се направи:
  - Да се дефинират backend capabilities по роля (owner/admin/specialist).
  - Критични операции да имат сървърен capability check:
    - settings write
    - export/report access
    - finances read/write
    - destructive CRUD операции
  - Да се уеднакви UI и API поведение (без privilege drift).
- Acceptance критерии:
  - Потребител с по-ниска роля получава `403` на забранени API операции.
  - Няма endpoint, който разчита само на UI gating.
- Доказателство:
  - Интеграционни тестове по capability матрица.
  - Кратка role-permission таблица в docs.

#### P0.3 Stripe tenant resolution: disable email fallback by default

- Риск: **Критичен**
- Защо е проблем:
  - Fallback по email може да резолвне грешен tenant при частично разкачена Stripe linkage.
  - Риск от грешна активация/деактивация и billing integrity инциденти.
- Какво трябва да се направи:
  - Default режим: IDs-only resolution (`customer/subscription/metadata`), fail-closed.
  - Email fallback само при изрично enable-нат флаг и с audit log.
- Acceptance критерии:
  - При липсващи Stripe IDs webhook обработката fail-ва безопасно.
  - Няма автоматична tenant активация по email-only match.
- Доказателство:
  - Тестове за webhook resolution paths (IDs present/missing).
  - Логове, че fallback е off по default.

#### P0.4 Storage runtime boundary proof (A cannot mutate B paths)

- Риск: **Критичен**
- Защо е проблем:
  - Policy scan е необходим, но не достатъчен без runtime proof.
- Какво трябва да се направи:
  - Реален runtime test с JWT на Tenant A:
    - upload към `tenant-a/`* -> PASS (`200/201`)
    - upload/update/delete към `tenant-b/*` -> DENY (`401/403`)
- Acceptance критерии:
  - Няма успешна mutation в foreign tenant path.
- Доказателство:
  - Зелен integration suite `storage boundary isolation`.
  - Запазени request/response артефакти.

#### P0.5 Confirm/Cancel token flow hardening

- Риск: **Висок към критичен** (спрямо трафик/експозиция)
- Защо е проблем:
  - Token-only flow без достатъчен binding/hardening увеличава риска от abuse при token leakage.
- Какво трябва да се направи:
  - Token-ите да са:
    - one-time
    - с TTL
    - tenant-bound (и по възможност booking-bound + action-bound)
  - Използван/expired token -> reject + audit event.
- Acceptance критерии:
  - Повторно използване на token е невъзможно.
  - Token от един tenant не работи в друг tenant context.
- Доказателство:
  - Интеграционни тестове за replay/expiry/cross-tenant misuse.

### P1 (Should Complete Before Paid Customers)

#### P1.1 Finance scope trusted-source cleanup (`user_metadata.specialist_id`)

- Риск: **Висок**
- Защо е проблем:
  - Ако authorization scope зависи от user-controlled metadata, има риск от privilege inflation.
- Какво трябва да се направи:
  - Да се използва само server-trusted source:
    - `app_metadata` или
    - DB mapping, контролиран от backend.
- Acceptance критерии:
  - Няма finance critical path, който чете `user_metadata.specialist_id`.
- Доказателство:
  - Code scan + tests за authorization scope.

#### P1.2 Access control/auth финален пас

- Риск: **Висок**
- Обхват:
  - auth/session/cookies
  - CSRF edge cases
  - impersonation boundaries
  - API/UI parity за разрешения
- Acceptance критерии:
  - Няма bypass на критични операции през алтернативен endpoint/flow.
- Доказателство:
  - Завършен checklist с PASS/FAIL и remediation notes.

#### P1.3 Finance/admin integrity пас

- Риск: **Висок**
- Обхват:
  - billing state transitions
  - webhook retry/replay behavior
  - cron/manual action consistency
  - auditability на критични admin действия
- Acceptance критерии:
  - Няма double-processing и inconsistent activation state.
- Доказателство:
  - Сценарни тестове + log evidence.

### P2 (Can Wait, but Track)

#### P2.1 Platform raw module cleanup

- Риск: **Среден (future risk / technical debt)**
- Обхват:
  - `lib/get-tenant.ts`
  - `lib/owner-recovery-link.ts`
  - `confirm/cancel` token routes (ако не е затворено като P0 hardening)
  - `track`, `leads`, `consultation`
  - част от super-admin/raw platform modules
- Цел:
  - Централизация в `lib/platform/`* wrappers и минимизация на raw DB paths.

### Runtime Verification Gate (No-Go ако липсва)

Следните точки са задължителен Go/No-Go gate:

- `test:integration` минава зелено с реални secrets/data.
- Runtime доказателства за:
  - host/slug mismatch rejects
  - tenant API isolation (A cannot read/write/delete B)
  - storage boundary isolation
  - admin boundary denies
  - export/report leakage absence

Ако някоя от тези точки е FAIL или NOT VERIFIED: **No-Go за paid launch**.

## ГОТОВО

### Архитектура и tenant isolation

- Въведен е `tenantDb` слой.
- Tenant-scoped кодът е изкаран от raw service-role достъп.
- Public tenant API-тата са вързани към host/middleware context.
- `salon_slug` вече не е source of truth от клиента.
- CI guard за service-role boundary е добавен и минава.
- Production SQL verification е PASS.
- Няма засечен `user_metadata` fallback в production policies/routines.

### Одитни доказателства

- `check:service-role-boundary` -> PASS
- Текущият test suite -> PASS
- Production SQL verification -> PASS
- Integration suite-овете са добавени

---

## ОСТАВА

### 1) Runtime integration execution

Тестовете са написани, но още трябва да се пуснат с:

- GitHub secrets
- test tenants
- реални test IDs
- token/cookie

Какво трябва да стане:

- `test:integration` да мине реално
- CI да мине реално с integration suite-овете

Статус: **Остава**

### 2) Storage runtime доказателство

Трябва да се докаже практически:

- Tenant A upload в A -> PASS
- Tenant A upload/delete/update в B -> FAIL с 401/403

Статус: **Остава**

### 3) Admin boundary runtime proof

Трябва да се докаже:

- tenant admin -> `/super-admin/`* -> deny
- tenant admin -> super-admin API -> deny

Статус: **Остава**

### 4) Public host/slug mismatch runtime proof

Трябва да се докаже с реални заявки:

- host A + slug B -> reject
- routes:
  - `/api/services`
  - `/api/availability`
  - `/api/bookings`
  - `/api/clients/lookup`

Статус: **Остава**

### 5) Export/report leakage runtime proof

Трябва да се провери:

- export на Tenant A да не връща данни на Tenant B
- report/filter заявки да не leak-ват чужди редове

Статус: **Остава**

### 6) Access control / auth одит

Ако още не е затворен докрай, това стои като отделен одитен блок:

- auth
- authorization
- roles
- sessions
- cookies
- CSRF
- impersonation safety
- specialist/owner/admin граници

Статус: **Вероятно остава**

### 7) Finance / billing / admin integrity одит

Ако още не е завършен отделно, това също остава:

- billing state transitions
- webhook/cron/manual action consistency
- wrong activation/deactivation
- duplicate processing
- finance/report integrity
- auditability на критични действия

Статус: **Вероятно остава**

### 8) Cleanup на remaining raw platform modules

Не е първи blocker, но остава:

- `lib/get-tenant.ts`
- `lib/owner-recovery-link.ts`
- `confirm/cancel` token routes
- `track`, `leads`, `consultation`
- някои super-admin/raw platform модули

Статус: **Остава, но не е първи приоритет**

---

## BLOCKER ПРЕДИ ПЛАТЕНИ КЛИЕНТИ

### Критични blockers

- integration suite-овете да минат реално
- storage A->B runtime isolation да е PASS
- admin boundary runtime да е PASS
- host/slug mismatch runtime да е PASS
- export/report leakage да е PASS

### Силно препоръчителни blockers

- access control/auth пасът да е затворен
- finance/admin integrity пасът да е затворен
- яснота за audit log на критичните admin действия

---

## НЕ Е BLOCKER ВЕЧЕ

- RLS policy state
- `user_metadata` fallback
- tenant-scoped raw service-role в основния tenant код
- старият public trust модел към `salon_slug` (ако фиксовете са deploy-нати)

---

## ПРИОРИТЕТЕН РЕД ОТТУК НАТАТЪК

### Първо

- настройваш secrets
- създаваш test tenants
- пускаш `test:integration`

### Второ

- гледаш резултатите от 4-те integration suite-а
- оправяш само при реален fail

### Трето

- затваряш access control/auth паса, ако още не е направен
- затваряш billing/admin integrity паса, ако още не е направен

### Четвърто

- cleanup на останалите raw platform модули

---

## Най-кратката управленска версия

### Готово

- архитектурното затягане
- tenant isolation на code и DB ниво
- CI guardrails
- production SQL verification

### Остава

- runtime доказателство
- auth/permission финален преглед
- finance/admin integrity финален преглед
- cleanup на platform raw modules

### Истинският launch checkpoint

**Когато integration suite-овете минат реално и няма cross-tenant пробиви в runtime.**