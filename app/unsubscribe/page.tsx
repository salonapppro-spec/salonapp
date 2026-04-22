import Link from "next/link";

import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";

async function processUnsubscribe(
  bookingId: string,
  token: string
): Promise<"ok" | "invalid" | "already"> {
  const supabase = createSupabaseServiceRoleClient();

  const { data, error } = await supabase
    .from("bookings")
    .select("id, email_unsubscribed")
    .eq("id", bookingId)
    .eq("unsubscribe_token", token)
    .maybeSingle();

  if (error || !data) return "invalid";
  if (data.email_unsubscribed) return "already";

  const { error: updateError } = await supabase
    .from("bookings")
    .update({ email_unsubscribed: true })
    .eq("id", data.id);

  if (updateError) return "invalid";
  return "ok";
}

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const bookingId = typeof sp.booking === "string" ? sp.booking : null;
  const token = typeof sp.token === "string" ? sp.token : null;

  let status: "ok" | "invalid" | "already" | "no_params" = "no_params";
  if (bookingId && token) {
    status = await processUnsubscribe(bookingId, token);
  }

  const messages = {
    ok: {
      title: "Отписан успешно",
      body: "Заявката е регистрирана. Няма да получавате повече напомнящи имейли за тази резервация.",
    },
    already: {
      title: "Вече отписан",
      body: "Вече сте отписани от напомнящите имейли за тази резервация.",
    },
    invalid: {
      title: "Невалиден линк",
      body: "Линкът е невалиден или вече е изтекъл. Свържете се директно със салона.",
    },
    no_params: {
      title: "Невалиден линк",
      body: "Липсват необходимите параметри. Моля, използвайте линка от имейла.",
    },
  };

  const { title, body } = messages[status];

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-xl font-semibold text-brand-900">{title}</h1>
      <p className="mt-4 text-sm leading-relaxed text-brand-800/90">{body}</p>
      {bookingId && status === "ok" ? (
        <p className="mt-2 text-xs text-brand-600">Референция: {bookingId.slice(0, 8)}…</p>
      ) : null}
      <Link href="/" className="mt-8 inline-block text-sm font-medium text-brand-700 underline">
        Към началото
      </Link>
    </div>
  );
}
