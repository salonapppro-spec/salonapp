# SalonApp.pro — TODO

- [x] **Security: booking service integrity** — server-side service lookup by `salon_slug + service_id`; client no longer controls service name, price, or duration

> Актуализирай след всяка задача. Последна промяна: 2026-04-20

---

## 🔴 КРИТИЧНО (сега)

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

## 🟡 ВАЖНО (следва — за Поли)

- [ ] **Оправи `clean` шаблон — цвят** — Поли  
  → Файл: `templates/Clean.tsx` (или `app/(public)/templates/Clean.tsx`)  
  → `const ACCENT = "#0066CC"` → `const ACCENT = tenant.primary_color ?? "#0066CC"`

- [ ] **Банер при super-admin impersonation** — Поли  
  → Когато супер-админ влезе в чужд акаунт, показвай: `"⚠️ Гледаш като: Салон X — Излез"`  
  → Файл: `app/admin/(protected)/layout.tsx`  
  → Чети cookie `SUPER_ADMIN_SALON_COOKIE` от `lib/admin-tenant.ts`  
  → Бутон "Излез" → server action изтрива cookie → redirect `/super-admin`

- [ ] **Автоматична деактивация при изтекъл grace период** — Поли  
  → Салони с `grace_until_date < today` и `status = 'active'` трябва да станат `inactive`  
  → Вариант 1: Vercel Cron Job (`vercel.json` + API route)  
  → Вариант 2: Supabase pg_cron (SQL)  
  → SQL: `UPDATE tenants SET status='inactive' WHERE grace_until_date < CURRENT_DATE AND status='active'`

- [ ] **Нотификация до супер-админ при нова заявка (lead)** — Поли  
  → При попълване на `/get-started` форма → изпрати имейл до `admin@salonapp.pro`  
  → Файл: `app/api/leads/route.ts`  
  → Добави Resend fetch след успешен insert в `platform_leads`

---

## 🟢 ПО-КЪСНО

- [ ] **Онбординг wizard за нови салони** — 4 стъпки след регистрация  
  Стъпки: качи лого → добави услуги → задай работно време → виж сайта

- [ ] **Статистика в салонския админ**  
  → Графика на резервации по месец  
  → Най-популярни услуги  
  → Revenue tracking

- [ ] **Клиентски портал**  
  → Клиентът да може да вижда и отменя своите резервации

- [ ] **SMS нотификации**  
  → При нова резервация — SMS до собственика и/или клиента  
  → Интеграция с Twilio или локален SMS провайдър

- [ ] **Профилна снимка / аватар за салоните**  
  → Директен upload вместо URL за логото

- [ ] **Потвърдителен имейл до клиента при резервация**  
  → При успешна резервация → изпрати Resend имейл до клиента

---

## ✅ ЗАВЪРШЕНО (последни 10)

- [x] **Middleware: path-based routing за Vercel** — `salonapp-ten.vercel.app/salon-bizhu` работи
- [x] **`primary_color` pipeline оправен** — схемата вече включва полето, цветът се записва
- [x] **Template cache revalidation** — смяна от супер-админ → веднага на сайта
- [x] **Success feedback при запазване** — зелен банер + redirect `?saved=1`
- [x] **Stripe webhook** — автоматично активиране при `invoice.paid` / `checkout.session.completed`
- [x] **Галерия redesign** — drag-and-drop зона, toggle видимост, нова визия
- [x] **Цветова палитра в настройките** — 6 preset + custom hex picker
- [x] **Супер-админ: leads inbox** — страница `/super-admin/leads`
- [x] **Супер-админ: status badges** — визуален статус на тенантите
- [x] **Fix: template save не работеше** — махнати non-form полета от patch
