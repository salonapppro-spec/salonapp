/**
 * Masks email for public API hints — enough for the client to recognize their
 * address without exposing full PII to phone-number enumeration attacks.
 */
export function maskEmailForPublicHint(email: string | null | undefined): string | null {
  if (!email) return null;
  const trimmed = email.trim();
  if (!trimmed) return null;

  const at = trimmed.indexOf("@");
  if (at <= 0) return "***";

  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  if (!domain) return "***";

  const maskedLocal = local.length <= 1 ? "*" : `${local[0]}***`;
  const dot = domain.lastIndexOf(".");
  if (dot <= 0) {
    return `${maskedLocal}@${domain[0] ?? "*"}***`;
  }

  const domainName = domain.slice(0, dot);
  const tld = domain.slice(dot);
  const maskedDomain = domainName.length <= 1 ? `*${tld}` : `${domainName[0]}***${tld}`;

  return `${maskedLocal}@${maskedDomain}`;
}
