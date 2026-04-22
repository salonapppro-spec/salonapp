import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Политика за поверителност — SalonApp.pro",
  description: "Политика за защита на личните данни на SalonApp.pro",
  robots: { index: true, follow: true },
};

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-[#1A1A1A]">
      <h1 className="mb-2 text-3xl font-bold">Политика за поверителност</h1>
      <p className="mb-10 text-sm text-neutral-500">Последна актуализация: 22.04.2026</p>

      <section className="space-y-8 text-base leading-relaxed">
        <div>
          <h2 className="mb-3 text-xl font-semibold">1. Администратор на данните</h2>
          <p>
            Администратор на личните данни е <strong>SalonApp.pro</strong>. За въпроси, свързани с
            обработката на лични данни, можете да се свържете с нас на:{" "}
            <a href="mailto:salonapppro@gmail.com" className="text-amber-700 underline">
              salonapppro@gmail.com
            </a>
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-xl font-semibold">2. Какви данни събираме</h2>
          <p className="mb-2">В зависимост от начина на използване на платформата, обработваме следните категории данни:</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              <strong>Клиенти на салоните:</strong> Три имена, телефонен номер, имейл адрес, история
              на резервациите и бележки, въведени от салона.
            </li>
            <li>
              <strong>Собственици на салони:</strong> Имейл адрес, информация за салона (наименование,
              работно време, услуги), данни за плащане (обработвани от Stripe).
            </li>
            <li>
              <strong>Посетители на уебсайта:</strong> IP адрес, тип на браузъра, страниците, които
              сте посетили (за аналитични цели).
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-3 text-xl font-semibold">3. Цел и правно основание</h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>Изпълнение на договор (чл. 6, ал. 1, б. „б" ОРЗД):</strong> Управление на
              резервации, изпращане на потвърждения и напомняния.
            </li>
            <li>
              <strong>Легитимен интерес (чл. 6, ал. 1, б. „е" ОРЗД):</strong> Защита от измами,
              сигурност на платформата, аналитика за подобряване на услугата.
            </li>
            <li>
              <strong>Съгласие (чл. 6, ал. 1, б. „а" ОРЗД):</strong> При изпращане на маркетингови
              съобщения (само ако сте дали изрично съгласие).
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-3 text-xl font-semibold">4. Срок на съхранение</h2>
          <p>
            Данните за резервации и клиенти се съхраняват за срок от <strong>3 години</strong> от
            последната активност, след което се изтриват автоматично. При закриване на акаунт на
            салона данните се изтриват в срок до 30 дни.
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-xl font-semibold">5. Получатели на данните</h2>
          <p className="mb-2">Данните ви могат да бъдат споделяни с:</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              <strong>Supabase Inc.</strong> — доставчик на база данни (EU региони).
            </li>
            <li>
              <strong>Vercel Inc.</strong> — хостинг на платформата.
            </li>
            <li>
              <strong>Stripe Inc.</strong> — обработка на плащания (само за собственици на салони).
            </li>
            <li>
              <strong>Resend Inc.</strong> — изпращане на имейли.
            </li>
          </ul>
          <p className="mt-2">
            Всички доставчици са сертифицирани по стандарти, съвместими с ОРЗД, и са обвързани с
            договори за обработка на данни.
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-xl font-semibold">6. Вашите права</h2>
          <p className="mb-2">Съгласно ОРЗД имате следните права:</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              <strong>Право на достъп</strong> — да получите копие на данните, които съхраняваме за
              вас.
            </li>
            <li>
              <strong>Право на коригиране</strong> — да поискате поправка на неточни данни.
            </li>
            <li>
              <strong>Право на изтриване („право да бъдете забравени")</strong> — да поискате
              изтриване на личните ви данни.
            </li>
            <li>
              <strong>Право на ограничаване</strong> — да поискате ограничаване на обработката.
            </li>
            <li>
              <strong>Право на преносимост</strong> — да получите данните си в машинно четим формат.
            </li>
            <li>
              <strong>Право на възражение</strong> — да се противопоставите на обработката при
              легитимен интерес.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-3 text-xl font-semibold">7. Как да упражните правата си</h2>
          <p className="mb-3">
            Изпратете имейл до{" "}
            <a href="mailto:salonapppro@gmail.com" className="text-amber-700 underline">
              salonapppro@gmail.com
            </a>{" "}
            с вашето искане. Отговаряме в срок до <strong>30 дни</strong>.
          </p>
          <p>
            Можете да подадете и{" "}
            <Link href="/privacy/delete-request" className="text-amber-700 underline">
              онлайн заявка за изтриване на данните
            </Link>
            .
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-xl font-semibold">8. Жалби</h2>
          <p>
            Имате право да подадете жалба до Комисията за защита на личните данни (КЗЛД) на адрес:{" "}
            <strong>гр. София 1592, бул. „Проф. Цветан Лазаров" № 2</strong>, уебсайт:{" "}
            <a
              href="https://www.cpdp.bg"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-700 underline"
            >
              www.cpdp.bg
            </a>
            .
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-xl font-semibold">9. Бисквитки (Cookies)</h2>
          <p>
            Използваме само функционални бисквитки, необходими за работата на платформата (сесия за
            автентикация). Не използваме проследяващи или рекламни бисквитки без вашето съгласие.
          </p>
        </div>
      </section>
    </main>
  );
}
