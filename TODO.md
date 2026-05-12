# SalonApp.pro — TODO

> Актуализирай след всяка задача. Последна промяна: 2026-05-12 (вечер)
> Цел: пускане на 100 платени салона

---

## 🔴 КРИТИЧНО — само Лина (инфраструктура)

- [ ] **Stripe Payment Links** — създай 4 линка в Stripe Dashboard (15/19/29/49€), добави ENV в Vercel:
  `NEXT_PUBLIC_STRIPE_PAYMENT_LINK_STARTER/STANDARD/PRO/PREMIUM`
- [ ] **Stripe Webhook** — регистрирай `https://salonapp.pro/api/webhooks/stripe` в Stripe Dashboard
  → Events: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`
  → Добави `STRIPE_SECRET_KEY` и `STRIPE_WEBHOOK_SECRET` в Vercel

---

## 🟢 ПО-КЪСНО (след launch, при растеж)

- [ ] **Google Calendar** — НЕ СЕ ПИПА без изрично разрешение от Лина (кодът е готов, тест при нужда)
- [ ] **Статистика в салонския админ** — графики по месец, топ услуги
- [ ] **Клиентски портал** — клиентът да вижда/отменя резервациите си
- [ ] **SMS (Twilio)** — `lib/sms.ts` е stub, нужен реален акаунт
- [ ] **Финансов панел** — верификация на формули и метрики

---

## ✅ ЗАВЪРШЕНО

- [x] **Cookie consent banner** (2026-05-12) → PR #25–27 — GDPR-compliant, 3 категории
- [x] **GDPR export endpoint** (2026-05-12) → PR #23
- [x] **Upstash Redis** (2026-05-12) — DB създадена, ENV vars в Vercel
- [x] **Sentry** — работи от Apr 22, config файлове добавени PR #21
- [x] **Лого upload** — `ImageUpload` + `/api/admin/upload` вече работят
- [x] **Analytics pixels** (2026-05-12) → PR #19 — FB Pixel, GTM, Clarity
- [x] **Unsubscribe endpoint** (2026-05-12) → PR #18 — GDPR-compliant
- [x] **Dunning email при failed payment** (2026-05-12) → PR #18
- [x] **Rename планове** (2026-05-12) → PR #13–17 — starter/standard/pro/premium
- [x] **Пълен одит на кодовата база** (2026-05-11) — 84 unit теста
- [x] **Имейл нотификация до салона при резервация** (2026-05-11) → PR #11
- [x] **Нормализиране на телефони** (2026-05-11) — migration 024
- [x] **Банер при super-admin impersonation** — в `layout.tsx`
- [x] **Clean шаблон primary_color** — оправено
- [x] **Lead нотификация до супер-админ** — `lib/lead-notify.ts`
- [x] **Автоматична деактивация cron** — `billing-expiry` + `vercel.json`
- [x] **Google Calendar интеграция Phase 1+2+3** (2026-05-05)
- [x] **Security fixes** (2026-04-22) — cron auth, XSS, booking integrity
- [x] **Rate limiting** — Upstash Redis (production) + in-memory fallback
- [x] **Stripe webhook** — автоматично активиране при `invoice.paid`
- [x] **Галерия** — drag-and-drop, toggle видимост
- [x] **Цветова палитра** — 6 preset + custom hex
- [x] **Потвърдителен имейл до клиента при резервация**
