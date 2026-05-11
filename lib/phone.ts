/**
 * Normalizes a phone number to a canonical form for deduplication.
 *
 * Bulgarian mobile numbers (08XXXXXXXX) are converted to E.164 (+3598XXXXXXXX).
 * Formatting characters (spaces, dashes, parentheses, dots) are stripped.
 * Other international numbers are kept stripped but otherwise unchanged.
 *
 * Examples:
 *   "0888 123 456"   → "+359888123456"
 *   "+359888123456"  → "+359888123456"
 *   "00359888123456" → "+359888123456"
 *   "+359 88 123 456"→ "+359888123456"
 *   "02 987 654"     → "02987654"  (landline, kept as-is)
 */
export function normalizePhone(raw: string): string {
  if (!raw) return "";
  // Strip formatting characters
  let p = raw.replace(/[\s\-().]/g, "").trim();
  if (!p) return "";

  // 00359XXXXXXX → +359XXXXXXX
  if (p.startsWith("00359")) {
    p = "+" + p.slice(2);
    return p;
  }

  // 08XXXXXXXX (Bulgarian 10-digit mobile) → +3598XXXXXXXX
  if (/^08\d{8}$/.test(p)) {
    p = "+359" + p.slice(1);
    return p;
  }

  return p;
}
