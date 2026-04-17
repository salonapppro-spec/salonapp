import type { AuthError } from "@supabase/supabase-js";

/** Човешко съобщение за грешка при вход (Supabase често връща само английски текст). */
export function formatAuthSignInError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  const code = typeof err === "object" && err && "code" in err ? String((err as AuthError).code ?? "") : "";

  if (code === "invalid_credentials" || raw === "Invalid login credentials" || raw.includes("Invalid login credentials")) {
    return [
      "Невалиден имейл или парола.",
      "Ако салонският акаунт е създаден от „Нов тенант“, паролата не се въвежда на ръка — в имейла „Добре дошли“ трябва да има линк „Задай парола“.",
      "Провери също дали потребителят съществува в същия Supabase проект като приложението (Vercel env) и дали имейлът е потвърден, ако в Authentication е включено потвърждение.",
    ].join(" ");
  }

  if (raw.toLowerCase().includes("email not confirmed")) {
    return "Имейлът не е потвърден. В Supabase: Authentication → Providers → Email — или потвърди от пощата, или временно изключи „Confirm email“ за тест.";
  }

  return raw;
}
