import type { AuthError } from "@supabase/supabase-js";

/** Human-readable error message for sign-in failures. */
export function formatAuthSignInError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  const code = typeof err === "object" && err && "code" in err ? String((err as AuthError).code ?? "") : "";

  if (code === "invalid_credentials" || raw === "Invalid login credentials" || raw.includes("Invalid login credentials")) {
    return "Невалиден имейл или парола.";
  }

  if (raw.toLowerCase().includes("email not confirmed")) {
    return "Имейлът не е потвърден. Провери пощата си за линк за потвърждение.";
  }

  return raw;
}
