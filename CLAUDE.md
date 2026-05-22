# SalonApp.pro — Правила за Claude Code

> Четат се от Claude Code автоматично при стартиране на сесия.
> Актуализира се при всеки handoff.

---

## Правило 1: Git workflow (КРИТИЧНО — двама работят по проекта)

```bash
# Преди да започнеш работа — ЗАДЪЛЖИТЕЛНО:
git pull --rebase origin main

# Работи на отделен branch:
git checkout -b feature/[кратко-описание]

# След приключване:
git add [конкретни файлове]
git commit -m "feat/fix: кратко описание на промяната"
git push origin feature/[кратко-описание]

# НИКОГА:
# git push origin main без pull първо
# git add . (може да включи .env и secrets)
```

---

## Правило 2: Преди всяка промяна

1. Прочети `HANDOFF.md` — какво е последното известно състояние
2. Прочети `TODO.md` — какво е следващата задача
3. Провери: `git log --oneline -5` — последните commits
4. Провери: `npx tsc --noEmit` — няма ли TypeScript грешки

---

## Правило 3: След всяка промяна

1. Актуализирай `HANDOFF.md` — секция "Какво направих"
2. Маркирай завършени задачи в `TODO.md`
3. `git add [файлове] && git commit -m "..." && git push`

---

## Правило 4: Начин на работа

- **Пълен код**, не patch-ове или diff-ове
- **Номерирани стъпки** с точни команди
- **Без абстрактни обяснения** — конкретен файл, конкретен ред
- Ако не си сигурна какво прави даден файл — **прочети го първо**

---

## Tech Stack

| | |
|---|---|
| **Framework** | Next.js 15, App Router (НЕ Pages Router) |
| **Styling** | Tailwind CSS (НЕ отделни .css файлове) |
| **База данни** | Supabase (PostgreSQL + RLS) |
| **Auth** | Supabase Auth |
| **Имейли** | Resend API |
| **Плащания** | Stripe (Payment Links + Webhooks) |
| **Хостинг** | Vercel |
| **Езици** | TypeScript навсякъде, без `any` ако може |

---

## Структура на проекта

```
app/
├── (public)/[salon_slug]/     # Публичен сайт — ЧЕТАТ го клиенти
├── admin/(protected)/         # Салонски админ — ЧЕТАТ го собственици
├── super-admin/               # Супер-админ — само Лина
└── api/                       # API routes + webhooks

middleware.ts                  # Auth + tenant routing — ДЕЛИКАТЕН файл
schemas/                       # Zod валидация
lib/                           # Utilities (supabase, rate-limit, etc.)
templates/                     # 6 шаблона за публичния сайт
types/                         # TypeScript типове
```

---

## Важни файлове

| Файл | Роля |
|------|------|
| `middleware.ts` | Routing по домейн/subdomain/path — засяга всички салони |
| `lib/supabase-admin.ts` | Service Role client — заобикаля RLS, само в server |
| `lib/admin-tenant.ts` | Cookie за super-admin impersonation |
| `schemas/settings.ts` | Zod schema за настройките на салона |
| `schemas/tenant.ts` | Zod schema за създаване на тенант |
| `app/super-admin/actions.ts` | Server actions за супер-админа |
| `app/api/webhooks/stripe/route.ts` | Stripe webhook handler |

---

## Правила за базата данни

- `createSupabaseServiceRoleClient()` — само в **server actions** и **API routes**
- `createSupabaseServerClient()` — за auth-базирани server компоненти
- Никога service role key в **client компоненти** (`"use client"`)
- RLS политиките са по `salon_slug` — всеки тенант вижда само своите данни
- `primary_color` се управлява **само** от салонския админ
- `plan`, `template`, `status` се управляват **само** от супер-админа
- Tenant queries през service-role минават само през tenant layer (`tenantDb(slug)`)
- `createSupabaseServiceRoleClient()` е забранен извън `lib/tenant-db.ts`, `lib/supabase-admin.ts`, `lib/internal/**` (CI enforce)
- NO ESCAPE: tenant slug е задължителен и валиден; без fallback/undefined/празна стойност

---

## Routing логика

```
salon-bizhu.salonapp.pro        → subdomain routing (production)
salonapp-ten.vercel.app/salon-bizhu → path routing (preview/dev)
localhost/salon-bizhu           → path routing (local dev)
salon-bizhu.bizhu.bg            → custom domain (middleware byDomain)
```

---

## ENV Variables (нужни за пълна функционалност)

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=https://salonapp.pro
RESEND_API_KEY=
RESEND_FROM=SalonApp <no-reply@salonapp.pro>
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PAYMENT_LINK_STANDARD=
NEXT_PUBLIC_STRIPE_PAYMENT_LINK_PRO=
NEXT_PUBLIC_STRIPE_PAYMENT_LINK_PREMIUM=
NEXT_PUBLIC_STRIPE_PAYMENT_LINK_COLLECTIVE=
```

---

## Правило 6: НИКОГА повече шаблони (templates) — ВСЕКИ салон получава уникален сайт

- **НЕ** предлагай template-и (Bloom, Zen, Luxe, Bold, Clean, Groom и т.н.) за нови салони
- **НЕ** споменавай `components/templates/` при работа по публичен сайт на салон
- Всеки нов салон → уникален компонент в `components/tenants/[salon-name]/` или `components/tenants/[SalonName]Site.tsx`
- Примери за правилния подход: `TheBeastSite.tsx`, `euphoria/Page.tsx`, `PawEmpireSite.tsx`
- Ако видиш `template: "bloom"` в базата — игнорирай го, той е legacy поле

---

## Не пипай без да разбереш

- `middleware.ts` — логиката засяга всички тенанти едновременно
- `SUPER_ADMIN_SALON_COOKIE` — механизмът за impersonation
- Supabase RLS policies — промяна може да expose данни между тенанти
- `revalidatePath` в server actions — ако го махнеш, сайтът показва стар кеш

---

## Правило 5: Google Calendar — НИКОГА без изрично разрешение от Лина

- **НЕ** commit-вай, **НЕ** променяй и **НЕ** докосвай Google Calendar файловете освен ако Лина изрично не каже "пипни Google Calendar".
- Засегнати файлове: `lib/google-calendar.ts`, `lib/google-calendar-sync.ts`, `app/api/admin/integrations/google/**`, `app/api/cron/google-watch-renew/**`, `components/admin/GoogleCalendarIntegrationCard.tsx`
