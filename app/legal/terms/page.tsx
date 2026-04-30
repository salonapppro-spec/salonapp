import Link from 'next/link'
import { Playfair_Display, Inter } from 'next/font/google'

export const metadata = {
  title: 'Общи условия | SalonApp',
  description:
    'Общи условия за ползване на платформата SalonApp — управление на резервации за салони за красота.',
}

const playfair = Playfair_Display({
  subsets: ['latin', 'cyrillic'],
  weight: ['700', '800'],
  variable: '--font-playfair',
})

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
})

export default function TermsPage() {
  return (
    <div
      className={`${playfair.variable} ${inter.variable} min-h-screen bg-[#EAD5C4]`}
      style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}
    >
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#1A1A1A]/50 transition-colors hover:text-[#C9A84C] mb-12"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Начало
        </Link>

        <h1
          className="text-4xl font-extrabold tracking-tight text-[#1A1A1A] mb-2 md:text-5xl"
          style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
        >
          Общи условия
        </h1>
        <p className="text-sm text-[#1A1A1A]/45 mb-14 tracking-wide">
          Последна актуализация: 29.04.2026 г.
        </p>

        <div className="space-y-10 text-[#1A1A1A]/80 leading-relaxed">

          <section>
            <h2
              className="text-xl font-bold text-[#1A1A1A] mb-3"
              style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
            >
              Раздел I. Предмет и общи разпоредби
            </h2>
            <p className="mb-3">
              Настоящите Общи условия (ОУ) уреждат отношенията между{' '}
              <strong className="text-[#1A1A1A]">„ЛИНДИ ХОУМ" ЕООД</strong>, ЕИК: 207347219,
              ДДС номер: BG207347219, със седалище и адрес на управление: гр. Бургас 8000,
              ул. Гладстон 35, ет. 3, представлявано от Лина Георгиева Пеева (наричано
              по-долу „Доставчик" или „Ние"), и всяко лице, което използва софтуерната
              платформа SalonApp (наричано по-долу „Салон" или „Потребител").
            </p>
            <p className="mb-3">
              Платформата SalonApp предоставя софтуер като услуга (SaaS) за управление на
              резервации, графици на специалисти и дигитално представяне на салони за красота.
            </p>
            <p>
              Доставчикът не предоставя самите услуги по красота, а само техническата
              инфраструктура за тяхното управление.
            </p>
          </section>

          <div className="border-t border-[#1A1A1A]/10" />

          <section>
            <h2
              className="text-xl font-bold text-[#1A1A1A] mb-3"
              style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
            >
              Раздел II. Регистрация, абонаменти и плащания
            </h2>
            <p className="mb-3">
              За да използва Платформата, Салонът трябва да създаде профил и да избере
              съответния абонаментен план.
            </p>
            <p className="mb-3">
              Плащанията се обработват чрез външния доставчик на платежни услуги Stripe.
              Доставчикът не съхранява данни за кредитни/дебитни карти на своите сървъри.
            </p>
            <p className="mb-3">
              При неуспешно плащане на абонаментната такса, Доставчикът си запазва правото
              да ограничи временно достъпа до Платформата до уреждане на задълженията.
            </p>
            <p>Всички платени такси са невъзвръщаеми, освен ако законът не изисква друго.</p>
          </section>

          <div className="border-t border-[#1A1A1A]/10" />

          <section>
            <h2
              className="text-xl font-bold text-[#1A1A1A] mb-3"
              style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
            >
              Раздел III. Ограничаване на отговорността
            </h2>
            <p className="mb-3">
              Платформата се предоставя на принципа „във вида, в който е" (AS IS), без
              изрични или подразбиращи се гаранции за непрекъсваемост при всякакви условия.
            </p>
            <p className="mb-3">
              Доставчикът не носи отговорност за каквито и да е преки, косвени, случайни
              или последващи щети, включително пропуснати ползи, загуба на данни или
              прекъсване на бизнес дейността на Салона, произтичащи от използването или
              невъзможността за използване на Платформата.
            </p>
            <p>
              Доставчикът не носи отговорност за спорове между Салона и неговите крайни
              клиенти (напр. неявяване на клиент, недоволство от услугата и др.).
            </p>
          </section>

          <div className="border-t border-[#1A1A1A]/10" />

          <section>
            <h2
              className="text-xl font-bold text-[#1A1A1A] mb-3"
              style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
            >
              Раздел IV. Споразумение за обработка на данни (DPA)
            </h2>
            <p className="mb-3">
              По отношение на личните данни на крайните клиенти, които се въвеждат в
              Платформата (имена, телефони, часове), Салонът действа в качеството си на{' '}
              <strong className="text-[#1A1A1A]">Администратор на лични данни</strong>, а
              Доставчикът действа като{' '}
              <strong className="text-[#1A1A1A]">Обработващ лични данни</strong>.
            </p>
            <p className="mb-3">
              Доставчикът се задължава да обработва данните на крайните клиенти единствено
              по възлагане и документирани инструкции на Салона, с цел осигуряване на
              функционалността на Платформата.
            </p>
            <p className="mb-3">
              Доставчикът няма право да използва базите данни с клиенти на Салоните за
              собствени маркетингови цели, да ги продава или преотстъпва на трети лица
              (извън необходимите технически подизпълнители като хостинг и имейл услуги).
            </p>
            <p>
              Салонът гарантира, че е получил необходимото съгласие или има друго правно
              основание да въвежда данните на своите клиенти в Платформата.
            </p>
          </section>

          <div className="border-t border-[#1A1A1A]/10" />

          <section>
            <h2
              className="text-xl font-bold text-[#1A1A1A] mb-3"
              style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
            >
              Раздел V. Прекратяване
            </h2>
            <p className="mb-3">
              Всяка от страните може да прекрати използването на услугата по всяко време
              чрез изтриване на профила или спиране на абонамента.
            </p>
            <p>
              При прекратяване, Доставчикът осигурява възможност на Салона да експортира
              своите данни в разумен срок (30 дни), след което данните се заличават или
              анонимизират.
            </p>
          </section>

          <div className="border-t border-[#1A1A1A]/10 pt-6">
            <p className="text-sm text-[#1A1A1A]/50">
              При въпроси:{' '}
              <a
                href="mailto:salonapppro@gmail.com"
                className="text-[#C9A84C] hover:underline"
              >
                salonapppro@gmail.com
              </a>
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
