import { readPublicPlanPriceCurrency, readPublicPlanPriceMonthly } from "@/lib/marketing-pricing-env";

/** Планове — синхрон с `tenants.plan`, Stripe и MASTER таблицата. */

export type PlanId = "starter" | "standard" | "pro" | "premium";

export const PLAN_IDS: PlanId[] = ["starter", "standard", "pro", "premium"];

export function parsePlanId(raw: string | undefined | null): PlanId | undefined {
  if (!raw) return undefined;
  return PLAN_IDS.includes(raw as PlanId) ? (raw as PlanId) : undefined;
}

/** true = вкл., false = изкл., string = пояснение (напр. „+5.99€/спец.") */
export type PlanCompareCell = boolean | string;

export type PlanComparisonRow = {
  label: string;
  values: Record<PlanId, PlanCompareCell>;
};

export type MarketingPlan = {
  id: PlanId;
  name: string;
  tagline: string;
  priceMonthly: number;
  priceCurrency: string;
  periodLabel: string;
  highlighted?: boolean;
  /** Кратки точки за картите под таблицата */
  cardBullets: string[];
};

const PLAN_BASE: Array<Omit<MarketingPlan, "priceMonthly" | "priceCurrency">> = [
  {
    id: "starter",
    name: "Стартер",
    tagline: "Един специалист, пълен старт",
    periodLabel: "на месец",
    cardBullets: [
      "1 специалист, сайт на субдомейн (*.salonapp.pro)",
      "Резервации, имейл 24ч, финанси + ABC, клиенти + CSV, магнитен график",
      "Без паралелни услуги, без разширени отчети и SMS",
    ],
  },
  {
    id: "standard",
    name: "Стандарт",
    tagline: "Най-популярният избор",
    periodLabel: "на месец",
    highlighted: true,
    cardBullets: [
      "Всичко от Стартер + паралелни услуги и прозорец за втори клиент",
      "Разширен финансов тракер, месечни и годишни отчети",
      "«Момичетата с Бизнес» · приоритет при поддръжка",
    ],
  },
  {
    id: "pro",
    name: "Про",
    tagline: "Бранд и канали",
    periodLabel: "на месец",
    cardBullets: [
      "Имейл след посещение за събиране на отзиви (Google/Facebook)",
      "Собствен домейн при годишно плащане (екипът купува и управлява)",
      "SMS/Viber напомняния 24ч включени",
      "Google SEO + физически обект, всички възможности на Стандарт",
    ],
  },
  {
    id: "premium",
    name: "Премиум",
    tagline: "Екип без централен собственик",
    periodLabel: "на месец",
    cardBullets: [
      "До 3 специалиста — отделни админ панели и графици, общ сайт",
      "Технически админ само за плащане — без достъп до чужди резервации",
      "SMS/Viber: +5.99€ на специалист; субдомейн на платформата",
    ],
  },
];

function buildMarketingPlans(): MarketingPlan[] {
  const currency = readPublicPlanPriceCurrency();
  return PLAN_BASE.map((p) => ({
    ...p,
    priceMonthly: readPublicPlanPriceMonthly(p.id),
    priceCurrency: currency,
  }));
}

export const MARKETING_PLANS: MarketingPlan[] = buildMarketingPlans();

/** Редове 1:1 с MASTER таблицата „Четирите абонаментни плана". Цените в първия ред идват от `MARKETING_PLANS` при рендер. */
export const PLAN_COMPARISON_ROWS: PlanComparisonRow[] = [
  {
    label: "Специалисти",
    values: {
      starter: "1",
      standard: "1",
      pro: "1",
      premium: "До 3 (отделни панели и графици, общ сайт)",
    },
  },
  {
    label: "Домейн",
    values: {
      starter: "Субдомейн",
      standard: "Субдомейн",
      pro: "Собствен (годишно)",
      premium: "Субдомейн",
    },
  },
  {
    label: "Онлайн резервации",
    values: { starter: true, standard: true, pro: true, premium: true },
  },
  {
    label: "Имейл напомняния 24ч",
    values: { starter: true, standard: true, pro: true, premium: true },
  },
  {
    label: "Финансов панел + ABC",
    values: { starter: true, standard: true, pro: true, premium: true },
  },
  {
    label: "Клиентска база + CSV",
    values: { starter: true, standard: true, pro: true, premium: true },
  },
  {
    label: "Магнитен график",
    values: { starter: true, standard: true, pro: true, premium: true },
  },
  {
    label: "Паралелни услуги",
    values: { starter: false, standard: true, pro: true, premium: true },
  },
  {
    label: "Разширен финансов тракер",
    values: { starter: false, standard: true, pro: true, premium: true },
  },
  {
    label: "Месечни и годишни отчети",
    values: { starter: false, standard: true, pro: true, premium: true },
  },
  {
    label: "Момичетата с Бизнес",
    values: { starter: false, standard: true, pro: true, premium: false },
  },
  {
    label: "SMS / Viber (24ч)",
    values: {
      starter: false,
      standard: false,
      pro: true,
      premium: "+5.99€ / специалист",
    },
  },
  {
    label: "Google SEO + физически обект",
    values: { starter: false, standard: false, pro: true, premium: false },
  },
  {
    label: "Имейл след посещение за отзиви (Google/Facebook)",
    values: { starter: false, standard: false, pro: true, premium: true },
  },
];

export type MarketingTemplateId = "bloom" | "luxe" | "clean" | "zen" | "bold";

export const MARKETING_TEMPLATES: ReadonlyArray<{
  id: MarketingTemplateId;
  name: string;
  forWho: string;
  vibe: string;
  fonts: string;
}> = [
  {
    id: "bloom",
    name: "Bloom",
    forWho: "Маникюр, козметика, педикюр",
    vibe: "Топъл, женствен — праскова, бежово, кремав фон, меки сенки.",
    fonts: "Playfair Display + Lato",
  },
  {
    id: "luxe",
    name: "Luxe",
    forWho: "Висок клас салони, перманентен грим",
    vibe: "Минимализъм, черно и злато, много whitespace, outline бутони.",
    fonts: "Cormorant Garamond + Montserrat",
  },
  {
    id: "clean",
    name: "Clean",
    forWho: "Фризьорски салони, барбершопове",
    vibe: "Бяло и сиво, син акцент, таблични услуги, прави бутони.",
    fonts: "Inter",
  },
  {
    id: "zen",
    name: "Zen",
    forWho: "Масаж, SPA, холистични центрове",
    vibe: "Шалвия зелено, бежов фон, разредени карти, спокойна галерия.",
    fonts: "Nunito Sans",
  },
  {
    id: "bold",
    name: "Bold",
    forWho: "Барбер, nail art, tattoo",
    vibe: "Тъмен фон, ярък червен акцент, компактни карти, динамични заглавия.",
    fonts: "Oswald + Source Sans Pro",
  },
];

export const MARKETING_AUDIENCES = [
  "Маникюристи и педикюристи",
  "Фризьорски салони",
  "Козметолози и естетисти",
  "Масажни студиа и SPA",
  "Перманентен грим, микроблейдинг, вежди, мигли",
] as const;

export const MARKETING_FUTURE_VERTICALS =
  "В бъдеще планираме и други сектори със записване на час — ветеринари, зъболекари, психотерапевти.";

export type MarketingFeatureIcon = "calendar" | "admin" | "shield" | "growth";

export const MARKETING_FEATURES: ReadonlyArray<{
  title: string;
  body: string;
  icon: MarketingFeatureIcon;
}> = [
  {
    icon: "calendar",
    title: "Резервации без хаос в чатовете",
    body: "Клиентът вижда реални свободни часове според графика, буферите и блоковете — директно от сайта на салона.",
  },
  {
    icon: "admin",
    title: "Бърз старт за нов салон",
    body: "След като ви включим, управлявате всичко от едно място — удобно на телефон за екипа в движение.",
  },
  {
    icon: "shield",
    title: "Сигурност и поверителност",
    body: "Данните на вашия салон са отделени от други клиенти. Работим с практики, съвместими с изискванията за защита на данни в ЕС.",
  },
  {
    icon: "growth",
    title: "От прости до сложни услуги",
    body: "Прост режим с минути и цена, или сложен с фази и магнитен график; от Про нагоре — паралелни услуги в прозореца на изчакване.",
  },
];

export const GET_STARTED_STEP_LABELS = [
  { step: 1, label: "Избор на план" },
  { step: 2, label: "Данни за салона" },
  { step: 3, label: "Потвърждение" },
] as const;
