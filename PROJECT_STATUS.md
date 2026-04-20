# SalonApp — Статус на проекта

> Последна актуализация: 2026-04-20

---

## Какво е изградено ✅

### 1. Архитектура и инфраструктура

| Компонент | Детайли |
|-----------|---------|
| **Framework** | Next.js 15 App Router, TypeScript |
| **База данни** | Supabase (PostgreSQL + Row Level Security) |
| **Автентикация** | Supabase Auth (email/password + magic link) |
| **Хостинг** | Vercel — `salonapp-ten.vercel.app` |
| **Имейли** | Resend API (`no-reply@salonapp.pro`) |
| **Плащания** | Stripe (webhooks + Payment Links) |
| **Мулти-тенант** | Един проект, много салони — изолация по `salon_slug` |

---

### 2. Публичен сайт на салоните

- **6 шаблона**: `bloom`, `luxe`, `luxe2`, `bold`, `zen`, `groom`
- **Динамично съдържание**: заглавие, описание, галерия, услуги, контакти, соц. мрежи
- **Цвят на бранда**: `primary_color` — прилага се чрез inline styles в шаблоните
- **Inline форма за резервации** — вградена в всички 6 шаблона
- **Google Maps embed** — поддържа се в настройките
- **Страница за резервация** — `/[salon_slug]/booking` с избор на услуга, дата и час
- **"Временно недостъпен"** — при статус `inactive` редиректва към `/temporarily-unavailable`

**Routing:**
- `salon-bizhu.salonapp.pro` → поддомейн (работи след свързване на домейна)
- `salonapp-ten.vercel.app/salon-bizhu` → path-based (работи сега)
- `localhost/salon-bizhu` → dev среда
- Потребителски домейн (напр. `bizhu.bg`) → middleware разпознава по `custom_domain`

---

### 3. Административен панел на салона (`/admin`)

| Страница | Функционалност |
|----------|----------------|
| **Dashboard** | Обобщение — резервации, клиенти, предстоящи |
| **Резервации** | Списък, статуси, детайли |
| **Клиенти** | CRM — история, бележки |
| **Услуги** | CRUD — цена, продължителност, категория |
| **Работно време** | По дни от седмицата |
| **Галерия** | Upload снимки, drag-and-drop зона, toggle видимост |
| **Настройки** | Текстове, лого, соц. мрежи, **цветова палитра** (6 preset + custom) |

**Цветова палитра (settings):**
- 6 preset цвята: Роза, Злато, Лилаво, Тюркоаз, Бордо, Антрацит
- Custom color picker (hex)
- Записва се в `tenants.primary_color` и веднага се отразява на публичния сайт

---

### 4. Супер-админ панел (`/super-admin`)

| Страница | Функционалност |
|----------|----------------|
| **Табло** | Активни салони, MRR, нови тази седмица, просрочени |
| **Обаждания днес** | Автоматично показва салони на 15-и и 25-и ден от grace периода |
| **CTR Dashboard** | Фуния: посетители → CTA click → форма попълнена |
| **Всички тенанти** | Таблица с филтри (план, статус, търсене) |
| **Детайл на тенант** | Смяна на шаблон/план/статус, ръчно активиране, Stripe линк |
| **Заявки (Leads)** | Inbox от `platform_leads` таблицата |
| **Нов тенант** | Форма за създаване — slug, план, шаблон, имейл, телефон |

**Функции в детайл на тенант:**
- Смяна на шаблон → веднага се отразява на публичния сайт (cache revalidation)
- Stripe Payment Link с префилнат имейл → бутон + копирай
- Ръчно активиране (банков превод) — 1/3/6/12 месеца + изпраща имейл
- "Влез в админа" → влиза в акаунта на салона (httpOnly cookie)
- Цветът на сайта се вижда (read-only) — управлява се от самия салон
- Success banner след запазване

---

### 5. Stripe интеграция

- **Payment Links** — конфигурирани per план в `.env`:
  ```
  NEXT_PUBLIC_STRIPE_PAYMENT_LINK_STANDARD=https://buy.stripe.com/...
  NEXT_PUBLIC_STRIPE_PAYMENT_LINK_PRO=https://buy.stripe.com/...
  NEXT_PUBLIC_STRIPE_PAYMENT_LINK_PREMIUM=https://buy.stripe.com/...
  ```
- **Webhook** (`/api/webhooks/stripe`):
  - `checkout.session.completed` → активира при еднократно плащане
  - `invoice.paid` → активира/подновява при абонаментно плащане
  - `invoice.payment_failed` → логва, не деактивира (Stripe retry-ва)
  - `customer.subscription.deleted` → логва, grace периодът изтича естествено
  - При активация: удължава от текущия `expiry_date` + 30 дни grace + изпраща имейл

---

### 6. Имейл нотификации (Resend)

| Събитие | Получател |
|---------|-----------|
| Нов тенант създаден | Собственик — welcome + link за задаване на парола |
| Ръчно активиране (банков превод) | Собственик — потвърждение + дата на изтичане |
| Stripe плащане получено | Собственик — потвърждение + дата на изтичане |

---

### 7. Routing & Middleware

- Автентикация: `/admin/*` и `/super-admin/*` изискват вход
- Super admin: проверка на `app_metadata.role === "super_admin"`
- Rate limiting: 40 req/min за bookings, 15 req/min за leads
- Tenant resolution: по поддомейн, path segment или custom domain
- Vercel preview URLs: `salonapp-ten.vercel.app/salon-bizhu` работи

---

## Какво остава за работа 🔧

### 🔴 Критично (блокира production)

#### 1. Свързване на домейна `salonapp.pro` с Vercel
- Влез в **Vercel → salonapp-ten → Settings → Domains**
- Добави `salonapp.pro` и `*.salonapp.pro`
- В DNS регистратора добави:
  - `A` запис: `@` → `76.76.21.21`
  - `CNAME` запис: `*` → `cname.vercel-dns.com`
- След това `salon-bizhu.salonapp.pro` ще работи

#### 2. Stripe ENV в Vercel
- Влез в **Vercel → salonapp-ten → Settings → Environment Variables**
- Добави:
  ```
  STRIPE_SECRET_KEY=sk_live_...
  STRIPE_WEBHOOK_SECRET=whsec_...
  NEXT_PUBLIC_STRIPE_PAYMENT_LINK_STANDARD=https://buy.stripe.com/...
  NEXT_PUBLIC_STRIPE_PAYMENT_LINK_PRO=https://buy.stripe.com/...
  NEXT_PUBLIC_STRIPE_PAYMENT_LINK_PREMIUM=https://buy.stripe.com/...
  ```

#### 3. Stripe Webhook endpoint
- Влез в **Stripe Dashboard → Developers → Webhooks**
- Добави endpoint: `https://salonapp.pro/api/webhooks/stripe`
- Events: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`
- Копирай `whsec_...` в Vercel ENV

---

### 🟡 Важно (UX подобрения)

#### 4. Банер при влизане в салонски акаунт от супер-админа
- Когато супер-админ влезе в чужд акаунт, да се показва:
  `"⚠️ Гледаш като: Салон Бижу — [Излез]"`
- Трябва httpOnly cookie `super_admin_salon` + четене в layout-а

#### 5. Автоматична деактивация при изтекъл grace период
- В момента статусът не се сменя автоматично след `grace_until_date`
- Нужен е cron job (Vercel Cron или Supabase pg_cron):
  ```sql
  UPDATE tenants SET status = 'inactive'
  WHERE grace_until_date < CURRENT_DATE AND status = 'active';
  ```

#### 6. Нотификация до супер-админа при нова заявка (lead)
- При попълване на контактната форма на маркетинг сайта
- Изпращане на имейл до супер-админа

---

### 🟢 Nice-to-have

#### 7. Профилна снимка / аватар за салоните
- В момента логото е URL — може да се добави директен upload

#### 8. Онбординг wizard за нови салони
- Стъпки: качи лого → добави услуги → задай работно време → виж сайта

#### 9. Статистика в салонския админ
- Графика на резервации по месец
- Най-популярни услуги
- Revenue tracking

#### 10. SMS нотификации
- При нова резервация — SMS до собственика и/или клиента
- Интеграция с Twilio или локален SMS провайдър

#### 11. Клиентски портал
- Клиентът да може да вижда и отменя своите резервации

#### 12. `Clean` шаблон — цвят
- Шаблонът `clean` използва hardcoded `#0066CC` вместо `primary_color`
- Малка промяна: `const primary = tenant.primary_color ?? "#0066CC"`

---

## ENV Variables — пълен списък

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# App
NEXT_PUBLIC_APP_URL=https://salonapp.pro

# Resend (имейли)
RESEND_API_KEY=
RESEND_FROM=SalonApp <no-reply@salonapp.pro>

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PAYMENT_LINK_STANDARD=
NEXT_PUBLIC_STRIPE_PAYMENT_LINK_PRO=
NEXT_PUBLIC_STRIPE_PAYMENT_LINK_PREMIUM=
NEXT_PUBLIC_STRIPE_PAYMENT_LINK_COLLECTIVE=
```

---

## Структура на проекта

```
app/
├── (public)/[salon_slug]/     # Публичен сайт на салона
│   └── booking/               # Страница за резервация
├── admin/                     # Салонски админ панел
│   ├── (protected)/
│   │   ├── dashboard/
│   │   ├── bookings/
│   │   ├── clients/
│   │   ├── services/
│   │   ├── schedule/
│   │   ├── gallery/
│   │   └── settings/
│   └── login/
├── super-admin/               # Супер-админ панел
│   ├── [salon_slug]/          # Детайл на тенант
│   ├── leads/                 # Inbox заявки
│   └── new/                   # Нов тенант
├── api/
│   ├── webhooks/stripe/       # Stripe webhook
│   ├── admin/settings/        # Settings API
│   ├── bookings/              # Резервации API
│   └── leads/                 # Leads API
├── get-started/               # Маркетинг landing → форма за интерес
templates/                     # 6 шаблона: bloom, luxe, luxe2, bold, zen, groom
middleware.ts                  # Auth + tenant routing
```

---

## Git история (последни промени)

| Commit | Описание |
|--------|----------|
| `23911ea` | Fix domain routing, color save, and template cache invalidation |
| `33a340c` | Add save feedback banner and fix site URL in tenant detail page |
| `52ffa67` | Fix runtime crashes in super-admin pages |
| `b5c5428` | Fix Stripe build error: lazy initialize Stripe client |
| `18006df` | Fix template save: remove non-form fields from patch |
| `6d181f6` | Clarify color ownership: remove editable color from super admin |
| `4a05bf6` | Add Stripe webhook for automatic tenant activation |
| `82a17dc` | Gallery redesign + primary color picker in settings |
| `63cb0d6` | Super admin: leads inbox, status badges, template fix, redesign |
