# SalonApp.pro — TODO

> Актуализирай след всяка задача. Последна промяна: 2026-05-11 (вечерта)

---

## 🔴 КРИТИЧНО — преди пускане (Лина)

- [ ] **Свържи домейн `salonapp.pro` с Vercel** — Лина
  → Vercel → Settings → Domains → добави `salonapp.pro` и `*.salonapp.pro`
  → DNS: `A` запис `@` → `76.76.21.21` | `CNAME` `*` → `cname.vercel-dns.com`
  → До тогава работи само `salonapp-ten.vercel.app/salon-bizhu`

- [ ] **Добави Stripe ENV в Vercel** — Лина
  → `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
  → `NEXT_PUBLIC_STRIPE_PAYMENT_LINK_STANDARD/PRO/PREMIUM/COLLECTIVE`

- [ ] **Регистрирай Stripe Webhook endpoint** — Лина
  → Stripe Dashboard → Developers → Webhooks
  → URL: `https://salonapp.pro/api/webhooks/stripe`
  → Events: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`

---

## 🟡 ВАЖНО — преди пускане (Поли)

- [ ] **Оправи `clean` шаблон — цвят** — Поли
  → Файл: `templates/Clean.tsx` ред ~19
  → `const ACCENT = "#0066CC"` → `const ACCENT = tenant.primary_color ?? "#0066CC"`

- [ ] **Банер при super-admin impersonation** — Поли
  → Когато супер-админ влезе в чужд акаунт: `"⚠️ Гледаш като: Салон X — Излез"`
  → Файл: `app/admin/(protected)/layout.tsx`
  → Чети `SUPER_ADMIN_SALON_COOKIE` от `lib/admin-tenant.ts`
  → Бутон "Излез" → server action изтрива cookie → redirect `/super-admin`

- [ ] **Автоматична деактивация при изтекъл grace период** — Поли
  → Салони с `grace_until_date < today` и `status = 'active'` → стават `inactive`
  → Вариант: Vercel Cron Job (`vercel.json` + API route) с `CRON_SECRET` auth
  → SQL: `UPDATE tenants SET status='inactive' WHERE grace_until_date < CURRENT_DATE AND status='active'`

- [ ] **Нотификация до супер-админ при нова заявка (lead)** — Поли
  → При попълване на `/get-started` → имейл до `admin@salonapp.pro`
  → Файл: `app/api/leads/route.ts` — добави Resend fetch след успешен insert

---

## 🟢 ПО-КЪСНО (след launch)

- [ ] **Google Calendar интеграция — финализиране и тестване за The Skin**
  → Progress: Phase 1+2+3 done (OAuth, FreeBusy, sync, webhook, cron renew)
  → Остава: реални тестове с production Google акаунт, евент. feature flag разширяване

- [ ] **Оправи финансовия панел (формули/метрики)**
  → `app/admin/(protected)/finances/page.tsx`
  → `components/admin/finances/FinanceSummarySection.tsx`, `FinanceAbcSection.tsx`
  → `lib/finance-dates.ts` — провери helper-ите за периоди

- [ ] **Онбординг wizard за нови салони** — 4 стъпки след регистрация
  → качи лого → добави услуги → задай работно време → виж сайта

- [ ] **Статистика в салонския админ**
  → Графика на резервации по месец, най-популярни услуги, revenue tracking

- [ ] **Клиентски портал**
  → Клиентът да вижда и отменя своите резервации

- [ ] **SMS нотификации**
  → При нова резервация — SMS до собственика/клиента (Twilio или локален)

- [x] **Потвърдителен имейл до клиента при резервация** — вече работи (Resend)

- [ ] **Профилна снимка / аватар — директен upload**
  → Вместо URL за логото

---

## ✅ ЗАВЪРШЕНО

- [x] **Имейл нотификация до салона при нова резервация** (2026-05-11, Поли)
  → `lib/email.tsx` `sendSalonBookingNotification()` → изпраща на `owner_email`
  → PR #11 merge-нат и деплоиран в production
- [x] **Нормализиране на телефони — без дублирани клиенти** (2026-05-11)
  → `lib/phone.ts` + нормализиране навсякъде + migration 024 приложена в production
  → Автофил на Име + Имейл при въвеждане на телефон (публичен сайт + Бърз час)
- [x] **Google Calendar интеграция Phase 1+2+3** — OAuth, FreeBusy, sync, webhook, cron (2026-05-05, Лина)
- [x] **Fix: BookingCalendar коса за сложни услуги** (2026-05-05, Лина)
- [x] **Security: cron API auth** — `CRON_SECRET` Bearer validation
- [x] **Security: design tokens Stored XSS** — strict Zod allowlist, без `dangerouslySetInnerHTML`
- [x] **Security: booking service integrity** — сървърът чете name/price/duration от DB
- [x] **Middleware: path-based routing за Vercel** — `salonapp-ten.vercel.app/salon-bizhu` работи
- [x] **`primary_color` pipeline оправен** — цветът се записва и вижда на сайта
- [x] **Template cache revalidation** — смяна от супер-админ → веднага на сайта
- [x] **Success feedback при запазване** — зелен банер + redirect `?saved=1`
- [x] **Stripe webhook** — автоматично активиране при `invoice.paid`
- [x] **Галерия redesign** — drag-and-drop, toggle видимост
- [x] **Цветова палитра** — 6 preset + custom hex picker
- [x] **Супер-админ: leads inbox** — `/super-admin/leads`
- [x] **Супер-админ: status badges** — визуален статус на тенантите
- [x] **Rate limiting** — bookings (40/min), leads (15/min)
