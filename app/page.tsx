import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Inter } from "next/font/google";
import FaqAccordion from "@/components/FaqAccordion";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "SalonApp.pro — Сайт, резервации и бизнес за салони",
  description:
    "Онлайн резервации по графика, админ панел и публичен сайт за салони. Планове Standard, Pro, Premium и Collective.",
  openGraph: {
    title: "SalonApp.pro — Beauty. Business. Elevated.",
    description: "Сайт и резервации за салони — без хаоса в чатовете.",
    url: "https://salonapp.pro",
    siteName: "SalonApp.pro",
    locale: "bg_BG",
    type: "website",
  },
};

const gold = "#C9A84C";
const demoSalonHref = "/lindy-design";

const faqs = [
  {
    q: "Клиентките ми предпочитат да звънят.",
    a: "Нека звънят! Направили сме функция „Бърз час\" специално за теб. Докато си говорите на високоговорител, просто въвеждаш телефона ѝ в твоя екран. Системата сама намира името ѝ и запазваш часа с един клик. Двата календара (твоят и този на сайта) се синхронизират на секундата! Но онлайн сайтът хваща и тези, които се срамуват да звъннат или се сещат късно вечер. Това са нови пари за теб. Освен това, когато се записват сами, ти не спираш работа, за да вдигаш телефона.",
    accent: "phone" as const,
  },
  {
    q: "Сложно е, не разбирам от компютри.",
    a: "Ако знаеш как да влезеш във Facebook, значи знаеш как да ползваш и това. Ние правим уеб дизайна и настройваме всичко безплатно. Ти само гледаш имената на клиентите в телефона си. Просто като детска игра.",
  },
  {
    q: "19 евро са много пари.",
    a: "Един пропуснат час ти струва 50 лева. Нашата система ще спаси поне 2-3 такива часа всеки месец чрез автоматичните напомняния. Тя не ти харчи пари, тя ти изкарва пари.",
  },
  {
    q: "Ами ако реша да спра?",
    a: "Спираш веднага. Няма договори, няма скрити такси. Твоите клиенти са си твои – можеш да изтеглиш списъка с телефоните им по всяко време.",
  },
  {
    q: "Имам си тефтер, той ми е безплатен.",
    a: "Тефтерът не праща съобщения на клиентите и не ти казва кога работиш на загуба. Тефтерът е просто хартия, а SalonApp е твоят личен асистент.",
  },
  {
    q: "Трябва ли ми нов телефон или лаптоп?",
    a: "Не. Всичко работи перфектно на телефона, който ползваш в момента. Не ти трябва нищо друго.",
  },
  {
    q: "Нямам време да го настройвам.",
    a: "Ти не правиш нищо. Пращаш ни ценоразписа си и ние го качваме вместо теб за 24 часа. Влизаш на готово.",
  },
  {
    q: "Клиентите ще ми видят сметките.",
    a: "Абсурд! Бизнес Калкулаторът е скрит и е само за твоите очи. Клиентите виждат само красивото меню с услуги и цени.",
  },
  {
    q: "Има безплатни програми.",
    a: "Безплатните програми са пълни с реклами на твоите конкуренти. Ние ти даваме чисто, професионално място, където съществуваш само ТИ.",
  },
  {
    q: "Ами ако някой се запише в час, в който не работя?",
    a: "Ти определяш работното си време. Ако решиш, че днес почиваш, просто цъкаш един бутон и никой не може да се запише. Ти си шефът.",
  },
  {
    q: "Аз съм само един човек, не ми трябва софтуер.",
    a: "Точно защото си сама, времето ти е най-ценно. Софтуерът ти пести по 10 часа на месец от писане на съобщения. Това са 10 часа почивка за теб.",
  },
];

const plans = [
  {
    name: "СТАНДАРТ",
    price: "19",
    featured: false,
    features: [
      "1 Специалист",
      "Твой собствен сайт (Субдомейн)",
      "Дигитален график",
      "Онлайн резервации 24/7",
      "Бизнес Калкулатор и Месечни отчети",
    ],
  },
  {
    name: "ПРО",
    price: "29",
    featured: true,
    tag: "Най-избиран",
    features: [
      "1 Специалист",
      "Всичко от СТАНДАРТ плана",
      "Паралелни услуги (двама клиенти едновременно)",
      "Google Бизнес акаунт настройка",
      "SEO и AIO (AI Оптимизация)",
    ],
  },
  {
    name: "ПРЕМИУМ",
    price: "49",
    featured: false,
    features: [
      "1 Специалист",
      "Всичко от ПРО плана",
      "Автоматични SMS & Viber напомняния",
      "Имейл след посещение за събиране на отзиви (Google/Facebook)",
    ],
  },
  {
    name: "КОЛЕКТИВ",
    price: "49",
    featured: false,
    features: [
      "Неограничен брой специалисти",
      "Всеки Специалист вижда само своя график",
      "Всичко от ПРО плана",
      "SMS/Viber опция: +5.99€ на специалист",
    ],
  },
];

const problems = [
  {
    num: "01",
    title: "Твоята лична витрина",
    body: "В големите сайтове си просто един номер сред много други и клиентите виждат конкуренцията до теб. Ние ти даваме собствен красив сайт и правим уеб дизайна безплатно. Качваме снимките и цените. Клиентката влиза и вижда само теб. Изглеждаш професионално и скъпо.",
  },
  {
    num: "02",
    title: "Дигитален график",
    body: "Пишат ти във Viber в 11 вечерта? Клиентите вече се записват сами от телефона си. А ако някоя клиентка ти звънне по телефона – имаш функция „Бърз час\". Пишеш само номера ѝ и системата сама попълва името. Календарът ти и сайтът се обновяват на секундата, без дублиране на часове!",
  },
  {
    num: "03",
    title: "Край на забравените часове",
    body: "Клиентката забравя за часа си, а ти губиш 50 лева, докато я чакаш. Сайтът праща автоматично съобщение 24 часа преди часа. Само един спасен клиент плаща целия софтуер за месеца.",
  },
  {
    num: "04",
    title: "Бизнес Калкулатор",
    body: "Работиш много, но накрая не знаеш колко е чистата печалба? Пишеш си наема и разходите. Системата сама пресмята всяка услуга и всички месечни отчети. Тя ти казва: „От този маникюр печелиш\", или „Тук работиш на загуба\".",
  },
];

export default function Home() {
  return (
    <div className={`${inter.className} min-h-screen bg-zinc-950 text-white`}>
      {/* Background blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-[28rem] w-[28rem] rounded-full blur-3xl" style={{ background: gold, opacity: 0.12 }} />
        <div className="absolute -right-24 top-20 h-[26rem] w-[26rem] rounded-full blur-3xl" style={{ background: "#C8826A", opacity: 0.12 }} />
        <div className="absolute bottom-[-10rem] left-1/3 h-[24rem] w-[24rem] rounded-full blur-3xl" style={{ background: gold, opacity: 0.08 }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-zinc-950/50 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/get-started" className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white backdrop-blur-xl transition hover:border-white/20 hover:bg-white/10">
            БЕЗПЛАТЕН МЕСЕЦ
          </Link>
          <Link href="/">
            <Image src="/logo.png" alt="SalonApp" width={160} height={52} className="h-11 w-auto rounded-lg object-contain" priority />
          </Link>
        </div>
      </header>

      <main className="relative">
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">salonapp.pro — за красота и успех</p>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl">
              Твоят бизнес заслужава
              <br />
              повече от тефтер.
            </h1>
            <p className="mt-5 text-base text-zinc-400 md:text-lg">
              Пълно е с работа, но накрая на месеца не знаеш къде са парите? Спри да губиш време в писане на съобщения. Вземи сайт, който записва клиенти сам и ти казва колко точно печелиш. Уеб дизайнът и пълната настройка са безплатни от нас.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/get-started" className="inline-flex min-h-[52px] w-full max-w-xs items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#C9A84C,#C8826A)] px-8 text-sm font-semibold text-zinc-950 shadow-[0_25px_80px_rgba(201,168,76,0.22)] transition hover:opacity-90 sm:w-auto">
                Искам Безплатен Месец
              </Link>
              <Link href={demoSalonHref} className="inline-flex min-h-[52px] w-full max-w-xs items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-8 text-sm font-semibold text-white backdrop-blur-xl transition hover:bg-white/10 sm:w-auto">
                Виж демо салон
              </Link>
            </div>
            <p className="mt-5 text-sm text-zinc-400">Без банкова карта при регистрация. Без договори. Спираш, когато поискаш.</p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              "Готов сайт за 24 часа — Ти не пипаш нищо",
              "Работи перфектно на твоя телефон",
              "Данните и клиентите са 100% твоя собственост",
            ].map((t) => (
              <div key={t} className="rounded-2xl border border-white/10 bg-white/5 p-5 text-base text-zinc-400 backdrop-blur-xl">
                {t}
              </div>
            ))}
          </div>
        </section>

        {/* Problems */}
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">Решения</p>
          <h2 className="mt-3 text-3xl font-bold md:text-4xl">Проблемите, които решаваме.</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {problems.map((p) => (
              <div key={p.num} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <div className="text-sm font-semibold text-zinc-300">{p.num}</div>
                <div className="mt-3 text-xl font-semibold">{p.title}</div>
                <p className="mt-3 text-base text-zinc-400">{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Plans */}
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">Планове и цени</p>
          <h2 className="mt-3 text-3xl font-bold md:text-4xl">Избери план. Смени го или го спри, когато поискаш.</h2>
          <p className="mt-4 text-base text-zinc-400 md:text-lg">Всички планове включват безплатен уеб дизайн от нас и 1 месец напълно безплатно.</p>
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={[
                  "group relative rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition",
                  "hover:bg-[linear-gradient(135deg,rgba(201,168,76,0.12),rgba(200,130,106,0.12))]",
                  plan.featured ? "ring-1 ring-[#C9A84C]/30 shadow-[0_0_80px_rgba(201,168,76,0.18)]" : "",
                ].join(" ")}
              >
                {plan.tag ? (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[linear-gradient(135deg,#C9A84C,#C8826A)] px-3 py-1 text-xs font-semibold text-zinc-950">
                    {plan.tag}
                  </div>
                ) : null}
                <div className="text-sm font-semibold text-zinc-300">{plan.name}</div>
                <div className="mt-4 text-4xl font-extrabold tracking-tight">{plan.price}€</div>
                <div className="mt-1 text-sm text-zinc-400">/ месец</div>
                <ul className="mt-6 space-y-3 text-base text-zinc-400">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: gold }} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/get-started" className="mt-8 inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-sm font-semibold text-white transition hover:bg-white/10">
                  Започни Безплатно
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">Въпроси</p>
          <h2 className="mt-3 text-3xl font-bold md:text-4xl">Знаем какво си помисли вече.</h2>
          <div className="mt-8">
            <FaqAccordion items={faqs} />
          </div>
        </section>

        {/* CTA Banner */}
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-20">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur-xl">
            <h2 className="text-3xl font-bold md:text-4xl">Остави тефтера в миналото.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-zinc-400 md:text-lg">
              Попълни формата сега. Ние ще ти се обадим и до 24 часа ще имаш готов, работещ сайт.
            </p>
            <div className="mt-7 flex justify-center">
              <Link href="/get-started" className="inline-flex min-h-[52px] items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#C9A84C,#C8826A)] px-10 text-sm font-semibold text-zinc-950 shadow-[0_25px_80px_rgba(201,168,76,0.22)] transition hover:opacity-90">
                Искам Безплатен Месец
              </Link>
            </div>
            <p className="mt-4 text-sm text-zinc-400">Без карта. Без обвързване. Данните ти остават при теб.</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-zinc-950/80">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Image src="/logo.png" alt="SalonApp" width={120} height={40} className="h-9 w-auto rounded-lg object-contain" />
              <p className="mt-2 text-sm text-zinc-500">Beauty. Business. Elevated.</p>
            </div>
            <nav className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-zinc-400">
              <Link href="/get-started" className="transition hover:text-white">Безплатен месец</Link>
              <Link href={demoSalonHref} className="transition hover:text-white">Демо салон</Link>
              <Link href="mailto:salonapppro@gmail.com" className="transition hover:text-white">salonapppro@gmail.com</Link>
              <Link href="#" className="transition hover:text-white">Условия</Link>
              <Link href="#" className="transition hover:text-white">Поверителност</Link>
            </nav>
          </div>
          <div className="mt-8 border-t border-white/10 pt-6 text-xs text-zinc-600">
            © 2026 SalonApp.pro — Всички права запазени.
          </div>
        </div>
      </footer>
    </div>
  );
}
