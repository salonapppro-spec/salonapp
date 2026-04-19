# SalonApp.pro — план за изпълнение (ред на работа)

Цел: **основа (сигурност + данни)** → **операции в админа** → **маркетинг и фуния** → **интеграции**. По-долу е **актуалното състояние** и **какво следва логично**.

---

## Текущо състояние (ревизия)

| Област | Статус | Бележки |
|--------|--------|---------|
| **Оперативен админ MVP („фаза 3“)** | Готово | Табло, календар, работно време, блокирани часове, финанси, клиенти, услуги/галерия/настройки, статус на резервация |
| **Фаза A — тенант и API** | Основно готово | Админ: `salon_slug` от JWT/сесия, не от header/body. Публични API: активен tenant. Премахнат е доверието към `x-salon-slug` за админ. |
| **Фаза B — график и блокове** | Готово | API + данни + връзка с scheduling/bookings |
| **Фаза C — UI време/календар** | Готово | Страница работно време, блокове в календара |
| **Фаза D — финанси от админа** | Готово | PATCH financial-settings, форма на финанси |
| **Маркетинг landing + фуния** | Готово | `app/page.tsx` — планове, CTA, секция „как работи“. `/get-started` — избор на план + форма. `POST /api/leads` + миграция `platform_leads`. Опционално: Stripe Payment Links през env. |
| **Фаза A3** | Частично | Dev fallback през `DEV_SALON_SLUG` — преглед дали `NEXT_PUBLIC_DEV_SALON_SLUG` не се ползва в prod пътища |
| **Фаза E — клиенти/галерия дълбочина** | Не е затворено | Детайл клиент; Storage upload за галерия |
| **Фаза F — полир публично** | Частично | Rate limit на bookings; липсват hCaptcha, Resend имейли |
| **Фаза G — монетизация** | Частично | Env за Stripe; липсва автоматичен onboarding след плащане |

---

## Логичен ред „напред“ (за краен продукт)

1. **База за лийдове в прод** — приложена миграция `0003_platform_leads.sql`, зададен `SUPABASE_SERVICE_ROLE_KEY`, тест на `/get-started` и запис в таблицата.
2. **Stripe** — Payment Links в env **или** Checkout Session от сървър след заявка; webhook „платено“ → provisioning (tenant + Auth metadata).
3. **Фаза F** — имейли (Resend): потвърждение заявка, напомняния за резервация; по желание hCaptcha на `POST /api/bookings` и `/api/leads`.
4. **Фаза E** — `/admin/clients/[id]`, галерия с качване в Storage.
5. **Мащаб** — Redis/Upstash за rate limit; **RLS** в Supabase за чувствителни таблици при анонимен достъп.

---

## Фаза A — Тенант и API (блокер за продукция)

| Стъпка | Какво | Критерий „готово“ |
|--------|--------|---------------------|
| A1 | Един източник на `salon_slug` за админ: **Supabase JWT** (`user_metadata` / `app_metadata`); middleware `x-salon-slug` само за **публичен** routing по домейн | Няма админ път, който доверява само на client body/header за tenant |
| A2 | Admin API: записите ползват резолвнат slug от сесията; тялото не е източник на истина | Преглед на `app/api/admin/**` |
| A3 | Dev bypass само в development (`DEV_SALON_SLUG`), не в production | Prod без скрит dev slug за админ |

---

## Фаза B — Работно време и блокирани часове

Завършена според първоначалния план (данни + API + съгласуваност с bookings).

---

## Фаза C — Админ UI: календар + настройки време

Завършена (работно време + блокирани интервали в календара).

---

## Фаза D — Финанси и настройки от админа

Завършена (PATCH financial-settings, форми).

---

## Фаза E — Клиенти и галерия (следваща дълбочина)

| Стъпка | Какво | Критерий |
|--------|--------|----------|
| E1 | `/admin/clients/[id]` + история от bookings | Търсенето остава |
| E2 | Галерия: Supabase Storage + запис в `gallery` | Не само URL |

---

## Фаза F — Публичен сайт и букинг (полир)

| Стъпка | Какво | Статус |
|--------|--------|--------|
| F1 | Маркетинг начална страница SalonApp.pro | **Готово** (`app/page.tsx`) |
| F2 | hCaptcha / rate limit | Rate limit на bookings **да**; hCaptcha — не |
| F3 | Имейли (Resend) + `email_logs` | Не |

---

## Фаза G — Монетизация и платформа

- Stripe абонамент / плащане по план — env и Payment Links опционално на landing.
- **Provisioning след плащане** — следваща имплементация (webhook → tenant + `salon_slug` в Auth).
- Super-admin конзола — по решение на продукта.

---

## Маркетинг и фуния (нова секция)

| Елемент | Път / файл |
|--------|------------|
| Landing (герой, продукт, как работи, цени, CTA) | `app/page.tsx`, `components/marketing/LandingPage.tsx` |
| Данни за планове (имена, EUR ориентир, bullet-и) | `lib/marketing-data.ts` |
| Фуния: избор на план + форма | `app/get-started/page.tsx`, `components/marketing/GetStartedForm.tsx` |
| Запис на заявка | `POST /api/leads`, таблица `platform_leads` (`supabase/migrations/0003_platform_leads.sql`) |
| Stripe „Плати онлайн“ (ако има линкове) | `NEXT_PUBLIC_STRIPE_PAYMENT_LINK_*` в `.env.example`, `lib/marketing-checkout.ts` |

---

## Ред на приоритет (обобщено)

1. ~~A (ядро)~~ → 2. ~~B → C → D~~ → 3. **Миграция лийдове + Stripe webhook / provisioning** → 4. **F имейли + hCaptcha** → 5. **E дълбочина** → 6. **G пълна монетизация**

---

## Правила при имплементация

- Всяка нова API: Zod + service role + филтър по `salon_slug` (където е tenant API).
- Миграции само в `supabase/migrations/`; без breaking промени без версия.
- След значими промени: `npm run lint` и `npm run build`.
