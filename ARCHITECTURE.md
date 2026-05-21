# SalonApp.pro — Архитектура и Концепция

> Документ за предаване на нови AI агенти и разработчици.
> Последна актуализация: 2026-05-21

---

## 1. Какво е SalonApp.pro

**SalonApp.pro** е мулти-тенант SaaS платформа за управление на салони за красота и бръснарници в България. Всеки салон (тенант) получава:

- Публичен уеб сайт с онлайн резервации
- Административен панел за управление на бизнеса
- Имейл потвърждения и 24ч напомняния към клиентите
- Клиентска база данни
- Финансов модул (приходи, разходи, ABC анализ)
- Опционална Google Calendar двупосочна синхронизация

Платформата е **white-label** — всеки тенант изглежда като напълно самостоятелен сайт. Крайният клиент не вижда SalonApp; вижда само сайта на своя салон.

---

## 2. Бизнес Модел

```
Лина (основател/super-admin)
  └─► създава тенант в /super-admin
  └─► системата изпраща welcome имейл към собственика
  └─► собственикът задава парола → влиза в /admin

Собственик на салон (/admin)
  └─► управлява услуги, специалисти, работно време
  └─► вижда резервациите, клиентите, финансите

Краен клиент (публичен сайт /{salon_slug})
  └─► разглежда сайта на салона
  └─► прави резервация онлайн
  └─► получава имейл потвърждение + линк за анулиране
```

### Абонаментни планове

| ID | Наименование | Цена/месец | Ключова разлика |
|----|-------------|-----------|-----------------|
| `starter` | Стартер | 15 € | 1 специалист, субдомейн |
| `standard` | Стандарт | 19 € | Паралелни услуги, разширени отчети |
| `pro` | Про | 29 € | Собствен домейн (годишно), SMS/Viber |
| `premium` | Премиум | 49 € | Неограничено специалисти |

**Активиране:** автоматично чрез Stripe webhook при успешно плащане, или ръчно от super-admin (банков превод).

### Статуси на тенант

| Статус | Значение |
|--------|----------|
| `trial` | Пробен период — пълен достъп, без плащане |
| `active` | Платен и активен |
| `inactive` | Изтекъл или деактивиран — публичният сайт показва "Временно недостъпно" |

---

## 3. Tech Stack

| Слой | Технология | Забележка |
|------|-----------|-----------|
| Framework | Next.js 15, App Router | НЕ Pages Router |
| Език | TypeScript (strict) | Без `any` където е възможно |
| Стилове | Tailwind CSS + inline `<style>` тагове | Тенант сайтовете ползват CSS vars |
| База данни | Supabase (PostgreSQL 17) | EU регион (eu-west-1) |
| Auth | Supabase Auth | Email/password + passwordless |
| Storage | Supabase Storage | Галерия изображения, аватари |
| Имейли | Resend API | Транзакционни имейли |
| Плащания | Stripe | Payment Links + Webhooks |
| Хостинг | Vercel | Auto-deploy от main branch |
| Мониторинг | Sentry | Клиентски и сървърни грешки |

---

## 4. Мулти-тенант Архитектура

### Ключов принцип

**`salon_slug`** е primary идентификаторът на всеки тенант. Примери: `paw-empire`, `thebeast`, `euphoria`. Всяка таблица в базата е обвързана с него чрез foreign key с `ON UPDATE CASCADE ON DELETE CASCADE`.

### Routing (`middleware.ts` — критичен файл)

Middleware-ът извлича `salon_slug` от URL-а и го поставя в `x-salon-slug` header преди рендера:

```
salon-bizhu.salonapp.pro          →  subdomain routing       (production)
salonapp-ten.vercel.app/salon-bizhu → path routing            (Vercel preview)
localhost:3000/salon-bizhu         →  path routing            (локална разработка)
bizhu.bg                          →  custom domain lookup     (byDomain в DB)
```

> ⚠️ `middleware.ts` засяга всички тенанти едновременно. Всяка промяна трябва да се тества внимателно.

### Три типа потребители и техните зони

| Роля | URL | Auth метод |
|------|-----|-----------|
| **Краен клиент** | `/{salon_slug}` | Без auth (публично) |
| **Собственик на салон** | `/admin` | Supabase Auth + RLS по `salon_slug` |
| **Super-Admin (Лина)** | `/super-admin` | Supabase Auth + `app_metadata.role = "super_admin"` |

---

## 5. База Данни — Основни Таблици

### `tenants` — Сърцето на системата (един ред = един салон)

```
salon_slug          TEXT PRIMARY KEY        -- "paw-empire", "euphoria" ...
salon_name          TEXT                    -- "Paw Empire Studio"
owner_email         TEXT
owner_phone         TEXT
status              TEXT                    -- trial / active / inactive
plan                TEXT                    -- starter / standard / pro / premium
start_date          DATE
expiry_date         DATE                    -- край на платения период
grace_until_date    DATE                    -- гратисен срок след expiry
archived_at         TIMESTAMPTZ             -- soft delete
primary_color       TEXT                    -- hex (#74022f)
background_color    TEXT
font                TEXT
design_tokens       JSONB                   -- разширени CSS настройки
logo_url            TEXT
hero_title          TEXT
hero_subtitle       TEXT
hero_image_url      TEXT
about_text1         TEXT
about_text2         TEXT
about_image_url     TEXT
phone               TEXT                    -- публичен телефон на салона
email               TEXT                    -- публичен имейл на салона
address             TEXT
instagram_url       TEXT
facebook_url        TEXT
tiktok_url          TEXT
google_maps_embed   TEXT                    -- embed URL за iframe
facebook_pixel_id   TEXT
gtm_id              TEXT
clarity_id          TEXT
stripe_customer_id  TEXT
stripe_subscription_id TEXT
domain              TEXT                    -- custom domain
```

### `specialists` — Специалисти към тенант

```
id               UUID PRIMARY KEY
salon_slug       TEXT FK → tenants (CASCADE)
name             TEXT
role             TEXT                       -- "Фризьор", "Козметолог" ...
bio              TEXT
avatar_url       TEXT
is_active        BOOLEAN
```

### `services` — Услуги

```
id                  UUID PRIMARY KEY
salon_slug          TEXT FK → tenants (CASCADE)
specialist_id       UUID FK → specialists
name                TEXT
price_eur           NUMERIC
duration_minutes    INTEGER                 -- NULL ако is_complex = true
is_complex          BOOLEAN                 -- сложна услуга с фази
-- Сложна услуга: 3 фази × min/max минути
active_start_min    INTEGER
active_start_max    INTEGER
waiting_min         INTEGER
waiting_max         INTEGER
active_finish_min   INTEGER
active_finish_max   INTEGER
is_active           BOOLEAN
```

> **Сложна услуга:** Продължителността зависи от дължина и гъстота на косата. Системата изчислява трите фази чрез интерполационна матрица 3×3 (short/medium/long × thin/medium/thick).

### `bookings` — Резервации

```
id                   UUID PRIMARY KEY
salon_slug           TEXT FK → tenants (CASCADE)
specialist_id        UUID FK → specialists
service_id           UUID FK → services
-- Данни на услугата (snapshot при запис — не се обновяват след промяна на услугата)
service_name         TEXT
service_price_eur    NUMERIC
service_duration     INTEGER
-- Клиент
client_name          TEXT
client_phone         TEXT
client_email         TEXT
email_opt_out        BOOLEAN
-- Час
booking_date         DATE
start_time           TIME
end_time             TIME
-- Статус
status               TEXT    -- pending / confirmed / completed / cancelled / no_show
-- Токени за имейл действия
confirmation_token   TEXT
cancellation_token   TEXT
-- Сложна услуга параметри
hair_length          TEXT    -- short / medium / long
hair_density         TEXT    -- thin / medium / thick
-- Google Calendar
google_event_id      TEXT
google_sync_status   TEXT    -- pending / synced / failed / skipped
```

### `working_hours` — Работно време

```
id           UUID
salon_slug   TEXT FK → tenants (CASCADE)
day_of_week  INTEGER   -- 0 = Неделя, 1 = Понеделник ... 6 = Събота
start_time   TIME
end_time     TIME
is_day_off   BOOLEAN
```

### `clients` — Клиентска база

```
id               UUID PRIMARY KEY
salon_slug       TEXT FK → tenants (CASCADE)
name             TEXT
phone            TEXT
email            TEXT
total_bookings   INTEGER
last_booking_at  TIMESTAMPTZ
```

### `gallery` — Галерия снимки

```
id           UUID PRIMARY KEY
salon_slug   TEXT FK → tenants (CASCADE)
url          TEXT                  -- Supabase Storage URL
order_index  INTEGER
is_visible   BOOLEAN
```

### `blocked_slots` — Блокирани часове

```
salon_slug      TEXT FK → tenants (CASCADE)
specialist_id   UUID FK → specialists
blocked_date    DATE
start_time      TIME
end_time        TIME
```

### Допълнителни таблици

| Таблица | Съдържание |
|---------|-----------|
| `tenant_activity_logs` | Timeline на действия за super-admin |
| `tenant_call_tasks` | Задачи за обаждане (вграден CRM) |
| `tenant_google_integrations` | Google Calendar OAuth tokens + watch channels |
| `expenses` | Разходи за финансовия модул |
| `financial_settings` | Фиксирани разходи, целева печалба |
| `email_logs` | Лог на изпратени имейли |
| `leads` | Заявки от landing page |
| `gdpr_export_tokens` | Токени за GDPR data export заявки |

---

## 6. Security — Row Level Security (RLS)

- Всеки собственик вижда **само своите данни** — RLS политиките филтрират по `salon_slug` спрямо `auth.jwt() → app_metadata.salon_slug`
- **`createSupabaseServiceRoleClient()`** заобикаля RLS — използва се САМО в server actions и API routes (никога в `"use client"` компоненти)
- **`createSupabaseServerClient()`** — за auth-базирани server компоненти (спазва RLS)
- Публичните данни се четат чрез RPC функция `get_public_salon_data(slug)` без auth
- Super-Admin достъпва данните чрез service role key

---

## 7. Файлова Структура

```
app/
├── (public)/[salon_slug]/
│   └── page.tsx                    # Публичен сайт — TENANT_SITES registry
├── admin/
│   ├── login/                      # Вход за собственици
│   ├── reset-password/             # Задаване на парола (welcome flow)
│   └── (protected)/
│       ├── dashboard/              # Статистики, предстоящи резервации
│       ├── calendar/               # Седмичен изглед
│       ├── clients/                # Клиентска база
│       ├── services/               # CRUD услуги + специалисти
│       ├── gallery/                # Drag & drop upload + наредба
│       ├── working-hours/          # Работно време по дни
│       └── settings/               # Настройки (цвят, лого, hero, about, соц. мрежи)
├── super-admin/
│   ├── page.tsx                    # Списък всички тенанти с филтри
│   ├── [salon_slug]/page.tsx       # Детайл — stats, slug, Stripe линк, timeline
│   ├── new/                        # Създай нов тенант
│   └── leads/                      # Заявки от landing page
└── api/
    ├── bookings/route.ts           # POST нова резервация (публичен)
    ├── availability/route.ts       # GET свободни часове (публичен)
    ├── confirm/[token]/            # Потвърждение на резервация по имейл
    ├── cancel/[token]/             # Анулиране по имейл
    ├── admin/
    │   ├── bookings/[id]/          # PATCH/DELETE резервация
    │   ├── services/               # CRUD услуги
    │   ├── specialists/            # CRUD специалисти
    │   ├── gallery/                # Upload, reorder, delete, visibility
    │   ├── slots/                  # Генерира слотове за деня (admin calendar)
    │   ├── clients/                # Клиенти + CSV export + lookup
    │   ├── expenses/               # Разходи
    │   ├── working-hours/          # Работно време
    │   └── integrations/google/    # Google Calendar OAuth flow + webhook
    ├── cron/
    │   ├── reminders/              # Изпраща напомняния 24ч преди резервацията
    │   ├── billing-expiry/         # Деактивира тенанти с просрочен grace период
    │   └── google-watch-renew/     # Подновява Google push notification channels
    ├── webhooks/stripe/            # Обработва Stripe плащания → активира тенанта
    ├── leads/                      # POST заявка от landing page
    └── gdpr/                       # Data export и delete request

components/
├── tenants/                        # Per-tenant публични сайтове
│   ├── paw-empire/Page.tsx         # Уникален дизайн за Paw Empire
│   ├── TheBeastSite.tsx            # Vintage barbershop дизайн
│   ├── euphoria/Page.tsx           # Standalone (Bloom-базиран дизайн)
│   ├── lindy/Page.tsx              # Coming Soon страница
│   └── theskin/Page.tsx            # TheSkin дизайн
├── templates/
│   ├── Bloom.tsx                   # Базов шаблон (reference, не се ползва като fallback)
│   ├── TheSkin.tsx                 # TheSkin шаблон
│   ├── BookingCalendar.tsx         # Резервационна форма (вградена в сайтовете)
│   └── salon-shared.ts             # Споделени helpers (activeSpecialists, servicesFlatForPublic ...)
├── booking/BookingFlow.tsx         # Multi-step резервационен flow (клиентска страна)
└── admin/                          # Admin UI компоненти

lib/
├── supabase-admin.ts               # Service Role client — заобикаля RLS
├── supabase-server.ts              # Server client — спазва RLS
├── supabase.ts                     # Browser client
├── tenant-db.ts                    # Всички DB операции за тенанти
├── booking-mutations.ts            # Създаване/промяна/анулиране на резервации
├── scheduling.ts                   # Генерира свободни слотове + сложни услуги
├── design-tokens.ts                # Парсва JSONB design_tokens → CSS vars
├── admin-tenant.ts                 # Cookie за super-admin impersonation
├── rate-limit.ts                   # Rate limiting
├── safe-public-urls.ts             # Валидира Instagram/Facebook/TikTok/Maps URL-и
├── google-calendar.ts              # Google Calendar OAuth helpers
├── google-calendar-sync.ts         # Двупосочна синхронизация с Google
└── owner-recovery-link.ts          # Генерира welcome/recovery линк за нов собственик

middleware.ts                       # Auth + tenant routing — КРИТИЧЕН ФАЙЛ
schemas/                            # Zod валидация (booking, settings, tenant, design-tokens ...)
types/                              # TypeScript типове (SalonData, Tenant, Service, Booking ...)
supabase/migrations/               # 29+ SQL миграции (001_initial_schema → 029_fix_rls ...)
```

---

## 8. Per-Tenant Сайтове — Как Работи

```typescript
// app/(public)/[salon_slug]/page.tsx

const TENANT_SITES: Record<string, ComponentType<{ data: SalonData }>> = {
  "paw-empire": PawEmpire,
  "thebeast":   TheBeastSite,
  "euphoria":   EuphoriaSite,
  "lindy":      LindySite,
  "theskin":    TheSkinSite,
};

function renderSite(slug: string, data: SalonData) {
  const Site = TENANT_SITES[slug];
  if (Site) return <Site data={data} />;
  return <UnderConstruction data={data} />; // "Сайтът е в изграждане"
}
```

**Принцип:** Всеки тенант получава ръчно изграден компонент от SalonApp екипа. Няма автоматичен шаблон — новите салони виждат "Сайтът е в изграждане" докато екипът не построи сайта им.

**CSS Variables:** Design tokens от `tenants.design_tokens` JSONB се конвертират в CSS variables и се инжектират в `<div id="salon-design-root" style={...}>`. Всеки тенант компонент ги ползва за цветове, шрифтове и закръгления.

```css
--color-primary    /* основен акцент цвят */
--color-bg         /* фон */
--color-text       /* текст */
--font-heading     /* заглавен шрифт */
--font-body        /* основен шрифт */
--border-radius    /* закръгления */
```

**Добавяне на нов тенант сайт:**
1. Създай `components/tenants/[slug]/Page.tsx`
2. Импортирай в `app/(public)/[salon_slug]/page.tsx`
3. Добави в `TENANT_SITES` обекта

---

## 9. Резервационен Flow

```
Клиент избира услуга (+ специалист ако има повече от един)
  ↓
GET /api/availability?salon_slug=&date=&specialist_id=
  ↓  scheduling.ts генерира свободни слотове:
  ↓  работно време - заети bookings - blocked_slots - Google FreeBusy
  ↓
Клиент избира час, попълва: name, phone, email
  ↓  (за сложни услуги: hair_length + hair_density)
  ↓
POST /api/bookings
  ↓  Rate limit: 40 req/min по IP
  ↓  Зарежда услугата server-side (не вярва на цена/продължителност от клиента)
  ↓  Валидира специалист принадлежност
  ↓  Двойна проверка за наличност (race condition protection)
  ↓  INSERT bookings с status = "pending"
  ↓  Изпраща confirmation + cancellation линк по имейл (Resend)
  ↓  Async sync към Google Calendar ако е свързан
  ↓
Клиент кликва "Потвърди" в имейла
  → GET /api/confirm/[token] → status = "confirmed"

Клиент кликва "Анулирай" в имейла
  → GET /api/cancel/[token] → status = "cancelled"
  → Изпраща cancellation имейл към собственика
```

---

## 10. Сложни Услуги (Complex Services)

Услуги като боядисване имат три фази:
- **active_start** — активна работа в началото (напр. нанасяне на боя)
- **waiting** — изчакване (боята действа)
- **active_finish** — активна работа в края (изплакване, сушене)

Продължителността варира по матрица 3×3:
- Дължина на косата: `short` / `medium` / `long`
- Гъстота: `thin` / `medium` / `thick`

По време на **waiting** фазата, специалистът може да приеме друг клиент — "магнитен график".

---

## 11. Google Calendar Синхронизация

- Собственикът свързва Google акаунт чрез OAuth2 flow (`/api/admin/integrations/google/start`)
- Tokens се пазят криптирани в `tenant_google_integrations`
- При нова резервация → async CREATE event в Google Calendar
- Google push notifications (watch channels) → webhook `POST /api/admin/integrations/google/webhook`
- При промяна/изтриване в Google → синхронизира обратно в booking системата
- Cron job подновява watch channels преди изтичане

---

## 12. Super-Admin Impersonation

```
Лина кликва "Влез в админа" за даден тенант
  ↓
Server Action: записва HttpOnly cookie
  super_admin_impersonate_salon = "salon-bizhu"
  ↓
Middleware чете cookie → override на tenant context
  ↓
/admin показва данните на избрания салон
  ↓
Бутон "Излез" → изтрива cookie → redirect към /super-admin
```

---

## 13. Cron Jobs

Всички cron routes изискват `Authorization: Bearer <CRON_SECRET>` header.

| Endpoint | Честота | Функция |
|----------|---------|---------|
| `/api/cron/reminders` | Всеки час | Изпраща имейл напомняния 24ч преди резервация |
| `/api/cron/billing-expiry` | Веднъж дневно | Деактивира тенанти с просрочен `grace_until_date` |
| `/api/cron/google-watch-renew` | Веднъж дневно | Подновява Google push notification channels |

---

## 14. ENV Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # ← САМО server-side, НИКОГА в client компоненти

# App
NEXT_PUBLIC_APP_URL=https://salonapp.pro

# Имейли
RESEND_API_KEY=
RESEND_FROM=SalonApp <no-reply@salonapp.pro>

# Плащания
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PAYMENT_LINK_STARTER=
NEXT_PUBLIC_STRIPE_PAYMENT_LINK_STANDARD=
NEXT_PUBLIC_STRIPE_PAYMENT_LINK_PRO=
NEXT_PUBLIC_STRIPE_PAYMENT_LINK_PREMIUM=

# Планове (опционално — по подразбиране: 15/19/29/49)
NEXT_PUBLIC_PLAN_PRICE_STARTER=
NEXT_PUBLIC_PLAN_PRICE_STANDARD=
NEXT_PUBLIC_PLAN_PRICE_PRO=
NEXT_PUBLIC_PLAN_PRICE_PREMIUM=
NEXT_PUBLIC_PLAN_PRICE_CURRENCY=€

# Cron защита
CRON_SECRET=

# Google Calendar (опционално)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

---

## 15. Правила за Нов Разработчик

### Критични забрани
- **`middleware.ts`** — не пипай без да разбереш цялата routing логика
- **`createSupabaseServiceRoleClient()`** — само в server actions/API routes, **никога** в `"use client"` компоненти
- **`next/image`** — не използвай с Supabase Storage URLs (hostname не е конфигуриран в `next.config.mjs`); използвай `<img loading="lazy">`
- **`git add .`** — никога; може да включи `.env` и secrets
- **Google Calendar файловете** — не пипай без изрично разрешение от Лина

### Git workflow
```bash
git pull --rebase origin main        # ЗАДЪЛЖИТЕЛНО преди работа
git checkout -b feature/описание     # Работи на отделен branch
git add [конкретни файлове]
git commit -m "feat/fix: описание"
git push origin feature/описание     # После merge към main
```

### Преди всяка промяна
1. Прочети `HANDOFF.md` — последното известно състояние
2. Провери `git log --oneline -5`
3. Провери `npx tsc --noEmit` — без TypeScript грешки

### След всяка промяна
1. Актуализирай `HANDOFF.md`
2. `npx tsc --noEmit` — трябва да минава чисто
3. Commit + push → Vercel деплойва автоматично

---

## 16. Текущи Тенанти (към 2026-05-21)

| slug | Сайт | Компонент |
|------|------|-----------|
| `paw-empire` | Paw Empire Studio | `PawEmpire` — уникален дизайн |
| `thebeast` | The Beast Barbershop | `TheBeastSite` — vintage barbershop |
| `euphoria` | Euphoria | `EuphoriaSite` — standalone Bloom дизайн |
| `lindy` → `lindynails` | Lindy Nails | `LindySite` — Coming Soon страница |
| `theskin` | The Skin | `TheSkinSite` — TheSkin шаблон |
| *(нов slug)* | *(всеки нов)* | `UnderConstruction` — "Сайтът е в изграждане" |
