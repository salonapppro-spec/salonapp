import Link from "next/link";

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const booking = typeof sp.booking === "string" ? sp.booking : null;
  const token = typeof sp.token === "string" ? sp.token : null;

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-xl font-semibold text-brand-900">Отписване от имейли</h1>
      <p className="mt-4 text-sm leading-relaxed text-brand-800/90">
        Заявката за отписване е регистрирана за тази резервация. Ако имате нужда от промени, свържете се директно с
        салона.
      </p>
      {booking && token ? (
        <p className="mt-2 text-xs text-brand-600">Референция: {booking.slice(0, 8)}…</p>
      ) : null}
      <Link href="/" className="mt-8 inline-block text-sm font-medium text-brand-700 underline">
        Към началото
      </Link>
    </div>
  );
}
