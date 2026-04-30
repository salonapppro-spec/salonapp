import Link from 'next/link'
import { Playfair_Display, Inter } from 'next/font/google'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Политика за бисквитките | SalonApp',
  description: 'Политика за бисквитките (Cookie Policy) на платформата SalonApp.',
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

export default function CookiePolicyPage() {
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
          Политика за бисквитките
        </h1>
        <p className="text-sm text-[#1A1A1A]/45 mb-14 tracking-wide">
          Последна актуализация: 30.04.2026 г.
        </p>

        <div className="space-y-10 text-[#1A1A1A]/80 leading-relaxed">

          <section>
            <h2
              className="text-xl font-bold text-[#1A1A1A] mb-3"
              style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
            >
              1. Какво представляват бисквитките?
            </h2>
            <p>
              Бисквитките (cookies) са малки текстови файлове, които се запазват на вашия
              компютър или мобилно устройство, когато посещавате нашата Платформа. Те ни
              помагат да запомним вашите действия и предпочитания (като например логин данни
              и език) за определен период от време, за да не се налага да ги въвеждате
              всеки път.
            </p>
          </section>

          <div className="border-t border-[#1A1A1A]/10" />

          <section>
            <h2
              className="text-xl font-bold text-[#1A1A1A] mb-4"
              style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
            >
              2. Какви видове бисквитки използваме?
            </h2>
            <p className="mb-4">Ние използваме следните категории бисквитки:</p>
            <div className="space-y-5">
              <div>
                <p className="font-semibold text-[#1A1A1A] mb-2">
                  Строго необходими бисквитки (Essential Cookies)
                </p>
                <p className="mb-3">
                  Тези бисквитки са абсолютно задължителни за правилното функциониране на
                  Платформата. Те включват:
                </p>
                <div className="space-y-2 pl-4">
                  {[
                    { label: 'Authentication cookies', desc: 'Бисквитки, генерирани от нашата база данни (Supabase), които поддържат вашата сесия активна, когато влезете в административния панел.' },
                    { label: 'Security cookies', desc: 'Използват се за предотвратяване на злоупотреби и защита на потребителските данни.' },
                    { label: 'Consent cookies', desc: 'Запазват вашия избор относно самите бисквитки.' },
                  ].map(({ label, desc }) => (
                    <div key={label} className="flex items-start gap-3">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9A84C]" />
                      <span><span className="italic text-[#1A1A1A]/70">{label}:</span> {desc}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-sm italic text-[#1A1A1A]/60">
                  Тези бисквитки не могат да бъдат изключени в нашите системи, тъй като без
                  тях услугата не може да бъде предоставена.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9A84C]" />
                <p>
                  <strong className="text-[#1A1A1A]">Аналитични бисквитки (Analytical Cookies):</strong>{' '}
                  Позволяват ни да отчитаме посещенията и източниците на трафик, за да
                  подобряваме ефективността. Активират се само с вашето съгласие.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9A84C]" />
                <p>
                  <strong className="text-[#1A1A1A]">Маркетингови бисквитки (Marketing Cookies):</strong>{' '}
                  Използват се за показване на релевантни реклами. Активират се само с
                  вашето съгласие.
                </p>
              </div>
            </div>
          </section>

          <div className="border-t border-[#1A1A1A]/10" />

          <section>
            <h2
              className="text-xl font-bold text-[#1A1A1A] mb-4"
              style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
            >
              3. Бисквитки на трети страни (Third-party cookies)
            </h2>
            <p className="mb-4">
              В някои случаи използваме услуги на доверени трети страни, които също могат
              да поставят бисквитки на вашето устройство:
            </p>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-xs font-black uppercase tracking-widest text-[#C9A84C] w-16 shrink-0">Stripe</span>
              <span>
                Използва се за сигурна обработка на плащанията. Stripe може да постави
                бисквитки за целите на сигурността на транзакциите.
              </span>
            </div>
          </section>

          <div className="border-t border-[#1A1A1A]/10" />

          <section>
            <h2
              className="text-xl font-bold text-[#1A1A1A] mb-3"
              style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
            >
              4. Как да управлявате бисквитките?
            </h2>
            <p>
              Вие имате пълен контрол върху бисквитките. Можете да промените избора си по
              всяко време чрез нашия Банер за бисквитки или чрез настройките на вашия
              браузър. Имайте предвид, че ако изтриете строго необходимите бисквитки, някои
              функции на Платформата ще спрат да работят.
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
