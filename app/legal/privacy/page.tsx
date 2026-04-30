import Link from 'next/link'
import { Playfair_Display, Inter } from 'next/font/google'

export const metadata = {
  title: 'Политика за поверителност | SalonApp',
  description:
    'Политика за поверителност на SalonApp — как събираме, обработваме и защитаваме личните ви данни съгласно GDPR.',
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

export default function PrivacyPage() {
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
          Политика за поверителност
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
              1. Обща информация
            </h2>
            <p>
              <strong className="text-[#1A1A1A]">„ЛИНДИ ХОУМ" ЕООД</strong> („Ние",
              „Администратор"), ЕИК 207347219, уважава вашата поверителност и се ангажира
              да защитава личните ви данни в съответствие с Регламент (ЕС) 2016/679 (GDPR).
              Тази политика описва как събираме и обработваме данни чрез платформата SalonApp.
            </p>
          </section>

          <div className="border-t border-[#1A1A1A]/10" />

          <section>
            <h2
              className="text-xl font-bold text-[#1A1A1A] mb-4"
              style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
            >
              2. Какви данни събираме
            </h2>
            <div className="space-y-4">
              <div>
                <p className="font-semibold text-[#1A1A1A] mb-1">Собственици на салони (Потребители)</p>
                <p>Имена, имейл адрес, телефонен номер, данни за фирмата и данни за плащане (обработвани от Stripe).</p>
              </div>
              <div>
                <p className="font-semibold text-[#1A1A1A] mb-1">Служители на салони (Специалисти)</p>
                <p>Имена, професионален график и снимка.</p>
              </div>
              <div>
                <p className="font-semibold text-[#1A1A1A] mb-1">Крайни клиенти на салоните</p>
                <p>
                  Имена, телефонен номер и история на резервациите. Ние обработваме тези
                  данни само в качеството си на{' '}
                  <strong className="text-[#1A1A1A]">Обработващ (Processor)</strong> по
                  възлагане от съответния Салон.
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
              3. Цели на обработването
            </h2>
            <ul className="space-y-2">
              {[
                'Предоставяне на функционалностите на Платформата (резервации, графици).',
                'Управление на абонаменти и разплащания.',
                'Изпращане на системни уведомления (потвърждения за час чрез имейл).',
                'Сигурност и предотвратяване на измами.',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9A84C]" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <div className="border-t border-[#1A1A1A]/10" />

          <section>
            <h2
              className="text-xl font-bold text-[#1A1A1A] mb-4"
              style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
            >
              4. Правни основания
            </h2>
            <ul className="space-y-2">
              {[
                'Изпълнение на договор (за собствениците на салони).',
                'Легитимен интерес (за техническа поддръжка и сигурност).',
                'Съгласие (където е приложимо за маркетингови цели).',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9A84C]" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <div className="border-t border-[#1A1A1A]/10" />

          <section>
            <h2
              className="text-xl font-bold text-[#1A1A1A] mb-4"
              style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
            >
              5. Получатели на данни (Sub-processors)
            </h2>
            <p className="mb-4">За осигуряване на услугата използваме следните доверени партньори:</p>
            <div className="space-y-3">
              {[
                { name: 'Supabase', desc: 'Съхранение на базата данни (сертифицирани дейта центрове в ЕС).' },
                { name: 'Stripe', desc: 'Обработка на плащания (ние не съхраняваме данни за банкови карти).' },
                { name: 'Resend', desc: 'Изпращане на транзакционни имейли.' },
                { name: 'Vercel', desc: 'Хостинг на интерфейса на платформата.' },
              ].map(({ name, desc }) => (
                <div key={name} className="flex items-start gap-3">
                  <span className="mt-0.5 text-xs font-black uppercase tracking-widest text-[#C9A84C] w-16 shrink-0">{name}</span>
                  <span>{desc}</span>
                </div>
              ))}
            </div>
          </section>

          <div className="border-t border-[#1A1A1A]/10" />

          <section>
            <h2
              className="text-xl font-bold text-[#1A1A1A] mb-3"
              style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
            >
              6. Срок на съхранение
            </h2>
            <p>
              Данните се съхраняват за периода, в който вашият акаунт е активен, или до
              законово изискуемия срок за съхранение на финансови документи (10 години за
              фактури). Данните на крайните клиенти се изтриват по искане на Салона или при
              прекратяване на договора.
            </p>
          </section>

          <div className="border-t border-[#1A1A1A]/10" />

          <section>
            <h2
              className="text-xl font-bold text-[#1A1A1A] mb-3"
              style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
            >
              7. Вашите права
            </h2>
            <p className="mb-3">
              Имате право на достъп, коригиране, изтриване („право да бъдеш забравен"),
              ограничаване на обработването и преносимост на данните.
            </p>
            <p>
              Жалби могат да бъдат подавани до КЗЛД —{' '}
              <a
                href="https://www.cpdp.bg"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#C9A84C] hover:underline"
              >
                www.cpdp.bg
              </a>
              .
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
