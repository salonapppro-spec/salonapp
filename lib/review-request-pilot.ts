/**
 * Пилот: post-visit имейл „Оставете отзив" — само за изрично изброени тенанти.
 * Подарък/тест преди да стане платена функционалност с per-tenant настройка в базата.
 * Изпраща се от cron-а за напомняния на сутринта след посещение със статус „Яви се".
 */
export const REVIEW_REQUEST_PILOT: Record<string, { reviewUrl: string }> = {
  // Българското търсене (от собственика) — показва бизнес картата с бутон „Напишете отзив".
  // TODO: смяна с direct write-review линк (search.google.com/local/writereview?placeid=…),
  // когато ATS дадат Google Business профила си.
  "ats-massage": {
    reviewUrl:
      "https://www.google.com/search?q=%D0%BE%D1%82%D0%B7%D0%B8%D0%B2%D0%B8+%D0%B7%D0%B0+ats+studio+%D0%B1%D1%83%D1%80%D0%B3%D0%B0%D1%81",
  },
};
