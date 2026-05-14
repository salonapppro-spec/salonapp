# FINAL SECURITY ODIT CLOD — SalonApp.pro

**Дата:** 2026-05-12  
**Верификатор:** Claude Code (Senior Security Lead mode)  
**Метод:** Meta-Audit на три AI одита (Claude, Codex, Cursor) + директна верификация в кода  
**Кодови промени:** None (read-only)

---

## Резюме

| Ниво | Брой |
|------|------|
| Висок | 2 |
| Среден | 2 |
| Нисък | 2 |
| Info | 1 |
| Изключени (false positive / not production) | 5 |

---

## ВИСОК — #1: GDPR Export без верификация на самоличността

**Файл:** `app/api/gdpr/export/route.ts`  
**Редове:** 12–83  
**Категория:** Identity Verification Bypass + GDPR Art.12 нарушение  
**Потвърден от:** Claude VULN-003, Cursor L2

### Проблем

Endpoint-ът `POST /api/gdpr/export` изпраща лични данни на всеки submitted имейл без **никаква проверка, че заявителят притежава адреса**. Данните не отиват при атакуващия — те отиват при жертвата — но самото изпращане без верификация е нарушение на GDPR чл.12.

```typescript
// app/api/gdpr/export/route.ts — потвърден код
const supabase = createSupabaseServiceRoleClient(); // заобикаля RLS
let query = supabase.from("bookings").select(...);  // без salon_slug филтър
// ...
const recipientEmail = email ?? bookings?.[0]?.client_email ?? null;
// ↑ изпраща ДИРЕКТНО на submitted email — без ownership proof
```

**Бележка за cross-tenant:** Данните включват резервации от всички салони — това е **по дизайн** за GDPR SAR по чл.15 и НЕ е самостоятелен бъг.

### Сценарии за злоупотреба

1. **Харасмент:** Атакуващ наводнява чужд имейл с GDPR-branded съобщения от SalonApp.
2. **Privacy leakage:** Потребител разбира в кои салони е бил записан колега/партньор, просто като submit-не техния имейл и изчака потвърждение за "не намерени данни" / наличие на данни (oracle).
3. **Регулаторна санкция:** Изпращане на лични данни без верифицирана самоличност е директно нарушение на GDPR чл.12 — до 4% от годишния оборот.

### Решение

**Двустъпков flow (по модела на `/api/confirm/[token]`):**

```typescript
// Стъпка 1: POST /api/gdpr/export — само изпраща verification email
export async function POST(req: Request) {
  const { email } = Schema.parse(body);
  const token = crypto.randomUUID();
  await saveGdprRequestToken(token, email, "export", Date.now() + 3_600_000);
  await sendVerificationEmail(email, `/api/gdpr/export/confirm?token=${token}`);
  return NextResponse.json({ ok: true }); // не разкрива дали имейлът съществува
}

// Стъпка 2: GET /api/gdpr/export/confirm?token=xxx — само след клик
export async function GET(req: Request) {
  const token = url.searchParams.get("token");
  const request = await consumeGdprToken(token, "export"); // single-use, 1h TTL
  if (!request) return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
  await buildAndSendExport(request.email); // изпраща само за верифицирания имейл
}
```

---

## ВИСОК — #2: GDPR Export без rate-limit

**Файл:** `middleware.ts` (липсващ блок)  
**Категория:** Missing Rate Limiting  
**Потвърден от:** Claude (директна верификация в middleware.ts)

### Проблем

`/api/gdpr/delete-request` е rate-limited. `/api/gdpr/export` — не е. Потвърдено в `middleware.ts`:

```typescript
// middleware.ts — само delete е защитен
if (pathname === "/api/gdpr/delete-request" && m === "POST") {
  const r = await rl(`gdpr-delete:${ip}`, RATE.gdprDeletePost, "gdpr_delete");
  if (r) return r;
}
// /api/gdpr/export — ЛИПСВА блок
```

### Решение

```typescript
// Добави в middleware.ts, след блока за gdpr-delete:
if (pathname === "/api/gdpr/export" && m === "POST") {
  const r = await rl(`gdpr-export:${ip}`, { limit: 3, windowMs: 600_000 }, "gdpr_export");
  if (r) return r;
}
```

---

## СРЕДЕН — #3: Stripe webhook owner-email fallback по default ON

**Файл:** `app/api/webhooks/stripe/route.ts` (ред 47–49)  
**Категория:** Insecure Default Configuration  
**Потвърден от:** Codex + Cursor (независимо)

### Проблем

```typescript
function allowOwnerEmailFallback(): boolean {
  const raw = process.env.STRIPE_ALLOW_OWNER_EMAIL_FALLBACK?.trim().toLowerCase();
  if (!raw) return true; // default safe migration path — ⚠️ НЕ е safe, default е ON
```

При липса на env var, fallback-ът е активен. Ако атакуващ плаща с Stripe Payment Link и въведе `owner_email` на реален tenant, може да bind-не Stripe customer/subscription ID към чужд акаунт.

Кодът логва злоупотребата (`logAbuseEvent`), но не я блокира по default.

### Решение

```typescript
if (!raw) return false; // secure by default — включвай само при нужда
```

Допълнително: изисквай `salon_slug` в Stripe checkout metadata и bind-вай само по него.

---

## СРЕДЕН — #4: JSON-LD XSS чрез `</script>` breakout

**Файл:** `app/(public)/[salon_slug]/page.tsx` (ред 144)  
**Категория:** Stored XSS (admin-controlled input)  
**Потвърден от:** Cursor H1 (верифициран в кода)

### Проблем

```typescript
<script type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
```

`JSON.stringify` не ескейпва `</script>` към `</script>`. HTML5 парсерът спира `<script>` блок при първото `</script>`, дори вътре в JSON низ. Ако `tenant.salon_name` или `tenant.description` съдържа `</script><script>alert(1)</script>`, breakout-ът работи.

**Threat model:** Изисква компрометиран или злонамерен salon admin акаунт. Анонимни потребители не могат да exploit-ват директно.

**Утежняващ фактор:** `'unsafe-inline'` е включен в `script-src` CSP (потвърдено в `next.config.mjs`).

### Решение

```typescript
// Замени ред 144:
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
  }}
/>
```

---

## НИСЪК — #5: CSV formula injection

**Файл:** `app/api/admin/clients/export/route.ts`  
**Категория:** CSV Injection  
**Потвърден от:** Codex

### Проблем

```typescript
function csvEscape(s: string): string {
  const t = String(s).replace(/"/g, '""');
  if (/[",\n]/.test(t)) return `"${t}"`;
  return t; // не prefix-ва =, +, -, @
}
```

Клиент с booking може да запише `=HYPERLINK("https://attacker.test","click")` като name/notes. При отваряне на CSV в Excel/Sheets, формулата се изпълнява.

### Решение

```typescript
function csvEscape(s: string): string {
  let t = String(s).replace(/"/g, '""');
  if (/^[=+\-@\t\r]/.test(t)) t = `'${t}`; // prefix опасни начала
  if (/[",\n]/.test(t)) return `"${t}"`;
  return t;
}
```

---

## НИСЪК — #6: Public client lookup разкрива пълно име по телефон

**Файл:** `app/api/clients/lookup/route.ts`  
**Категория:** Privacy / Information Disclosure  
**Потвърден от:** Codex

### Проблем

```typescript
const result = await lookupClientByPhone(salonSlug, parsed.data.phone);
return NextResponse.json({ name: result.name }); // пълно ime
```

Rate limit-ът е 10/min, което позволява targeted enumeration (известен телефонен номер → разкрива дали е клиент и пълното му ime).

### Решение

Върни само masked hint (`"А*** И***"`) вместо пълно name, или изисквай предишен booking token за lookup.

---

## INFO — #7: Подвеждащ коментар за CSP режим

**Файл:** `next.config.mjs` (редове 25–26)  
**Потвърден от:** Cursor L1

```javascript
// CSP в report-only режим — не блокира, само логва нарушения в DevTools.
// Когато провериш, че нищо не се чупи, смени на Content-Security-Policy.
```

Кодът по-долу задава реален `Content-Security-Policy`, не `Report-Only`. Коментарът е невярен и подвежда при одити.

**Действие:** Коригирай коментара.

---

## Изключени находища

| Находище | Защо е изключено |
|----------|-----------------|
| Google Calendar интеграция | Файловете не са commit-нати (`git ls-files` = празно). Production връща 404. Риск е само при случаен `git add .` — вече забранен от CLAUDE.md. |
| GDPR cross-tenant данни | По дизайн за GDPR SAR (чл.15 изисква всички данни на платформата). Не е бъг. |
| X-Frame-Options removed | `frame-ancestors` CSP (`*.salonapp.pro`) осигурява еквивалентна защита за модерни браузъри. |
| CSP `unsafe-inline` | Документиран компромис с Next.js hydration + marketing pixels. Решение изисква nonce инфраструктура. |
| CSRF на confirm token | UUID token е unguessable. Рискът е leakage на линка, не brute force CSRF. |

---

## Качество на трите одита

| Модел | Правилно открито | Пропуснато / Грешно |
|-------|-----------------|---------------------|
| **Claude** | GDPR export проблем (най-сериозното); 9 коректни false positives | Вътрешно противоречие VULN-003 vs VULN-008; "Critical" framing неточен |
| **Codex** | Google Calendar = не е production риск (единственият проверил с git); Stripe fallback; CSV injection | Пропуска GDPR export изцяло |
| **Cursor** | JSON-LD XSS (реална находища); Stripe fallback (независимо потвърждение) | GDPR export underclassified ("Low — spam"); Google Calendar без production verification |

---

## Следващи стъпки (наредени по приоритет)

1. **Незабавно:** Имплементирай двустъпков GDPR export flow с email verification token.
2. **Незабавно:** Добави rate-limit за `/api/gdpr/export` в `middleware.ts`.
3. **Тази седмица:** Смени Stripe `allowOwnerEmailFallback` default на `false`.
4. **Тази седмица:** Escapeвай `</` в JSON-LD чрез `.replace(/</g, "\\u003c")`.
5. **Следващ sprint:** Fix на `csvEscape()` + client lookup masked hint.
6. **Cleanup:** Коригирай CSP коментара в `next.config.mjs`.

---

*Одитът е извършен на 2026-05-12. Всяко находище е верифицирано с директно четене на файловете. Не са правени промени по кода.*
