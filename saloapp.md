# SalonApp.pro — Контекст на проекта

> Този файл обобщава всички архитектурни решения, договорки и статус на проекта.
> Използвай го в началото на всеки нов чат за пълен контекст.

---

## Какво е SalonApp.pro

Multi-tenant B2B SaaS платформа за beauty салони. Клиентките (майсторки) получават:
- Собствен публичен сайт на субдомейн (`meri-nails.salonapp.pro`)
- Онлайн резервации 24/7
- Админ панел за управление на графика, услугите, финансите
- Автоматични напомняния (SMS/Viber/имейл)

**Tech stack:** Next.js 14 App Router · TypeScript · Tailwind CSS · Supabase · Framer Motion · Twilio · Vercel

---

## Архитектура

### Субдомейн routing (вече имплементиран)
```
*.salonapp.pro  →  Vercel (wildcard DNS)
meri-nails.salonapp.pro  →  middleware извлича slug "meri-nails"  →  зарежда от база
meri-nails.salonapp.pro/admin  →  същото приложение, admin панел
```

Middleware (`middleware.ts`) вече чете hostname-а и задава `x-salon-slug` header. **Нов салон = нов ред в базата. Нищо друго.**

### Многотенантност
- Всеки салон = 1 ред в `tenants` таблицата с уникален `salon_slug`
- Шаблонът се избира при създаване: `template: "bloom" | "luxe" | "zen" | "bold" | "luxe2" | "groom"`
- Primary color, лого, текстове, снимки — всичко в базата, без код

### Onboarding flow
1. Клиентката попълва `/get-started` → лийд
2. Ти отиваш на `/super-admin/new` → въвеждаш: ime, slug, шаблон, имейл, план
3. Системата създава tenant + Supabase акаунт + еднократен линк за парола
4. Пращаш линка на клиентката (Viber/имейл)
5. Тя влиза на `meri-nails.salonapp.pro/admin` с нова парола

### Абонамент
- Безплатен период → Stripe линк → плащане → активиране от `/super-admin`

---

## DNS статус

| Домейн | Статус |
|--------|--------|
| `salonapp.pro` | Добавен в Vercel, **чака DNS в Namecheap** |
| `*.salonapp.pro` | Добавен в Vercel, **чака DNS в Namecheap** |

### Записи за въвеждане в Namecheap → Advanced DNS

| Type | Host | Value |
|------|------|-------|
| `A Record` | `@` | `76.76.21.21` |
| `A Record` | `*` | `76.76.21.21` |

**До тогава:** разработката върви на `localhost` (path-based: `localhost/meri-nails`).

---

## Шаблони

### Местоположение
- Source (beautypro): `C:\Users\Lina\beautypro\app\`
- Production (salonapp): `C:\Users\Lina\SALOAPP\components\templates\`

### Статус на шаблоните

| Шаблон | beautypro | salonapp | Тип |
|--------|-----------|---------|-----|
| `Bloom` | ✅ `/bloom` | ✅ Пренаписан | Нокти / маникюр |
| `Luxe` | ✅ `/luxe` | 🔄 Трябва пренапис | Луксозен козметичен |
| `Luxe2` | ✅ `/luxe2` | 🔄 Трябва пренапис | Фризьорски |
| `Bold` | ✅ `/bold` | 🔄 Трябва пренапис | Барбершоп |
| `Zen` | ✅ `/zen` | 🔄 Трябва пренапис | Масаж / уелнес |
| `Groom` | ✅ `/groom` | ❌ Липсва | Pet grooming |

### Правило за пренапис
- Визия: **1:1 от beautypro** (inline styles, цветове, layout)
- Данни: **динамични от `SalonData`** (не статичен config)
- Booking: **Link към `/${tenant.salon_slug}/booking`** (не inline форма)
- Секции: **еднакви за всички** — About, Services (EUR+BGN), Booking CTA, Работно време, Контакти + социални, Google Maps, Галерия, Footer

### SalonData структура
```typescript
interface SalonData {
  tenant: Tenant;        // всички настройки на салона
  services: Service[];   // услуги с цени
  gallery: { id, url, order_index }[];
  workingHours: WorkingHours[];  // day_of_week 0-6, start_time, end_time, is_day_off
  specialists?: Specialist[];
}
```

### Tenant полета (за шаблоните)
```
primary_color, logo_url, salon_name, salon_slug
hero_title, hero_subtitle, hero_image_url, description
about_text1, about_text2, about_image_url
address, phone, email
instagram_url, facebook_url, tiktok_url
google_maps_embed
```

---

## Landing Page (salonapp.pro)

**URL:** `salonapp-ten.vercel.app` → ще стане `salonapp.pro` след DNS

### Секции (текущи)
1. Header (фиксиран) — лого + "Безплатен месец" бутон
2. Hero — лого голямо + заглавие + CTA бутони
3. Trust strip — 3 карти с икони (центрирани)
4. Проблемите, които решаваме (`ProblemsSection`) — placeholder снимки → **трябва скрийншоти**
5. Планове и цени (`PlansSection`)
6. FAQ (`FaqAccordion`)
7. CTA banner
8. Footer

### "Избери своя стил" секция — ПРЕДСТОИ
- 6 карти с превю снимки на шаблоните
- Всяка кликва към демо маршрут
- Трябва: скрийншоти на всички 6 шаблона + demo routes + `TemplatesSection` компонент

### ProblemsSection — нужни скрийншоти
| Блок | Снимка |
|------|--------|
| 01 — Твоята лична витрина | Публичен сайт на демо салон |
| 02 — Дигитален график | Календар/booking в админ |
| 03 — Край на забравените часове | Напомняне/съобщение |
| 04 — Бизнес Калкулатор | Финанси секция в админ |

---

## Админ панел

**Един за всички шаблони.** Маршрути:

| Страница | URL |
|----------|-----|
| Дашборд | `/admin/dashboard` |
| Календар | `/admin/calendar` |
| Услуги | `/admin/services` |
| Специалисти | `/admin/specialists` |
| Клиенти | `/admin/clients` |
| Галерия | `/admin/gallery` |
| Работно време | `/admin/working-hours` |
| Настройки (сайт) | `/admin/settings` |
| Финанси | `/admin/finances` |

Settings формата вече поддържа всички полета (лого, цветове, hero, about, контакти, социални, maps). **Още не е свързана с шаблоните напълно** — Luxe/Zen/Bold пропускат някои секции.

---

## Бизнес модел

### Планове
| План | Цена | Специалисти |
|------|------|-------------|
| Стандарт | 19€/мес | 1 |
| Про | 29€/мес | 1 + паралелни услуги + SEO |
| Премиум | 49€/мес | 1 + SMS/Viber напомняния |
| Колектив | 49€/мес | Неограничени специалисти |

### Шаблоните — Вариант А (договорено)
- Клиентката избира шаблон от галерия
- Може да промени: цветове, лого, снимки, текст
- **Не може** да мества секции или да иска custom layout
- Custom дизайн = отделна услуга на отделна цена

---

## Предстоящи задачи (приоритетно)

1. **Пренапис на шаблони** — Luxe, Luxe2, Bold, Zen, Groom (1:1 от beautypro)
2. **Demo routes** — `app/demo/bloom`, `app/demo/luxe` и т.н. с mock данни
3. **"Избери своя стил" секция** на landing page — 6 карти с превюта
4. **Скрийншоти** на шаблоните за ProblemsSection и за "Избери своя стил"
5. **DNS** в Namecheap — двата A записа
6. **Админ панел** — след шаблоните (не сега)

---

## Файлова структура (ключови файлове)

```
SALOAPP/
├── app/
│   ├── page.tsx                    ← Landing page
│   ├── (public)/[salon_slug]/      ← Публичен сайт на салон
│   ├── admin/(protected)/          ← Админ панел
│   │   ├── settings/               ← Настройки на сайта
│   │   ├── calendar/
│   │   ├── finances/
│   │   └── ...
│   └── super-admin/new/            ← Създаване на нов тенант
├── components/
│   ├── templates/
│   │   ├── Bloom.tsx               ← ✅ Пренаписан
│   │   ├── Luxe.tsx                ← 🔄 Трябва пренапис
│   │   ├── Bold.tsx                ← 🔄 Трябва пренапис
│   │   ├── Zen.tsx                 ← 🔄 Трябва пренапис
│   │   └── salon-shared.ts         ← Помощни функции
│   └── landing/
│       ├── ProblemsSection.tsx
│       └── PlansSection.tsx
├── middleware.ts                   ← Subdomain routing (готов)
└── types/database.ts               ← SalonData, Tenant, Service...
```

---

*Последна актуализация: Април 2026*
