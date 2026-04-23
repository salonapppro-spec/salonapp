# Stripe Lifecycle Checklist (Stage 5)

Този checklist е за ръчна валидация на webhook lifecycle-а след hardening-а:
- `stripe_subscription_id` се ползва/записва
- `stripe_customer_id` е primary identity
- owner email fallback е контролиран от `STRIPE_ALLOW_OWNER_EMAIL_FALLBACK`

## Предусловия

- `STRIPE_SECRET_KEY` и `STRIPE_WEBHOOK_SECRET` са зададени.
- Stripe webhook endpoint сочи към production URL:
  - `/api/webhooks/stripe`
- В Sentry има работещ ingest (за error visibility).
- В DB има тестов tenant с валиден owner email.

## 1) Duplicate event (idempotency)

Цел: същият `event.id` да не се обработва 2 пъти.

- От Stripe Dashboard/CLI replay-ни един и същ webhook два пъти.
- Очакване:
  - първият call → `received: true`, tenant update се прилага
  - вторият call → `received: true`, но без вторичен update
  - в логовете има `"Duplicate event ... — пропускам"`
  - в `stripe_events` има само един запис за `stripe_event_id`

## 2) Processing error + retry

Цел: при временна грешка webhook-ът да върне 500 и retry да успее.

- Инжектирай временна грешка (напр. кратък DB outage или умишлена грешка в тестова среда).
- Очакване:
  - webhook връща `500` и `"Processing error"`
  - записът за `stripe_event_id` се изчиства (за да може reclaim на retry)
  - след retry от Stripe event-ът се обработва успешно
  - няма перманентно „заключен“ event

## 3) subscription deleted

Цел: `customer.subscription.deleted` да resolve-не tenant-а по `subscription_id/customer_id`.

- Тригърни `customer.subscription.deleted` за тестов абонамент.
- Очакване:
  - webhook обработва събитието без грешка
  - има лог за прекратен абонамент (grace info)
  - не се активира/деактивира некоректен tenant
  - ако няма id match и fallback е изключен, няма грешно съпоставяне по email

## 4) failed invoice

Цел: `invoice.payment_failed` да влиза в лог и да не чупи потока.

- Тригърни `invoice.payment_failed` за тестов customer.
- Очакване:
  - webhook връща `200 received: true`
  - има warning лог за неуспешно плащане
  - няма неочаквана промяна на tenant status

## 5) Feature flag: owner email fallback OFF

Цел: verify, че lookup работи само по Stripe IDs.

- Задай `STRIPE_ALLOW_OWNER_EMAIL_FALLBACK=false`.
- Пусни webhook с липсващ customer/subscription match, но със съвпадащ owner email.
- Очакване:
  - tenant НЕ се намира по email
  - има structured log: `stripe_lookup_owner_email_fallback_disabled`
  - няма грешна активация на друг tenant

## 6) Feature flag: owner email fallback ON (migration mode)

Цел: временна съвместимост за legacy записи.

- Задай `STRIPE_ALLOW_OWNER_EMAIL_FALLBACK=true`.
- Пусни webhook без id match, но със съвпадащ owner email.
- Очакване:
  - tenant се намира
  - има warning/audit лог за fallback usage
  - след успешна обработка се записват наличните Stripe IDs

## Acceptance (Stage 5 ready)

- Всички 6 секции са PASS в staging.
- Няма неконтролирани 500 в webhook logs.
- Няма грешно tenant съпоставяне при OFF fallback режим.
- Runbook е изпълним от втори човек без допълнителен контекст.
