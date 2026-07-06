/**
 * Детекция на правописни грешки в имейл домейни ("abv.bgg", "gmial.com"…).
 * Чисто клиентска помощ — не блокира submit, само предлага корекция.
 */

const KNOWN_DOMAINS = [
  "abv.bg",
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "icloud.com",
  "mail.bg",
  "dir.bg",
  "gbg.bg",
  "proton.me",
  "protonmail.com",
  "live.com",
  "abv.com", // реален, но често бъркан с abv.bg — оставяме го като валиден
] as const;

/** Класическо Levenshtein разстояние (без оптимизации — домейните са кратки). */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const row = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = row[j];
      row[j] = Math.min(
        row[j] + 1,
        row[j - 1] + 1,
        prev + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      prev = tmp;
    }
  }
  return row[n];
}

/**
 * Клиентска проверка дали низът изобщо прилича на имейл (има @, домейн с
 * точка и поне 2 знака след нея). Сървърната истина е Zod схемата —
 * това е само за да не пуска формата "няколко букви" като имейл.
 */
export function isLikelyValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

/**
 * Връща предложение за коригиран имейл или null.
 * - точно съвпадение с познат домейн → null (всичко е наред)
 * - близък до познат домейн (разстояние 1–2) → предлага корекцията
 * - непознат, но далечен домейн (фирмен и т.н.) → null (не спамим)
 */
export function suggestEmailFix(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.lastIndexOf("@");
  if (at <= 0 || at === trimmed.length - 1) return null;

  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  if (domain.length < 5 || !domain.includes(".")) return null;

  if ((KNOWN_DOMAINS as readonly string[]).includes(domain)) return null;

  let best: string | null = null;
  let bestDist = 3; // приемаме само разстояние 1–2
  for (const known of KNOWN_DOMAINS) {
    const d = levenshtein(domain, known);
    if (d < bestDist) {
      bestDist = d;
      best = known;
    }
  }
  return best ? `${local}@${best}` : null;
}
