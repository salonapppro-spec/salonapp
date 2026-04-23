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