# HANDOFF — последна актуализация: 2026-08-21

---

## 2026-08-21 — Таня: обучения, Instagram, ново работно време и заключване на цветовете

### В базата
- **Работно време** Пн–Пт 10:00–19:00, събота 10:00–17:00, неделя почивен (беше 09:30–18:00).
- **`instagram_url`** на тенанта.

### На сайта
- **Категориите в ценоразписа са пренаписани по админ панела.** Таня е добавила 5 пакетни услуги („Дамско подстригване, измиване, сешоар, стайлинг“, „Мъжко фейд подстригване…“) и е изключила 11 (изсушаване, брада, вежди, мустак, врат, измиване, бретон). Нова първа група „Подстригване с измиване и стайлинг“ хваща пакетите преди простото „Подстригване“; регексът `^Мъжко под` хваща и правописната грешка „подсригване“ от админа. Празните групи се пропускат, но остават в списъка, за да си дойдат на място при връщане на услуга. Проверено: и 26-те активни услуги излизат, нищо не пада в „Други услуги“.
- **Нова секция „Обучения“** между „За мен“ и марките: FIBRECLINIX (със снимка), BLONDME и ASK Education, плюс две снимки от събитията на STMNT.
- **Instagram** — знакът е inline SVG като Facebook, линкът минава през `safeInstagramHref`. В контактите като бутон, във футъра като кръгла икона.

### ⚠️ Тъмен режим — беше счупено
Samsung Internet (и Chrome „force dark") **пренебрегват `color-scheme: only light`** и инвертират цветовете алгоритмично. На телефона на Таня златният градиент на заглавията изчезваше, а бутоните ставаха почти черни. Глобалният `color-scheme` в `globals.css` не помага срещу тях.

Работещото решение: страницата ЯВНО отговаря на `@media (prefers-color-scheme: dark)`, като повтаря **същите светли стойности**. Щом сайтът декларира собствено поведение за тъмен режим, браузърът спира да го пипа. Проверено с емулиран dark: всички повърхности връщат идентични цветове на светлия режим.

### Проверено
375 / 768, светъл и тъмен режим: нула хоризонтален скрол, нула преливащи елементи. Обученията бяха 3 колони по 100px на телефон — сега 1 колона (2 на таблет). `tsc` чист, ESLint чист, 189 теста.

### Остава
Правописна грешка в админ панела: „Мъжко под**с**ригване Боядисване на коса, измиване, стайлинг“. Не я пипам — това е нейн запис; Таня да я оправи от админа.

---

## 2026-08-20 — Таня: мобилен одит преди предаване на клиента

Огледах сайта на живо на 320 / 375 / 768 px. Намерени и оправени:

- **Мобилното меню беше прозрачно (критично).** `.t-nav` има `backdrop-filter: blur(10px)`, а той прави елемента containing block за `position: fixed` потомци. Менюто беше вътре в `<header>` и се свиваше до 375×68 вместо 375×812 — фонът му покриваше само лентата, а линковете стояха нечетими върху hero снимката. Изнесено е извън `<header>` като съсед в `.t-site`. Проба: fixed елемент вътре в хедъра меря 375×68, вътре в `.t-site` — 375×812.
- **Hero-то изяждаше целия първи екран.** Снимката става 300×300 на мобилно (беше 340×425), заглавието и „Запази час онлайн“ вече се събират над сгъвката.
- **Долната лента покриваше бутона в hero-то.** Сега се скрива и в hero-то, и над формата за резервация (`data-t-hide-sticky`, беше `data-t-booking` само за формата).
- **Сертификатът беше 340×690** — почти цял екран. Изрязан на 4:5 → 340×425.
- **Преди/след двойките бяха с различни височини** между картите (270 / 201 / 198). Фиксирано съотношение 3:4 + `object-fit: cover` → всичките 6 са 148×198.
- **Дребен текст**: левовата цена 12.2 → 13.6px, `.tb-hint` 15.2 → 16px, eyebrow 11.8 → 12.8px.

Остават по проект: линкът „SalonApp.pro“ във футъра е 32px висок (inline кредит в изречение) и `.t-footer-note` е 13px — съзнателно.

---

## 2026-08-20 — Таня: нови снимки, лична секция „За мен“ и марките в салона

- **`За нас` → `За мен`** — секцията е пренаписана от първо лице по текст на Таня (25 години практика, обучения, редовни клиенти като семейство, официалните поводи). Голямата снимка от 25-годишнината на салона (`about-tania.webp`) минава на цялата ширина на съдържанието, с кръгъл бейдж „25 години“; отстрани — снимка с клиентка и сертификатът ASK Education. Линковете в навигацията и футъра също са „За мен“.
- **Нова лента „Марките, с които работя“** — какао секция между „За мен“ и ценоразписа: Authentic Beauty Concept, INDOLA, STMNT, Schwarzkopf с по един ред описание.
- **Галерия: 9 → 16 снимки** (бордо каре, медни нюанси, платинено русо, панделка, сливова опашка, витрината на салона).
- **Преди/след: 2 → 3 двойки** — добавено „Изравняване на цвета“ (израснал корен и изтеглени краища → равномерно русо).
- **11 нови оптимизирани webp** в `public/tenants/tania/` (голямата ≤250 KB, останалите ≤150 KB).

### Корекции същия ден

- „За мен“ остава само със сертификата ASK Education; снимката с клиентката слиза в галерията, а витрината на салона излиза от нея (галерията пак е 16 снимки).
- **Facebook** — знакът е начертан inline SVG (без външни файлове), линкът минава през `safeFacebookHref`, `target="_blank"` + `rel="noopener noreferrer"`. Стои два пъти: като бутон „Следвайте ни във Facebook“ в контактите и като кръгла икона 44×44 във футъра.

### ⚠️ Логата на марките

Клиентката поиска истинските лога. Не са сложени като изображения: снимките на марките дойдоха само в чата (няма файлове в `Downloads/salon_Tania`), а сваляне на чужди лого файлове от нета не е нещо, което правя. Сега марките са изписани типографски с шрифта на сайта — изглежда нарочно, не като липсващо лого. **За да станат истински лога:** Таня слага PNG/SVG файловете (дистрибуторът ѝ ги дава) в `Downloads/salon_Tania` и се подменят за минути в `TANIA_BRANDS`.

### Проверено

375 / 768 / 1265: нула хоризонтален скрол, единична колона на мобилно, всички нови изображения се сервират 200. `tsc` чист, ESLint чист, 189 unit теста минават. Screenshot-и не бяха възможни (панелът с браузъра не се показваше) — проверката е през DOM метрики и мрежови заявки.

---

## 2026-08-19 — Нов тенант `tania` (Фризьорски салон Таня, Бургас) + уникален публичен сайт

**Контекст:** нов клиент — фризьорски салон на ул. „Цар Самуил“ 64, Бургас. Иска златно-бежов дизайн със серифен шрифт, преливки и вълнообразни линии.

### Какво направих

- **`components/tenants/tania/`** — уникален публичен сайт (Page.tsx, TaniaBooking.tsx, TaniaGallery.tsx, TaniaNav.tsx, TaniaReveal.tsx, data.ts).
  Дизайн посока „Топла лента“: преливащи златно-бежови ленти, разделени с истински SVG вълни с три различни амплитуди. Шрифтове през `next/font/google` — **Prata** (дисплей сериф, кирилица) + **Manrope** (текст); нито един не се ползва в друг тенант. Палитра: какао `#3B2A1D`, кестеняво, антично злато `#B9863C`, шампанско, топъл пясък. Асиметричен hero с арковиден портрет вдясно, ценоразпис с водещи точки (не карти), секция „Преди и след“, галерия с лайтбокс.
- **Едностъпкова резервация** — услуга (select с optgroup по категории), хоризонтална лента с работни дни, свободни часове, име/телефон/имейл и бутон „Резервирай“ — всичко в един панел. Ползва `createBooking` + `/api/availability`, валидация на телефона с `isLikelyValidPhone`.
- **`public/tenants/tania/*.webp`** — 16 снимки на клиента, оптимизирани със `sharp` (hero 240 KB, останалите ≤150 KB). Само локални файлове, никакви външни URL-и.
- **`lib/tenant-site-slugs.ts` + `lib/tenant-sites.ts`** — регистриран slug `tania` (сваля и `noindex`-а от `generateMetadata`).
- **Тенантът е създаден в базата** (проект `salonapp-pro`, Supabase MCP): ред в `tenants` (`plan: standard`, `status: trial`, `payment_type: bank`, контакти + Google Maps embed), 32 услуги, работно време Пн–Сб 09:30–18:00 (неделя почивна) и auth user за собственика с `raw_app_meta_data: {role: "owner", salon_slug: "tania"}`, огледален на съществуващите owner редове.
- **`tests/tania-services.test.ts`** — 9 теста върху точните имена от базата: нищо не пада в „Други услуги“, показваните имена в група са уникални (хваща стария бъг с двете „средна коса“), цените се форматират и при numeric-като-низ от Postgres.

### Проверено в браузъра

Desktop (1440 и 1280) и мобилно (375) + таблет (768): нула хоризонтален скрол, tap targets ≥44px, body ≥16px, нула конзолни грешки от сайта (остават само познатите CSP грешки на Vercel Analytics в dev). Google Maps embed зарежда правилния адрес. Ценоразписът показва всички 32 услуги в 10 групи с двойни цени (EUR + лв по 1.956). `npx tsc --noEmit` чист, ESLint чист.

### ⚠️ Остава за Лина

- **Парола на собственика.** Auth user-ът е създаден през SQL, значи няма как да се генерира еднократен set-password линк (за това трябва Admin API / service role key, който не е наличен на тази машина). Таня си задава парола сама през **`salonapp.pro/admin/forgot-password`** с имейл `tanyapapazova1@abv.bg`.
- **End-to-end тест на резервацията.** Не е правен — dev сървърът тук не може да вдигне реални данни без `.env.local` (`loadPublicSalonData` минава през service role), а Vercel CLI/MCP са под друг акаунт. След merge и деплой: отвори `tania.salonapp.pro`, направи една резервация и провери, че влиза в админ панела. Умишлено не създадох тестова резервация директно в production базата — тя праща реален имейл на салона.
- **`financial_settings`** няма ред за `tania` — кодът пада на подразбиращите се (30 дни прозорец, 10 мин буфер). Таня може да ги настрои от админ панела.

---

## 2026-07-29 — B2B блог на `/blog` + SEO/analytics setup

**Контекст:** salonapp.pro (продуктът) е практически невидим в Google — целият органичен трафик идва от 1 тенант (масажно студио в Бургас). Стартираме B2B блог, който да ранкира за това, което **собствениците на салони** търсят.

### Какво направих (блог)

- **`lib/blog.ts`** — чете markdown статии от `content/blog/*.md` (frontmatter през `gray-matter`, рендиране през `marked`). Server-side, статично. Функции: `getPostSlugs`, `getAllPostMeta`, `getPost`.
- **`content/blog/*.md`** — 3 стартови статии (онлайн резервации, намаляване на неявявания, система за управление на салон). Всяка с frontmatter (title, description, date, author, tags) и вътрешни линкове помежду си + към `/get-started`.
- **`app/blog/page.tsx`** — списък с карти + JSON-LD `Blog` schema.
- **`app/blog/[slug]/page.tsx`** — статия с `generateStaticParams`, `generateMetadata` (canonical, OG), JSON-LD `BlogPosting` + `BreadcrumbList`, CTA към `/get-started`.
- **`components/blog/BlogFooter.tsx`** — компактен footer за блога.
- **`components/landing/LandingHeader.tsx`** — добавен линк „Блог"; anchor линковете станаха абсолютни (`/#features`) за да работят от всяка страница.
- **`app/sitemap.ts`** — блог статиите влизат динамично в sitemap.
- **`lib/routing/constants.ts`** — `blog` добавен в `RESERVED_PATHS` (да не се бърка със салонски slug).
- **`tailwind.config.ts`** — добавен `@tailwindcss/typography` (prose стилове за статиите).
- Нови зависимости: `gray-matter`, `marked`, `@tailwindcss/typography`.

### Проверено в браузъра

`/blog` и трите статии рендират; JSON-LD (BlogPosting + BreadcrumbList) присъства; canonical и og:type коректни; sitemap.xml включва блога; нула конзолни грешки; началната страница работи след промяната в навигацията. `npx tsc --noEmit` чист.

### SEO/analytics (виж memory `project-seo-analytics-setup`)

- GA4 вече е на salonapp.pro (`G-PXV7BT1S03`), само на главния домейн.
- Service account `salonapp-seo@salonapp-495413.iam.gserviceaccount.com` чете GSC данни (Domain property `sc-domain:salonapp.pro`). GA4 Data API още не е включен.
- Ключът стои в `C:/Users/Lina/Downloads/` — НИКОГА в git.

### Homepage SEO (същия ден, отделен commit)

Диагноза от GSC: продуктовият сайт получаваше impressions само за brand думи — H1/H2 бяха чисто емоционални, без комерсиални ключови думи. Промени (хибриден подход, запазва продаващия тон):
- **H1** (`components/landing/HeroSection.tsx`): „Твоят салон заслужава повече от тефтер. Собствен сайт и онлайн резервации." (шрифт clamp намален до 3.75rem за по-дългия текст).
- **H2-та** (`app/page.tsx`, `TemplatesSection.tsx`): „управление на салона", „Софтуер за салони...", „Собствен сайт за салон...", „Планове и цени за твоя салон...".
- Нова секция **„по тип салон"** (`#salon-types`) — long-tail (фризьорски/козметично/нокти/барбершоп/масажно/груминг) + вътрешни линкове към блога.
- Structured data вече беше силно (Organization, SoftwareApplication, WebSite, FAQPage, ItemList) — не пипано.

### Следва

- Включване на GA4 Data API + отделна URL-prefix GSC property само за продукта.
- Още блог статии по тип салон.

---

## 2026-07-14 — Демо админ панел (`/demo`) — всичко работи, нищо не се записва

**Контекст:** Клиентите искат да видят панела отвътре, преди да купят. Демото трябва да е интерактивно („наужким да се записват данните“), но без база, без имейли и без боклук в production.

### Как работи

- **`lib/demo/fixture.ts`** — „Студио Демо“: 6 услуги, 2 специалистки, 8 клиентки, работно време, 90 дни история (6 часа делник / 4 в събота), разходи. Генерира се спрямо ДНЕШНАТА дата, за да изглежда живо.
- **`lib/demo/store.tsx`** — `DemoProvider` пач-ва `window.fetch`: всяка заявка към `/api/admin/*` се обслужва локално. Състоянието живее в `sessionStorage` (преживява refresh, изчезва при затваряне на таба). `DemoReady` пуска страниците чак след като салонът е вдигнат **в браузъра** — фикстурата НЕ се рендерира на сървъра, иначе датите щяха да замръзнат от деня на билда и хидратацията да се разминава.
- **`lib/demo/api.ts`** — имитира истинските admin routes 1:1 (същите URL-и, тела и JSON-и), вкл. `generateSlots` за свободните часове, конфликт-проверките при преместване и създаването на клиент от резервация.
- **`app/demo/*`** — тънки страници, които подават данни от стора към **същите** `components/admin/*`. Никакво дублиране на UI.
- Единственият server action (`createAdminBooking` в `QuickBooking`) се подменя през демо контекста.

### Какво пипнах в общите компоненти

- `lib/admin-base-path.ts` — нов хук: компонентите разбират дали са в `/admin` или в `/demo` и линковете им остават в своя раздел (иначе демо посетителят падаше на екрана за вход). Приложен в `AdminChrome`, `CalendarNavClient`, `WeekTimeGrid`, `MonthCalendar` (prop, защото е server компонент), `BlockSlotModal`, `FinancesTabNav`, `SettingsTabNav`, `FinancesDashboard`, `FixedCostsSettingsForm`.
- `SettingsTabNav` — в демото „Лого и снимки“ и „Парола“ са скрити (нямат смисъл без акаунт и сървър).
- `ClientsAdminClient` — CSV експортът в демо се генерира от локалния стор (истинският сочи към `/api/admin/clients/export`).
- Hero-то на landing-а има бутон **„Разгледай админ панела“** → `/demo` (отделно от „Виж демо салон“, който показва публичните сайтове).

### Проверено в браузъра

Бърз час → часът излиза в календара за друг ден и клиентката се създава автоматично; „Явил се“ вдига оборота (55 € → 95 €); услуга се добавя; клиентската карта смята история и оборот; календарът работи в ден/седмица/месец; Калкулаторът е на печалба (+820 €). **Нула мрежови заявки към `/api/admin`** — шимът поглъща всичко. 180/180 теста минават.

### За да знаеш

- `demo` вече беше в `RESERVED_PATHS`, така че не се бърка със салонски slug, а auth guard-ът пази само `/admin` и `/super-admin` — `/demo` е публичен по замисъл (няма какво да се защитава, данни няма).
- Демо салонът е нагласен да е **на печалба** в средата на месеца. Ако намалиш броя резервации на ден във fixture-а, Калкулаторът ще показва загуба (мери оборот от началото на месеца срещу пълните месечни разходи).
- `FinanceAbcSection`, `FinanceSummarySection`, `FinanceReportsSection` се оказаха неизползван код — не са пипани.

---

## 2026-07-10 (част 5) — Пилот: post-visit имейл за отзив (само ats-massage)

**Контекст:** Подарък за пилотния клиент ATS — планът му няма такава функция; тестваме процеса преди да стане платена опция.

- **042_email_logs_review_request_type.sql** (приложена в production): CHECK на `email_logs.type` разширен с `'review_request'`. Dedupe идва наготово от `email_logs_sent_booking_type_uniq`.
- `lib/review-request-pilot.ts`: `REVIEW_REQUEST_PILOT` — map slug → reviewUrl; сега само `ats-massage`. Линкът е българското Google търсене „отзиви за ats studio бургас" (дадено от Поли, изчистено от сесийните токени) — показва бизнес картата с бутон „Напишете отзив". Нов тенант в пилота = един ред тук.
- `emails/ReviewRequest.tsx` + `sendReviewRequestEmail` в `lib/email.tsx` — копи по одобрен от Поли пример, адаптирано за масажи: „Благодарим Ви, че избрахте нас ❤️… след {услугата} сте си тръгнали отпочинали… ⭐ Оставете отзив тук… Сърдечни поздрави, Екипът на {салона}" + unsubscribe. Subject: „Благодарим Ви! Ще ни помогнете ли с един кратък отзив?".
- `app/api/cron/reminders/route.ts`: фаза 2 след напомнянията — **вчерашните** резервации със статус „Яви се" (completed) при пилотните тенанти, с client_email и без unsubscribe. Claim-преди-send (type='review_request'), същият Resend pacing. Ранният return при 0 напомняния е премахнат, за да върви фаза 2; fail-closed dedup 500 за напомнянията е запазен. Отговорът включва review_processed/review_failed/review_date.
- **Кога пристига:** cron-ът е 07:00 UTC → клиентът получава поканата на сутринта след посещението (~10:00 бг време). Праща се само ако собственикът е маркирал „Яви се".
- Бъдеще: per-tenant поле в базата + карта в админа, когато стане платена функция; reviewUrl може да се смени с direct write-review линк (placeid), ако ATS даде Google Business профила си.

---

## 2026-07-10 (част 4) — Имейл до клиента при преместване на час

- `emails/BookingRescheduled.tsx`: нов шаблон в стила на BookingConfirmation — нова дата/час, зачертан стар час, бутон „Добави в Google Calendar", напомняне да изтрие старото събитие от календара си, бутон „Новият час не ми е удобен — откажи" (същият cancel token), unsubscribe.
- `lib/email.tsx`: `sendBookingRescheduledEmail(booking, tenant, old)` — booking е обновеният ред, old е старата дата/час; X-Entity-Ref-ID включва новата дата/час, за да не се сгъва в Gmail нишка при повторно местене.
- `app/api/admin/bookings/[id]/route.ts`: след успешен reschedule PATCH праща имейла (само ако датата/часът реално са се променили и клиентът има имейл); провал на имейла се логва, не проваля преместването.
- Отложено за друг ден: post-visit имейл за отзив (нямаме такава функционалност; нужни са per-tenant Google review URL + тригер при „Яви се").

---

## 2026-07-10 (част 3) — „Премести час" в админ календара

**Контекст:** Клиент на ATS искаше да премести час (18:00 → 15:30 по телефона); дотогава единственият начин беше изтриване + ново създаване.

- `schemas/booking-admin.ts`: `AdminBookingPatchSchema` вече приема или `status`, или `booking_date` + `booking_time` (двете заедно) — refine пази срещу празен PATCH.
- `app/api/admin/bookings/[id]/route.ts`: PATCH с дата+час премества резервацията — преизчислява `booking_end_time` (duration + текущ buffer, clamp 23:59), отказва минала дата и край след полунощ, проверява блокирани интервали (409). Конфликт с друга резервация се хваща от `bookings_no_overlap` (23P01 → 409). Без min-notice ограничения — това е admin действие.
- `components/admin/BookingDetailModal.tsx`: бутон „🕐 Премести" → inline панел с дата/час, inline грешки (не alert). Работи от дневния и седмичния изглед (модалът е общ).
- Клиентът НЕ получава автоматичен имейл при преместване — уговорката е по телефона; ако потрябва, е отделна задача.

---

## 2026-07-10 (част 2) — „Добави в Google Календар" в имейла до собственика при нова резервация

**Контекст:** ATS studio споделя помещение с The Skin и синхронизират заетостта през Google Calendar — собственикът иска с 1 клик да запушва часа в календара от известието.

- `lib/email.tsx`: нова `buildOwnerGoogleCalendarUrl()` (клиентът в заглавието на събитието, телефон/имейл/бележки в details, адресът на салона като location, `ctz=Europe/Sofia`, край = старт + service_duration) + син бутон „📆 Добави в Google Календар" в `sendSalonBookingNotification` (имейлът „Нова резервация" до owner_email). Не пипа Google Calendar интеграционните файлове (Правило 5).
- Важи за всички салони, не само ATS.

---

## 2026-07-10 — ATS studio: скрити слотове за същия ден (min notice 120, невидим в UI)

**Контекст:** Клиент на ATS studio не можеше да запази час в 15:00 около 14:00 — системата показваше слотове чак от 16:15.

### Причина

- `financial_settings.booking_min_notice_minutes` за `ats-massage` беше **120** (2 часа предизвестие за днешния ден) — 14:15 + 120 мин = 16:15, точно каквото се виждаше.
- **UI бъг:** dropdown-ът „Минимално предизвестие" в `components/admin/MinNoticeCard.tsx` (админ → Календар) имаше само опции 0/15/30/60. При value=120 React select не match-ва опция и браузърът показва първата — „Без ограничение". Салонът виждаше „без ограничение", а реално действаха 2 часа.
- Откъде е 120: не може през UI (нямаше такава опция); API схемата (`schemas/financial-admin.ts`) приема до 240 — влязло е ръчно или през стара форма.

### Какво направих

1. **Данни (production):** `booking_min_notice_minutes` → 30 за `ats-massage`. Проверени всички тенанти — никой друг няма стойност извън {0,15,30,60}.
2. **UI фикс:** `MinNoticeCard.tsx` — добавена опция „2 часа напред" (120) + динамична опция „X минути напред (текуща настройка)", ако стойността в базата не е сред стандартните. Така реалната стойност винаги се вижда.

## 2026-07-08 (част 2) — Пълен одит на живата база + per-tenant бекъпи + анти double-booking

**Контекст:** Поли поиска пълен преглед преди onboarding на клиенти + бекъпи на резервации/клиенти per tenant с възможност за възстановяване.

### Открит сериозен schema drift (production ≠ migrations!)

Production `bookings` НИКОГА не е бил създаван от `001_initial_schema.sql`:
- `booking_time` беше **TEXT** (не time); `booking_end_time` **изобщо липсваше** → всеки insert падаше веднъж (42703) и минаваше през legacy fallback без края на часа
- hair CHECK-овете бяха с **БЪЛГАРСКИ** стойности (`'къса','средна','дълга'`), кодът пише английски → всеки insert с hair параметри падаше и се retry-ваше БЕЗ тях (тихо губене на данни)
- **`bookings_no_overlap` exclusion constraint НЕ съществуваше** — кодът обработва 23P01, но базата никога не го е хвърляла → реална race възможност за двойни резервации
- Индексите от 001 (salon_slug+date, specialist, status) също липсваха
- `specialist_id` е TEXT (не uuid, без FK) — оставен така (кодът работи, конверсията е излишен риск)

### Приложени миграции (директно в production, всички верифицирани)

1. **039_tenant_backups.sql** — `tenant_backups` таблица (RLS on, без политики = само service role) + `create_tenant_backup()` / `run_tenant_backups()` / `restore_tenant_backup()` + **pg_cron job** `tenant-backups-daily` (01:30 UTC = 04:30 BG, не зависи от Vercel cron лимити). Бекъпва per tenant: bookings, clients, services, specialists, working_hours, blocked_slots, financial_settings + tenants реда (reference). Retention: cron 35 дни, ръчни 180 дни. Бекъпите нямат FK към tenants — оцеляват изтриване на тенант.
2. **040_bookings_schema_hardening.sql** — booking_time text→time; booking_end_time добавена + backfill (duration+буфер, clamp 23:59:59); hair CHECK → английски; **bookings_no_overlap** exclusion constraint (btree_gist, интервалът на услугата, WHERE status not in cancelled/no_show); липсващите индекси. Проверено преди apply: 0 текущи припокривания, всички времена се парсват.
3. **041_lock_set_tenant_rpc.sql** — revoke execute на SECURITY DEFINER `set_tenant()` от anon/authenticated (кодът не я ползва никъде; legacy "Tenant isolation" политиките стъпват на нея).

### Верификация (всичко срещу production)

- Първи бекъп на всичките 9 тенанта: `run_tenant_backups()` → done 9, failed 0 (44 bookings/28 clients съвпадат)
- Restore merge: тест на linabambina — създаден клиент+услуга → бекъп → изтрити → restore → възстановени (inserted 1+1); replace режим също тестван; тестовите данни изчистени
- Двойна резервация: insert върху зает час → **23P01 bookings_no_overlap** ✓ (кодът вече връща "Този час току-що беше зает")
- Hair values: insert с 'long'/'thick' минава ✓
- Live smoke: `paw-empire.salonapp.pro/api/availability` за 2026-07-22 — заетият 13:45–15:45 коректно изключен от слотовете след type промяната
- `tsc` чист, `npm test` 180/180, lint чист, service-role boundary pass

### Нов код (супер-админ бекъп UI)

- `app/super-admin/actions.ts`: `createTenantBackupAction` (ръчен бекъп), `restoreTenantBackupAction` (merge/replace; преди replace прави автоматичен предпазен бекъп на текущото състояние)
- `app/super-admin/[salon_slug]/page.tsx`: секция "🗄️ Бекъпи" — списък, "Бекъп сега", "Възстанови липсващи" (merge), "Пълно възстановяване" (replace, с confirm), "⬇ JSON" download
- `app/api/super-admin/backups/[id]/route.ts`: JSON download (offline копие извън Supabase)
- `lib/internal/tenant-backups.ts`: list/get (service-role boundary allowlist през lib/internal/)
- `lib/booking-mutations.ts`: clamp на booking_end_time до 23:59 при буфер през полунощ (иначе 22007 върху реалната time колона)
- `app/super-admin/[salon_slug]/restore-backup-button.tsx`: confirm бутон

### Други находки от одита (БЕЗ действие — за преценка от Лина)

1. 🟠 **`salonapp_posts`** (36 реда, social post scheduler, НЕ е в repo-то/миграциите) — има `anon_select`/`anon_update USING(true)` политики → всеки с публичния anon ключ може да пренаписва съдържанието на планираните постове. Вероятно външна автоматизация (n8n/Make?) я ползва с anon ключа — НЕ пипано, за да не се счупи. Препоръка: автоматизацията да мине на service key и политиките да се дропнат.
2. 🟡 `leads` има `leads_anon_insert WITH CHECK (true)` — кодът пише през service role; политиката е вероятно легитимна за някаква външна форма, оставена.
3. 🟡 **Billing:** `thebeast` е active без expiry/grace — никога няма да се деактивира от cron-а (умишлено?). `euphoria` изтича **2026-07-10** (grace до 10-11). `lindynails` е trial от 04-10 с изтекъл grace 05-14 — trial статусът не се гони от billing-expiry cron-а (той гледа само active).
4. 🟡 Supabase Auth: **Leaked password protection е ИЗКЛЮЧЕНА** — включва се с 1 клик в Dashboard → Auth → Providers (HaveIBeenPwned проверка).
5. ℹ️ Advisors: `pg_net` extension в public schema; gallery bucket позволява listing; redundant RLS политики (познати, cosmetic).
6. ℹ️ Migrations 037+038 СА приложени в production (потвърдено в migration history) — чакащата ръчна стъпка от 2026-07-07 е изпълнена.

**Branch:** `feature/tenant-backups-hardening`

---

## 2026-07-08 — ATS Studio: hero polish (шрифтове, отстояния, плаващи chips)

**Контекст:** Поли поиска: (1) да махна eyebrow реда „Терапевтичен масаж · Бургас"; (2) по-малки отстояния между секциите; (3) шрифтове в стила на логото; (4) на широки десктоп монитори hero-то има много празен фон вдясно, а текстът остава долу — да „изкачат" болки отстрани.

**Промени (`components/tenants/ats-massage/Page.tsx`), branch `feat/ats-hero-polish`:**
1. Премахнат `<p className="ats-hero-eyebrow">`.
2. Шрифтове: `--f-serif: 'Cormorant Garamond' → 'Playfair Display'`, `--f-sans: 'Outfit' → 'Montserrat'`. **Важно:** логото е Cinzel-стил (Trajan caps), но **Cinzel е само латиница** → не става за кирилския текст; Playfair Display е класически висок-контраст serif С кирилица, в духа на логото. И двата вече са в шрифт линка на `app/(public)/[salon_slug]/page.tsx`.
3. Свити section paddings: `clamp(5,10vw,8)→clamp(3.2,6vw,5)`, `clamp(4.5,9vw,7)→clamp(3,5.5vw,4.5)`, services `7.5→4.75`.
4. Нови плаващи chips вдясно в hero-то (`.ats-hero-chips`/`.ats-hero-chip`): 5 състояния, glass + gold точка, staggered, лек float (off при `prefers-reduced-motion`). `display:none` под 1120px — само десктоп, да запълнят празния фон.

**Верификация:** `tsc` чист, lint чист. Локален preview на tenant страницата НЕ е възможен (няма `.env.local` service key) → визуална проверка на живо след deploy.

---

## 2026-07-08 — ATS Studio: ново лого (бяло на прозрачен фон)

**Контекст:** Поли поиска да смени логото на ATS Studio с новото бяло лого на прозрачен фон (`C:\Users\Lina\Downloads\Нова папка\logo.png`, 500×500 RGBA).

**Промени (branch `fix/hero-about-settings`):**
1. Нов bundled asset `public/tenants/ats-massage/logo.webp` — конвертиран от PNG през `sharp` (39 KB, запазена прозрачност). Same-origin → минава production CSP, като hero-то.
2. `components/tenants/ats-massage/Page.tsx`:
   - Нов `DEFAULT_LOGO = "/tenants/ats-massage/logo.webp"` (до `DEFAULT_HERO`)
   - `const logo = tenant.logo_url?.trim() || DEFAULT_LOGO;` — fallback, същият паттерн като hero-то
3. **Production DB:** `update tenants set logo_url = null where salon_slug = 'ats-massage'` — старото лого сочеше към `gallery/ats-massage/settings/...webp` в storage и печелеше над fallback-а. С null-натото поле сега се ползва новото bundled лого. (Owner-ът може по-късно да качи друго от админ настройките — то пак ще override-не.)

**Защо бялото лого пасва:** `.ats-nav` е винаги на тъмен фон — прозрачно върху тъмния hero отгоре, `rgba(15,35,67,.96)` (midnight) при scroll. Бяло лого е четимо и в двете състояния.

**Верификация:** `npx tsc --noEmit` чист. Статичният asset се сервира локално (`GET /tenants/ats-massage/logo.webp → 200, image/webp, 39202 B`). Пълен рендер на tenant страницата локално НЕ е възможен — няма `.env.local` със Supabase ключове на тази машина (500 „Липсват NEXT_PUBLIC_SUPABASE_URL/SERVICE_ROLE_KEY"); визуалната проверка е след deploy на Vercel.

---

## 2026-07-07 — Fix: консуматорите на подписаната impersonation бисквитка (регресия от M4)

**Контекст:** Поли прати screenshot — банерът „Супер-админ режим“ показва суровата бисквитка (`linabambina.19c9…`) вместо slug-а. Screenshot-ът същевременно потвърди, че `IMPERSONATION_HMAC_SECRET` е зададен във Vercel и impersonation работи (чакащата ръчна стъпка №1 е изпълнена). Root cause: M4 подписа бисквитката (`slug.hmac`), но 3 консуматора още очакваха гол slug.

**Фиксове (branch `fix/impersonation-signed-cookie-consumers`):**
1. `app/admin/(protected)/layout.tsx` — банерът ползва `readSuperAdminSalonCookieSlug()` (верифициран slug), не raw cookie
2. `app/api/super-admin/tenant/slug/route.ts` — при rename: `verifyImpersonationSlug()` за сравнението + `signImpersonationSlug(newSlug)` при запис (иначе сравнението никога не match-ва, а неподписана нова стойност би била отхвърлена от fail-closed verify → загубен контекст след rename)
3. `lib/routing/impersonation.ts` — `getImpersonatedSlug()` парсва slug частта от `slug.hmac` (header hint-ът в middleware беше тихо изчезнал). Edge runtime няма node:crypto → БЕЗ криптографска проверка там; границата на доверие остава `verifyImpersonationSlug` + cross-check в `requireAdminTenantSlugForApi` (форгната бисквитка → 401/403 на API слоя). Приема и legacy гол slug.

**Тестове:** нов `tests/impersonation-cookie-consumers.test.ts` — подписан/legacy формат, консистентност middleware hint ↔ сървърен verify, банер контракт. `npm test` → 180/180, tsc/lint/service-role boundary чисти. Preview verify не е възможен локално (иска super-admin сесия + секрета) — верификацията е през unit тестовете; Поли да потвърди визуално след deploy.

**Оставаща ръчна стъпка (Лина):** само migration 037 (+038 no-op) в production Supabase — backup + off-peak.

---

## 2026-07-07 — Одит fix пакет: M1+M2, A1+A3 двойни reminder имейли, A2 Resend throttle/retry

**Контекст:** Продължение по P1 находките от одитите 2026-07-06. Branch: `claude/project-audit-bugs-9nggk1` (3 commits).

**M1 (.gitignore):** `.env*` изцяло игнорирани (беше само `.env*.local`/`.env.vercel*` — гол `.env` можеше да се commit-не); `!.env.example`/`!.env.local.example` остават track-нати. Проверено с `git check-ignore`.

**M2 (npm audit):** `npm audit fix` затвори `ws` (high — memory disclosure/DoS) и `qs` (moderate — DoS). Остават 23 moderate, всичките през `next`/`@sentry/nextjs` — искат breaking major upgrade, отделна задача.

**A1+A3 (двойни reminder имейли), `app/api/cron/reminders/route.ts`:**
- Dedup заявката вече проверява `error` → при DB грешка връща 500 и НЕ праща нищо (преди: празен Set → повторни имейли за всички)
- **Claim-преди-send:** insert на `email_logs` ред със `status='sent'` ПРЕДИ изпращане; при `23505` (паралелен run е взел claim-а) → skip; при провалено изпращане claim-ът се освобождава (`status='failed'`) → следващ опит е възможен
- `sendReminderEmail` (lib/email.tsx) връща `boolean` и вече не логва — логът е claim-ът; единственият caller е cron route-ът
- **Migration `037_email_logs_sent_unique.sql`:** дедуп на съществуващи двойни 'sent' записи (пази най-ранния) + частичен уникален индекс `email_logs(booking_id,type) WHERE status='sent' AND booking_id IS NOT NULL`. ⚠️ **НЕ е приложена в production** — иска backup + off-peak прозорец (checklist в migration skill-а). Кодът е безопасен и без индекса (pre-filter dedup пази); индексът добавя атомарната гаранция срещу паралелни runs.

**A2 (Resend throttle/retry), `lib/email.tsx` + route:**
- `sendResendHtml`: до 3 опита с backoff (1s/2s, respect-ва `retry-after`) при 429/5xx/мрежова грешка; други 4xx = перманентни, без retry. Ползва се от ВСИЧКИ имейли (confirmation, reminder, салонски нотификации)
- Reminders route: `CONCURRENCY 10 → 2` + мин. 1.1s между батчовете (Resend лимит 2 req/s); `maxDuration = 300` (cron-ът е 1×дневно 07:00 UTC — провал в run-а иначе не се повтаря никога)

**Тестове:** нов `tests/cron-reminders-dedup.test.ts` — 5 теста през fetch mock на PostgREST/Resend (fail-closed 500, claim conflict skip, освобождаване на claim, retry след 5xx, 401 без cron secret); stub-ове за Next `unstable_cache` (`__incrementalCache` + `AsyncLocalStorage` polyfill). `npm test` → 175 tests, 173 pass, 0 fail, 2 todo (M4, C1). `tsc` чист, lint чист (1 pre-existing warning), service-role boundary pass.

**Следващи от списъка:** A5 unsubscribe на GET, C1 миграция `tenants_plan_check`, D1 `listUsers()` пагинация, M4 `IMPERSONATION_HMAC_SECRET` fail-closed.

---

## 2026-07-07 (част 2) — Одит fix пакет №2: C1, M4, D1, A5 — целият P1 списък от одитите е затворен

**Контекст:** Останалите 4 находки от одитите 2026-07-06. Branch: `claude/project-audit-bugs-9nggk1`. С това ВСИЧКИ отворени P1 находки от одитите са затворени.

**C1 (`tenants_plan_check`):** migration `038_fix_tenants_plan_check.sql` — DROP + ADD constraint (starter/standard/pro/premium) + защитен remap `collective→premium`. Идемпотентна спрямо production (constraint-ът там вече е поправен ръчно). Todo тестът в `plan-consistency.test.ts` е реален pass.

**M4 (impersonation fail-closed), `lib/admin-tenant.ts`:**
- `verifyImpersonationSlug` без секрет → `null` за всичко (преди: приемаше неподписан slug)
- `signImpersonationSlug` без секрет → хвърля ясна грешка (вместо тихо да сложи неверифицируема бисквитка)
- Секретът добавен в `.env.example`/`.env.local.example`
- ⚠️ **ПРЕДИ deploy: задай `IMPERSONATION_HMAC_SECRET` във Vercel production env** (и в `.env.local` за локална работа) — иначе super-admin impersonation спира да работи. Todo тестът е реален pass.

**D1 (`listUsers` пагинация), `app/super-admin/actions.ts`:** нов `findAuthUserByEmail()` — обхожда всички страници (1000/стр.; default-ът 50 пропускаше потребители след 50-ия) при `sendCredentialsAction` и tenant delete. Auth cleanup при изтриване е в try/catch (реален best-effort — тенантът вече е изтрит).

**A5 (unsubscribe на GET), `app/api/unsubscribe/route.ts`:** GET вече само рендерира потвърждаваща страница с бутон; отписването е на POST (имейл скенери следват GET линкове и отписваха клиенти). `List-Unsubscribe-Post: List-Unsubscribe=One-Click` (RFC 8058) добавен в confirmation имейла — мейл клиентите с вграден unsubscribe пращат POST. Integration тестовете (400/404 на GET) остават валидни.

**Верификация:** `npm test` → 175 tests, **175 pass, 0 fail, 0 todo** (двата одитни todo теста са реални pass). `tsc` чист, lint чист (1 pre-existing warning), service-role boundary pass.

**Чакащи ръчни стъпки (Лина):**
1. `IMPERSONATION_HMAC_SECRET` във Vercel production env — ПРЕДИ deploy на този branch
2. Migration 037 + 038 в production Supabase (037 е новата; 038 е no-op там, но я мини за консистентност) — след backup, off-peak

---

## 2026-07-06 — QuickBooking: телефон autocomplete, имейл правила, клиентска дедупликация (fix пакет №1+№2 от одита)

**Контекст:** Одит 2026-07-06 + изисквания на Поли: (1) бързият букинг да разпознава клиент още при писане на телефона; (2) имейлът е задължителен на публичните сайтове, опционален в админа; (3) никакви дублирани клиенти.

**Схеми (`schemas/booking.ts`):**
- `CreateBookingSchema` (публична): `client_email` **задължителен** (Zod `z.email()`, не "няколко букви"); `booking_date`/`booking_time` с regex + реална календарна валидация (одит B3 — todo тестът стана зелен); max дължини на име/бележки
- Нова `AdminCreateBookingSchema`: телефон и имейл опционални (walk-in); празен низ → undefined

**Admin booking (`app/actions/admin-booking.ts` + `lib/booking-mutations.ts`):**
- `allowEmptyPhone` (само админ): без телефон → `client_phone=""` и **не** се създава клиентски запис (няма ключ за дедуп → няма фантоми; старият `anon-uuid` падаше на схемата и правеше записа без телефон невъзможен)
- `minNoticeMinutes: 0` за админ — walk-in "сега" вече е възможен (публичното предизвестие остава)

**Дедупликация (`lib/tenant-db.ts`):**
- `upsertByPhone`: премахнат fallback `"00000"` (одит B7); **недеструктивен** update — резервация без имейл вече НЕ трие имейла на клиента; празно име не презаписва
- Нов `clients.searchSuggest(term, phoneVariants)` за autocomplete

**QuickBooking UI (`components/admin/QuickBooking.tsx`):**
- Autocomplete и по телефон (≥3 цифри, debounce 220ms) — сървърът генерира вариантите `0888…` ⇄ `+359888…` (`app/api/admin/clients/search`), защото клиентите са записани нормализирано
- Избор от списъка попълва име+телефон+имейл; hint под празен имейл ("няма да получи потвърждение")

**Admin slots (`app/api/admin/slots/route.ts`):** буферът вече е от настройките (беше 0) — админът вижда само слотове, които записът реално приема (одит: разминаване UI ↔ сървър)

**Публични форми:** имейл задължителен + `isLikelyValidEmail` (нов в `lib/email-typo.ts`) в `BookingFlow`/`StepContact`, `InlineBookingForm`, `BookingCalendar`

**Тестове:** `booking-schema.test.ts` обновен (публичен имейл задължителен; нови admin-schema тестове; B3 todo → реален pass); integration booking payload-ите вече пращат `client_email` (иначе падат на схемата преди tenant проверките). `npm test` → 170 tests, 168 pass, 0 fail, 2 todo (M4, C1). `tsc` чист, lint чист, service-role boundary pass.

**Branch:** `fix/quick-booking-client-dedup-email`

---

## 2026-07-06 — Регресионни тестове по одитите (bookings / payments / calendar / auth)

**Контекст:** Два одита от 2026-07-06 (пълен codebase одит + `SECURITY_AUDIT_2026-07-06.md`). Целта: тестове, които се пускат преди всяко deploy (`npm test` + `npm run test:integration`), за да не регресират критичните пътища.

**Нови unit тестове (`tests/`):**
- `booking-schema.test.ts` — CreateBookingSchema/UpdateBookingStatusSchema guard-ове; документира, че телефон без цифри минава схемата (пази се от digit-guard в мутацията); `todo`: формат-валидация на дата/час (одит B3)
- `scheduling-conflicts.test.ts` — `booking_end_time` има превес над duration+buffer (одит B1), сливане на застъпени интервали, plan gating на `generateParallelSlots` (starter/legacy `collective` → без паралелен прозорец)
- `booking-datetime.test.ts` — Europe/Sofia конверсии (лятно/зимно време), календарна аритметика през DST, 24ч граница за отказ
- `admin-impersonation.test.ts` — HMAC sign/verify на super-admin cookie (tamper, чужд секрет, невалиден slug); `todo`: fail-closed без секрет (security одит M4)
- `stripe-webhook-auth.test.ts` — вика реалния `POST` handler: липсващ secret → 500, липсващ/фалшив/чужд подпис → 400, валиден подпис минава и спира на DB слоя (без мрежа)
- `plan-consistency.test.ts` — код ↔ схеми ↔ миграции за plan стойностите; `todo`: липсващата миграция за `tenants_plan_check` (одит C1)
- `booking-mutations-unit.test.ts` — `normalizeTimeForDb` + import-sanity на booking мутациите

**Нови integration тестове (`tests/integration/`), верифицирани срещу production (32/32 pass):**
- `booking-guards.test.ts` — tenant mismatch 403, missing context 400, digit guard, минала дата, несъществуваща услуга, availability shape/дедупликация (read-only, не създава резервации)
- `auth-guards.test.ts` — 8 admin endpoint-а без сесия → 401; ГРЕШЕН cron Bearer → 401; confirm/cancel/unsubscribe с фалшиви токени → 400/404
- `stripe-webhook-security.test.ts` — live webhook отхвърля всичко без валиден подпис
- `booking-race.test.ts` — **opt-in** (`INTEGRATION_ALLOW_BOOKING_WRITES=1` + service role env): 2 паралелни POST-а за един слот → точно 1 успех + 1×409 (exclusion constraint); double-booking след успех → 409; чисти след себе си. Пускай само срещу тестов тенант (праща реален имейл до owner-а).

**Важни уроци от verify срещу production:**
- Zod 4 валидира UUID version/variant битове — all-zero „фалшив“ UUID пада на схемата, не на бизнес слоя; тестовите UUID-та са валидни v4 по формат
- `/api/admin/clients` и `/api/super-admin/tenants` са POST-only (GET → 405)

**Резултат:** `npm test` → 169 tests, 166 pass, 3 todo (документирани одит находки B3/M4/C1 — стават зелени при фикс), exit 0. `npx tsc --noEmit` чист. Google Calendar sync НЕ е покрит — код за него няма в repo-то (одит F3), файловете от Правило 5 не съществуват.

**Branch:** `feature/audit-regression-tests`

---

## 2026-06-16 — Phone lookup masking + CI integration enforcement

**Контекст:** От `MASTER_AUDIT_REPORT.md` оставаха 2 security items — public `/api/clients/lookup` връщаше пълен имейл при hit; integration tests в CI се skip-ваха без secrets.

**Fix 1 — Lookup masking:**
- Нов `lib/mask-pii.ts` → `maskEmailForPublicHint()` (маскира local + domain част)
- `app/api/clients/lookup/route.ts` вече връща `{ name, email_hint }` — **без** raw `email`
- `BookingFlow` / `StepContact` — autofill само на **име**; masked hint като UX съобщение
- Unit tests: `tests/mask-pii.test.ts`

**Fix 2 — CI integration tests:**
- `scripts/run-integration-tests.mjs` — в CI (`GITHUB_ACTIONS` / `INTEGRATION_REQUIRED=1`) **fail** ако липсват base env vars (не silent skip)
- `.github/workflows/ci.yml` — `INTEGRATION_REQUIRED: "1"`
- Bugfix: `host-bound-public-api-enforcement.test.ts` clients lookup → **GET** с query params (беше грешен POST)

**Branch:** `feature/lookup-mask-integration-ci`

**Fix 3 — CI unit test glob (Linux):**
- `scripts/run-unit-tests.mjs` — explicit file list вместо `tests/*.test.ts` glob (fail-ваше в GitHub Actions)
- `package.json` → `"test": "node scripts/run-unit-tests.mjs"`

**Fix 4 — CI integration auto-hydrate + GitHub secrets:**
- `scripts/integration-env-hydrate.mjs` — от Supabase service role: tenant slugs, client/booking IDs, CI admin user JWT
- `scripts/bootstrap-github-integration-secrets.mjs` — еднократно push на secrets от `.env.local` via `gh secret set`
- `ci.yml` — `INTEGRATION_SUPABASE_SERVICE_ROLE_KEY` + `INTEGRATION_CI_USER_PASSWORD`; bearer/JWT се генерират в CI run
- GitHub secrets зададени на `salonapppro-spec/salonapp` (2026-06-16)

**Merge:** PR #65 merge-нат в `main` (2026-06-16). Branch protection: `build` check задължителен.

---

## 2026-06-16 — TheBeast contrast fix + BookingFlow standardization (4 сайта)

**Контекст:** Лина пратила screenshot на `thebeast` booking стъпка 5/6 — текст почти невидим (тъмен текст на тъмен фон).

**Fix 1 — TheBeastSite contrast:** `.tb-booking-frame` (wrapper около shared `BookingFlow` компонента в `components/tenants/TheBeastSite.tsx`) нямаше зададен `background` — наследяваше черния фон на секцията. `BookingFlow.tsx` ползва тъмносив текст (`text-neutral-900` и т.н.), писан за светла тема. Fix: `background: var(--beast-cream)` + `border-radius` на самата рамка (без да се пипа shared компонента, ползван от други тенанти със светли теми). Верифицирано визуално през preview — текстът се чете перфектно, пасва на black/gold/cream естетиката.

**Fix 2 — BookingFlow standardization (от TODO):** След обяснение на разликата между двата booking механизма (`BookingFlow` server action vs директен `fetch('/api/bookings')`), потребителят поиска унификация. Мигрирани `InlineBookingForm.tsx` (paw-empire) и `BookingCalendar.tsx` (magnetic-eyes, lindynails, euphoria) от `fetch('/api/bookings', {method:'POST'})` към `createBooking()` server action — само submit логиката, без UI/CSS промени, без пипане на slot-fetching GET заявката.

**Verification — пълен end-to-end тест на всичките 4 сайта чрез preview:**
- `paw-empire` (InlineBookingForm): пълен flow (избор услуга → дата → час → данни → submit) → реален booking създаден в production DB (`success:true, booking_id:...`) → изтрит след проверка
- `magnetic-eyes` (BookingCalendar): същото, отделен реален booking създаден и изтрит
- `lindynails`, `euphoria` (BookingCalendar, светли теми): визуална проверка — perfect contrast, без console грешки

`tsc --noEmit`, `npm run test` (84/84), `npm run lint` — всички минават. И двата fix-а merge-нати в `main` (commits `3490362`, `c65ce85`).

---

## 2026-06-16 — PR #63 (Section A hardening) review + merge

**Контекст:** Лина/Cursor разработиха PR #63 (`feature/security-section-a-hardening`) паралелно — RBAC capabilities, confirm/cancel `?salon=` IDOR fix, finance scope fix, admin middleware guard, migration 035. Поискан пълен code review преди merge заради разминаващ се "progress audit" доклад.

**Какво проверих ред по ред:**
- `lib/admin-rbac.ts` — capability модел (owner/technical_admin пълен достъп, specialist_staff само `clients_write`+`schedule_write`) — коректно
- `app/api/confirm/[token]/route.ts`, `app/api/cancel/[token]/route.ts` — потвърдено: запазват atomic conditional UPDATE паттерна от по-ранния P0 sprint, добавят `salon_slug` scope отгоре (IDOR fix) — добра еволюция, не регресия
- `lib/admin-finance-scope.ts` — важен fix: премахнат `user_metadata.specialist_id` fallback (client-settable от самия потребител през Supabase Auth SDK — privilege escalation risk); сега само `app_metadata`
- `lib/email.tsx` — confirm/cancel линкове в reminder имейли вече носят `?salon=`; потвърдих няма други stale референции без него
- Всичките 18 admin API routes — консистентен паттерн: GET (read) = `requireAdminTenantSlugForApi()`, write = `requireAdminCapabilityForApi(capability)`
- Migration 034 + 035 — **потвърдено реално приложени в production** (директна SQL проверка): RLS policies, `bookings_public_insert`/`specialists_public_read` premahнати, `design_tokens` колона, `tenant_google_integrations` таблица
- `middleware.ts` Step 10 (silent fail fix) — вече merge-нат по-рано (PR #61), потвърден правилен

**Намерени и поправени 2 реални проблема (преди merge):**
1. 🔴 **`npm run check:service-role-boundary` щеше да fail-не CI** — нов shared helper `lib/booking-token-action.ts` не беше в allowlist-а, въпреки че routes-ите, от които е extracted (`confirm/[token]`, `cancel/[token]`) вече са. Добавен в `ALLOWED_EXACT`.
2. 🟡 Dead import (`requireAdminTenantSlugForApi`) в `app/api/admin/clients/route.ts`, останал след RBAC рефакторинга — премахнат.

**Дребна находка, без действие:** `tenant_activity_logs`/`tenant_call_tasks`/`lead_call_tasks` имат по 2-3 редундантни super_admin policies (стари + от migration 034) — функционално безвредно (multiple permissive policies просто се OR-ват), само cosmetic cleanup за по-късно.

**Merge:** Fast-forward в `main` (`eb7c23a`), PR #63 автоматично маркиран MERGED от GitHub. Verification: `tsc --noEmit`, `npm run test` (84/84), `npm run lint`, `npm run check:service-role-boundary` — всички минават.

---

## 2026-06-15 — Security Section A hardening (audit comparison)

**Branch:** `feature/security-section-a-hardening` — pushed, **PR #63** (чака merge → Vercel)

### Какво е направено

| ID | Задача | Статус |
|----|--------|--------|
| A1 | Backend RBAC (`owner` / `technical_admin` / `specialist_staff`) на admin write API | ✅ |
| A2 | Finance scope — `specialist_id` само от `app_metadata` (не `user_metadata`) | ✅ |
| A3 | Confirm/cancel линкове — задължителен `?salon=` + lookup по slug+token | ✅ (breaking за стари имейли) |
| A4 | Премахнат `debugDbErrors: true` от admin booking | ✅ |
| A5 | Admin middleware — не само session, изисква salon admin access | ✅ |
| A6 | `googleIntegration.listActive()` без slug | ⏭ пропуснато (Правило 5) |
| A7 | `page_events` anon INSERT | ✅ migration `035` — **applied в Supabase (Лина)** |
| A8 | Schema drift: `design_tokens`, `tenant_google_integrations` | ✅ migration `035` — **applied в Supabase (Лина)** |

**Нови файлове:** `lib/admin-rbac.ts`, `lib/booking-token-action.ts`, `supabase/migrations/035_security_section_a_hardening.sql`

**RBAC capabilities:** `settings_write`, `finances_write`, `clients_export`, `specialists_manage`, `services_write`, `gallery_write`, `clients_write`, `schedule_write` — specialist_staff получава само последните две.

**Засегнати API:** settings, working-hours, upload, financial-settings, expenses, clients (+ export, GDPR delete), specialists, services, gallery (+ upload/reorder/[id]), bookings, blocked-slots; server action `createAdminBooking` → `schedule_write`.

**Verification:** `npx tsc --noEmit`.

**След deploy на код:** тествай confirm/cancel с `?salon=`; admin owner login нормален достъп. Migration `035` — applied в Supabase.

---

## 2026-06-16 — Gmail: потвърдителен имейл — пълна видимост

**Branch:** `feature/email-gmail-full-visibility`

Gmail сгъваше Calendar/контакти/отписване при повторни тестове с един subject (threading). Fix:

1. **Уникален subject** — дата + час + салон (`lib/email.tsx`)
2. **Уникален HTML ref** — `messageRef={booking.id}` + preview с дата/час (`emails/BookingConfirmation.tsx`)
3. **Layout** — контакти в бяла карта, без `<Hr>` преди footer (по-малко „quoted text“)
4. **Headers** — `X-Entity-Ref-ID`, `List-Unsubscribe`
5. **Дата в имейла** — `d MMMM yyyy` вместо ISO `2026-06-17`

**Verification:** `npx tsc --noEmit`.

---

**Branch:** `feature/migration-034-rls-sync`

1. **`034_sync_production_rls.sql`** — документира production security state в repo migrations:
   - RLS + `super_admin` policies на `tenant_activity_logs`, `tenant_call_tasks`, `lead_call_tasks`
   - `DROP bookings_public_insert` (sync с production — anon INSERT блокиран)
   - `DROP specialists_public_read` (публичните сайтове четат specialists през server/service role, не anon PostgREST)
2. **Unsubscribe IDOR fix** — линкът в имейла вече включва `salon=`; route валидира `salon_slug + booking_id + token` и scoped UPDATE
3. **Middleware** — при липсващ Supabase env на tenant subdomain/custom domain → `/temporarily-unavailable` вместо silent passthrough

**След deploy на код:** пусни migration `034` в Supabase SQL Editor (idempotent, no-op ако production вече е sync-нат).

**Verification:** `npx tsc --noEmit`, `npm run test` (84/84).

---

## 2026-06-16 — P1 sprint (6/8 от security audit, 2 умишлено пропуснати)

Продължение на P0 sprint-а по-долу, същата сесия. Branch-workflow: всяка задача отделен branch → tsc/test/lint/boundary check → fast-forward merge в `main` → push → branch delete.

1. **Specialist active validation** — `lib/tenant-db.ts` `specialists.getById()` сега включва `is_active`; `runCreateBooking` отказва при неактивен/несъществуващ специалист (защитава и срещу crafted requests, и срещу легитимен случай: admin деактивира специалист, чиято услуга все още го реферира)
2. **`bookings_public_insert` RLS** — проверка показа policy-то вече не съществува в production (вероятно изтрито при прехода `user_metadata`→`app_metadata`, никога пресъздадено) → anon INSERT е напълно блокиран от RLS. По-сигурно от очакваното, без действие.
3. **Complex услуги hair params** — 0 complex услуги в production в момента (проверено), но fix-нато превентивно: `Math.max(duration_minutes, calculateDuration(service,"long","thick"))` вместо суров `duration_minutes` при липсващи/невалидни hair params
4. **GDPR delete-request persistence** — нов `lib/internal/gdpr-deletion-requests.ts`; route вече пише в `gdpr_deletion_requests` (таблицата вече съществуваше от migration 020, просто никой не пишеше в нея) преди да изпрати email
5. **Super-admin Zod schema** — `UpdateTenantBasicsSchema` в `schemas/tenant.ts`, заменя manual Set-based guards в `updateTenantBasics`; останалите FormData actions имат само 1-2 прости поля, по-нисък риск, оставени за по-късно
6. **Phone enumeration** — нов `clientsLookupPerPhone` policy (5/10мин) в `lib/rate-limit-policies.ts`, прилаган в `/api/clients/lookup` keyed by `salon_slug + normalizePhone(phone)`, върху съществуващия per-IP лимит

**Съзнателно пропуснати:**
- `googleIntegration.listActive()` — изисква Правило 5 разрешение (Google Calendar), не дадено
- Standardize tenant sites на `BookingFlow` (4 сайта: paw-empire, magnetic-eyes, lindy, euphoria) — root cause вече фикснат на middleware ниво (виж P0 sprint #7 по-долу); самият рефакторинг е инвазивен за живи тенанти без visual QA достъп оттук, оставен за отделен sprint

**Verification:** `tsc --noEmit`, `npm run test` (84/84), `npm run lint`, `npm run check:service-role-boundary` — всички минават след всеки от 6-те fix-а.

---

## 2026-06-16 — Security/database audit fix sprint (10 P0 + 5 follow-up)

**Контекст:** Сравнени два независими одита (Claude 12.06 + Cursor 15.06), кръстосани с реалния production DB/код (не само migration файлове), и систематично fix-нати всичките открити проблеми.

**Backup преди всичко:** git tag `backup-pre-audit-fixes-2026-06-16` (push-нат на GitHub) + пълен `pg_dump` на production база в `backups/` (локално, в `.gitignore`, никога не commit-ва се — съдържа PII).

### Какво е направено (всичко merge-нато в `main`, push-нато, deploy-нато)

1. **RLS на `tenant_activity_logs`/`tenant_call_tasks`/`lead_call_tasks`** — оказа се вече оправено в production (одитите четяха само .sql файлове, не живата база)
2. **`specialists_public_read` cross-tenant leak** — вече оправено в production
3. **Migration 026** — грешна таблица (`leads` вместо `platform_leads`); + `platform_leads_plan_check` constraint никога не бил обновен да позволява `'starter'` — нов bug, открит и поправен (corrective migration 032, applied директно в production)
4. **Stripe webhook** — `DELETE` на failed event → `UPDATE status='failed'` (запазва audit trail); `shortenGrace()` при `payment_failed` (7 дни) и `subscription.deleted` (3 дни) вместо да чака пълните 30 дни grace
5. **Confirm/cancel token reuse** — atomic conditional UPDATE вместо SELECT-then-UPDATE; вече не може token да presъздаде `confirmed`/`completed` статус
6. **Cron reminders** — batch+parallelize (`Promise.all`, concurrency=10) вместо последователен loop; премахнат dead `google-watch-renew` cron entry (route не съществувал)
7. **Root domain booking break** (`salonapp.pro/{slug}` → 400 "Missing tenant context") — `middleware.ts` Step 8 сега инферира `x-salon-slug` за `/api/*` от query/Referer; **потвърдено работещо в production от Лина**
8. **`booking_min_notice_minutes`/`booking_window_days`** — вече enforced server-side в `runCreateBooking`, не само UI hint
9. **Phone `"00000"` placeholder** — server (`admin-booking.ts`, `runCreateBooking`) вече отказва вместо да default-ва; после открито и фиксирано същото в `QuickBooking.tsx` (client-side fallback все още пращал `"00000"`) → уникален `anon-<uuid>` per booking
10. **CI scripts** — `check:service-role-boundary`/`test`/`test:integration` бяха referenced в `.github/workflows/ci.yml`, но не съществували в `package.json`; добавени + `tsx` devDependency; 2 реални boundary violations (GDPR confirm, sitemap) поправени чрез `lib/internal/gdpr-export.ts` + `lib/internal/sitemap-tenants.ts`

**Follow-up gaps (намерени при втори review pass):**
- Migration 029 пипа `public.leads`, но таблицата никога не се `CREATE TABLE`-ва в migration history — добавен `CREATE TABLE IF NOT EXISTS` (no-op в production, fix за fresh deploy)
- `QuickBooking.tsx` slots fetch никога не пращал `specialist_id` → грешни free slots на premium multi-specialist салони — извлечена shared `effectiveSpecialistId` логика
- Super-admin impersonation cookie slug никога не се re-verify-вал срещу базата при четене (само при писане) — добавена проверка + activity log при impersonation start
- **Съзнателно пропуснато:** HMAC-signing на impersonation cookie — `httpOnly` вече блокира основния risk vector, ROI нисък

**Bonus:** Trial >30 дни tracking в Super Admin dashboard (нова red urgent секция + stat card).

**Verification:** `npx tsc --noEmit` чисто през цялата сесия; `npm run test` 84/84; `npm run lint` само pre-existing warnings; `npm run check:service-role-boundary` passed.

**Важно техническо откритие:** Local migration файлове и remote Supabase migration history са значително разминати (различни имена при същи timestamp версии) — вероятно от ръчни промени през SQL Editor без проследяване. Не пипано систематично (риск > полза), но `leads`/`platform_leads` drift-ът конкретно е closed.

---

## 2026-06-03 — Fix: mobile forced dark mode on landing

**Проблем:** На някои Android/Samsung браузъри `salonapp.pro` се показваше с тъмен hero фон, а на други със светлия бежов фон. Причината беше глобалният `@media (prefers-color-scheme: dark)` в `app/globals.css`, който сменяше root цветовете при dark mode.

**Fix:** `app/globals.css` вече заключва `color-scheme: only light` и не обръща `--background/--foreground` в dark mode. `app/layout.tsx` добавя `themeColor`, `colorScheme` и meta тагове за light схема, а `app/page.tsx` подсилва същото за landing страницата.

**Проверка:** `npx tsc --noEmit` минава чисто. `npm run build` минава успешно със съществуващи lint warnings.

---

## 2026-06-03 — Redesign: desktop AdminShowcase section

**Промяна:** В `components/landing/AdminShowcase.tsx` desktop layout-ът е преработен от ляво-залепен phone mockup + празно пространство към центриран `max-w-[1450px]` grid. Phone mockup-ът е по-голям визуален anchor, floating cards са с по-мек shadow, а copy/tabs/features/stat блоковете са в подредена дясна колона.

**Допълнение:** Phone mockup-ът е преместен вляво в по-широка visual колона, а floating cards са позиционирани вдясно от телефона в празното пространство преди copy колоната. Така не покриват нито екрана, нито заглавието. `SMS напомняне` е сменено на `Имейл напомняне`, а feature редът `Промени влизат веднага в живо` е премахнат.

**Цел:** Секцията "Админ панел" да запълва страницата естествено на desktop и да изглежда като завършен product showcase, не като малък елемент вляво с празно поле вдясно.

**Проверка:** `npx tsc --noEmit` минава чисто. Headless Chrome проверка:
- 1920x980: `scrollWidth=1920`, section width `1920`
- 390x844: `scrollWidth=390`, section width `390`

---

## 2026-06-03 — Fix: landing hero композиция

**Промяна:** В `app/page.tsx` hero mockup-ът `hero-mockup-new.png` е центриран вертикално, намален до `86%` от hero височината и дръпнат навътре от десния край (`right: 9.5%`). Текстовата колона е разширена до `48%`, центрирана вертикално и с по-голям desktop ляв отстъп. Mobile hero image-ът вече използва същия `hero-mockup-new.png` вместо стария `mobile-mockup.png`.

**Цел:** Hero image-ът стои по-близо до текста, двата елемента са по-центрирани и има повече въздух от краищата на desktop.

**Проверка:** `npx tsc --noEmit` минава чисто. Headless Chrome проверка:
- 1920x952: mockup `left=921`, `right=1738`, `scrollWidth=1920`
- 390x844: desktop mockup скрит, mobile `hero-mockup-new.png` видим, `scrollWidth=390`

---

## 2026-05-23 — Fix: horizontal scroll на Magnetic Eyes

**Проблем:** Публичният сайт на tenant `magnetic-eyes` имаше хоризонтален скрол на mobile.

**Fix:** В `components/tenants/magnetic-eyes/Page.tsx` са добавени responsive правила за свиване/пренасяне на дълги CTA текстове, stack layout за услугите на mobile, корекция на `about` stats grid-а и wrapping за FAQ/contact/footer текстове. Добавен е scoped `overflow-x: clip` на `.me-root` като предпазна мрежа.

**Допълнение:** Hero снимката на mobile вече се crop-ва към лицето/окото (`background-position: 86% top`) вместо към ухото; hero бутоните се подреждат един под друг на mobile.

**Допълнение 2:** Добавен е document-level lock за horizontal scroll (`me-no-x-scroll` class върху `html` и `body`) при mount на Magnetic Eyes, защото Samsung/mobile browser все още позволяваше плъзване надясно въпреки root overflow guard-а.

**Проверка:** Локално през headless Chrome:
- 375px viewport: `scrollWidth = 375`, `overflow = 0`, offenders: `[]`
- 320px viewport: `scrollWidth = 320`, `overflow = 0`, offenders: `[]`
- Hero mobile check: `heroPosition = 86% 0%`, `heroButtons = column`, `overflow = 0`
- Forced horizontal scroll check: след `window.scrollTo(200, 0)` → `scrollX = 0`, `html/body overflow-x = hidden`, offenders: `[]`
- `npx tsc --noEmit` минава чисто.

---

## 2026-05-14 — Поли: Fix на регистрация на нов тенант (задаване на парола)

**Проблем:** Новорегистриран собственик на салон кликва линка от welcome имейла → попада на `/admin/login` (форма за вход) вместо на `/admin/reset-password` (форма за задаване на парола). Потребителят не можеше да си зadadе парола.

**Причина:** `lib/owner-recovery-link.ts` генерираше recovery линк с `redirectTo: /admin/login`. След като Supabase верифицираше токена, изпращаше потребителя към `/admin/login` с токени в hash фрагментите. Middleware-ът не улавяше recovery параметрите на `/admin/login` (само улавяше на `/`). Страницата `/admin/reset-password` имаше цялата логика за обработка, но потребителят никога не стигаше до нея.

**Fix:** Сменен `redirectTo` от `/admin/login` на `/admin/reset-password` в `lib/owner-recovery-link.ts` (1 ред).

**Деплой:** Качено в Vercel — работи.

### Текущо състояние
- **Регистрационният flow е изправен** — нови тенанти получават welcome имейл, кликват линка, задават парола, влизат в админ панела
- Проектът е production-ready

---

# HANDOFF — 2026-04-20

### 2026-05-05 — Google Calendar интеграция (Phase 1 foundation)

- `supabase/migrations/024_google_calendar_integration.sql`: добавени `tenant_google_integrations` + Google sync/cancel полета в `bookings`.
- `lib/google-calendar.ts`: OAuth helpers (state/signature, token exchange), calendar list и token encryption/decryption.
- `app/api/admin/integrations/google/*`: `start`, `callback`, `status`, `disconnect` endpoints.
- `components/admin/GoogleCalendarIntegrationCard.tsx` + `app/admin/(protected)/settings/page.tsx`: UI карта за свързване/прекъсване и статус.
- `lib/tenant-db.ts` + `types/*`: добавени методи/типове за integration и booking sync metadata.
- Verification: `npx tsc --noEmit` passed.

### 2026-05-05 — Google Calendar интеграция (Phase 2 core sync)

- `lib/google-calendar-sync.ts`: добавен tenant-aware token lifecycle (refresh + needs_reconnect), FreeBusy заявка за ден и booking→Google event sync.
- `app/api/bookings/route.ts`: slot генераторът вече включва Google FreeBusy като допълнителни busy интервали.
- `lib/booking-mutations.ts`: преди запис прави повторна проверка срещу Google busy; след запис пуска async sync към Google event.
- `app/api/admin/integrations/google/apply-change/route.ts`: inbound apply route за move/cancel от Google към local booking.
- `lib/email.tsx`: нов `sendCancellationEmailFromGoogle()` за имейл при анулация от Google.
- Verification: `npx tsc --noEmit` passed.

### 2026-05-05 — Google Calendar интеграция (Phase 3 inbound automation)

- `supabase/migrations/025_google_watch_channels.sql`: добавени watch channel/sync token полета в `tenant_google_integrations`.
- `lib/google-calendar.ts`: добавени watch API, events.list (sync token), event PATCH/DELETE helpers.
- `lib/google-calendar-sync.ts`: автоматично регистриране/подновяване на watch, webhook notification processing и inbound apply към bookings.
- `app/api/admin/integrations/google/webhook/route.ts`: endpoint за Google push notifications.
- `app/api/cron/google-watch-renew/route.ts`: cron endpoint за подновяване на watch каналите.
- `app/api/admin/bookings/[id]/route.ts`: booking update/delete вече синхронизира и към Google event lifecycle.
- Midnight clamp fix: Google busy интервалите се ограничават коректно в рамките на деня при slot generation.
- Verification: `npx tsc --noEmit` passed.

### 2026-04-22 — Security fix: cron API auth

- `lib/cron-auth.ts`: added shared fail-closed `CRON_SECRET` Bearer validation.
- `app/api/cron/reminders/route.ts`, `app/api/cron/billing-expiry/route.ts`: removed `x-vercel-cron` as an auth bypass; cron jobs now require `Authorization: Bearer <CRON_SECRET>`.
- `README.md`: documented Vercel `CRON_SECRET` env and manual curl tests.
- Production note: Vercel project must have `CRON_SECRET` set; Vercel Cron sends it automatically as the Authorization header.

### 2026-04-22 — Security fix: design tokens Stored XSS

- `schemas/design-tokens.ts`: design tokens now use strict Zod validation with font/radius allowlists and constrained CSS length patterns.
- `app/super-admin/actions.ts`: `saveDesignTokens` validates with `SaveDesignTokensSchema.safeParse` before writing to `tenants.design_tokens`.
- `lib/design-tokens.ts`: saved tokens are parsed before merge; invalid stored values fall back to safe defaults.
- `app/(public)/[salon_slug]/page.tsx`: removed token-driven `<style dangerouslySetInnerHTML>` and now renders CSS variables via a React `style` object; builder preview updates also validate token values before applying them.
- Verification: `npx tsc --noEmit` and `npm run build` passed.

### 2026-04-22 — Security fix: booking service integrity

- `schemas/booking.ts`: public/admin booking payload now requires only `service_id` and no longer trusts client-sent `service_name`, `service_price_eur`, or `service_duration`.
- `lib/booking-mutations.ts`: booking creation now loads the active service server-side by `salon_slug + service_id`, validates specialist ownership, calculates complex duration server-side, and inserts DB-derived name/price/duration.
- `components/booking/BookingFlow.tsx`, `components/admin/QuickBooking.tsx`, `components/templates/InlineBookingForm.tsx`: forms now send only `service_id` plus date/time/contact details.
- Verification: `npx tsc --noEmit` and `npm run build` passed.

## От: Лина → За: Поли

---

### Какво направих в тази сесия

**1. `middleware.ts` — Routing за Vercel preview URL**
- **Проблем:** `salonapp-ten.vercel.app/salon-bizhu` не зареждаше салона — middleware връщаше early без да постави `x-salon-slug` header.
- **Промяна:** Добавена логика за `*.vercel.app` хостове — извлича първия path сегмент като `salon_slug`, идентично с localhost behavior.
- **Файл:** `middleware.ts`, блока `if (isVercelDeploymentHost(hostname))`

**2. `schemas/settings.ts` — Цветът на салона не се запазваше**
- **Проблем:** `UpdateTenantPublicFieldsSchema` нямаше поле `primary_color` → Zod тихо го изтриваше преди DB update → цветът никога не стигаше до базата.
- **Промяна:** Добавено `primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional()`
- **Файл:** `schemas/settings.ts`, ред 23

**3. `app/super-admin/actions.ts` — Шаблонът не се отразяваше веднага на сайта**
- **Проблем:** `updateTenantBasics` revalidate-ваше само супер-админ страниците, не публичния сайт → до 60 секунди закъснение.
- **Промяна:** Добавен `revalidatePath(\`/${salonSlug}\`)` след запазване.
- **Файл:** `app/super-admin/actions.ts`, ред ~118

**4. `app/super-admin/[salon_slug]/page.tsx` + `actions.ts` — Успешен feedback при запазване**
- **Проблем:** Натискаш "Запази промените" — нищо не се случва видимо, нямаше потвърждение.
- **Промяна:** `updateTenantBasics` прави redirect към `?saved=1`; страницата показва зелен банер.
- **Файлове:** `app/super-admin/[salon_slug]/page.tsx` (banner), `app/super-admin/actions.ts` (redirect)

**5. `app/api/webhooks/stripe/route.ts` — Stripe webhook за автоматично активиране**
- **Нов файл:** Обработва `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`.
- При успешно плащане: обновява `status`, `expiry_date`, `grace_until_date` + изпраща имейл чрез Resend.

---

### Състояние на проекта СЕГА

| | |
|---|---|
| **Branch** | `main` |
| **Последен commit** | `cdcde84` — Add PROJECT_STATUS.md |
| **Vercel deploy** | Качено на `salonapp-ten.vercel.app` — билдва автоматично при push |
| **Некомитнати промени** | Не |
| **TypeScript грешки** | Няма (`npx tsc --noEmit` минава чисто) |

---

### Какво РАБОТИ ✅

- Публичен сайт на салоните — 6 шаблона (bloom, luxe, luxe2, bold, zen, groom)
- Routing: `salonapp-ten.vercel.app/salon-bizhu` ✅ | `salon-bizhu.salonapp.pro` ⚠️ (чака DNS)
- Inline форма за резервации вградена в всички шаблони
- Салонски админ панел: dashboard, резервации, клиенти, услуги, галерия, настройки
- Цветова палитра в настройките — 6 preset + custom hex → записва се и се вижда на сайта
- Галерия — drag-and-drop upload, toggle видимост
- Супер-админ панел: таблo, всички тенанти с филтри, детайл, заявки (leads)
- Смяна на шаблон от супер-админа → веднага се отразява на сайта
- Ръчно активиране от супер-админ (банков превод) + изпраща имейл
- Stripe webhook за автоматично активиране при плащане
- Stripe Payment Link с префилнат имейл в детайл на тенант
- Нов тенант от супер-админа → създава auth user + изпраща welcome имейл с link за парола
- Имейли чрез Resend при: нов тенант, активиране, Stripe плащане
- Rate limiting: bookings (40/min), leads (15/min)

---

### Какво Е СЧУПЕНО СЕГА ❌

| Проблем | Файл/Място | Бележка |
|---------|-----------|---------|
| ~~`salon-bizhu.salonapp.pro` → DNS грешка~~ | ~~DNS / Vercel Settings~~ | ✅ Домейнът е свързан (2026-06-03) |
| ~~`clean` шаблон игнорира `primary_color`~~ | ~~`templates/Clean.tsx`~~ | ✅ Оправено (шаблонът е и премахнат) |
| ~~Stripe ENV не са в Vercel~~ | ~~Vercel → Settings → Env Vars~~ | ✅ Добавени (2026-06-03) |
| ~~Stripe webhook не е регистриран~~ | ~~Stripe Dashboard~~ | ✅ Регистриран (2026-06-03) |
| ~~Няма автоматична деактивация~~ | ~~Няма cron job~~ | ✅ `billing-expiry` cron е активен |

---

### Следваща задача за Поли

**Задача 1 — Оправи `clean` шаблона (15 минути)**
- Файл: `templates/Clean.tsx` (или `app/(public)/templates/Clean.tsx` — провери точния път)
- Проблем: Хардкодиран цвят `const ACCENT = "#0066CC"` не чете `primary_color` на салона
- Направи:
  1. Намери реда с `const ACCENT = "#0066CC"` (или подобен)
  2. Смени на: `const ACCENT = tenant.primary_color ?? "#0066CC";`
  3. Увери се че `tenant` prop се подава на компонента

**Задача 2 — Банер при влизане в салонски акаунт от супер-админ**
- Файл: `app/admin/layout.tsx` (или `app/admin/(protected)/layout.tsx`)
- Проблем: Супер-админ влиза в чужд акаунт — няма индикация кой акаунт гледа
- Направи:
  1. Прочети cookie `super_admin_impersonate_salon` (или `SUPER_ADMIN_SALON_COOKIE` от `lib/admin-tenant.ts`)
  2. Ако cookie присъства → показвай горен банер: `"⚠️ Гледаш като: [Salon Name] — Излез"`
  3. Бутонът "Излез" → server action, изтрива cookie, redirect към `/super-admin`

**Задача 3 — Свързване на домейна (НУЖНО от Лина, не код)**
- Верcel → Settings → Domains → добави `salonapp.pro` и `*.salonapp.pro`
- DNS: `A` запис `@` → `76.76.21.21`, `CNAME` `*` → `cname.vercel-dns.com`

---

### ВНИМАНИЕ / Не пипай

- `middleware.ts` — логиката за routing е деликатна; промените засягат ВСИЧКИ салони
- `app/super-admin/actions.ts` → `requireSuperAdminUser()` — не махай тази проверка
- `createSupabaseServiceRoleClient()` — само в server actions/API routes, НИКОГА в client компоненти
- `primary_color` — управлява се САМО от салонския админ; супер-админ само чете (read-only swatch)
- Supabase RLS — service role key заобикаля RLS; внимавай какво update-ваш
- Шаблонът `groom` е за мъжки бръснарници — не го смесвай с дамски салон логика
### 2026-05-05 â€” Booking + Google Calendar planning doc

- Added `BOOKING_GOOGLE_SYNC_PLAN_BG.md` in project root.
- Document includes combined booking stabilization plan + clarified Google Calendar two-way sync model.
- Scope is planning only: no code changes to booking flow, middleware, or sync logic.
