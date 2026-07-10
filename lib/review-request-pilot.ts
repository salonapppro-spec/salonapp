/**
 * Пилот: post-visit имейл „Оставете отзив" — само за изрично изброени тенанти.
 * Подарък/тест преди да стане платена функционалност с per-tenant настройка в базата.
 * Изпраща се от cron-а за напомняния на сутринта след посещение със статус „Яви се".
 */
export const REVIEW_REQUEST_PILOT: Record<string, { reviewUrl: string }> = {
  // Същият линк като в секция „Отзиви" на сайта им (components/tenants/ats-massage/Page.tsx).
  "ats-massage": {
    reviewUrl: "https://www.google.com/search?q=ATS+Studio+Burgas+reviews",
  },
};
