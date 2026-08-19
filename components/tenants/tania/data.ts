import type { Service } from "@/types/database";

export const BGN_RATE = 1.956;

/** Локални снимки на клиента (same-origin → минават production CSP-то). */
export const TANIA_IMG = {
  hero: "/tenants/tania/hero.webp",
  salon: "/tenants/tania/salon.webp",
  tanya: "/tenants/tania/tanya.webp",
} as const;

export const TANIA_GALLERY: { src: string; alt: string }[] = [
  { src: "/tenants/tania/g-updo-caramel.webp", alt: "Полуприбрана прическа с плитка и едри къдрици в карамелен нюанс" },
  { src: "/tenants/tania/g-color-2.webp", alt: "Късо каре, боядисано в наситено медночервено" },
  { src: "/tenants/tania/g-updo-3.webp", alt: "Дълга кестенява коса с къдрици, оформени с маша" },
  { src: "/tenants/tania/g-color-pink.webp", alt: "Дълга изправена коса с преход от русо към розово" },
  { src: "/tenants/tania/g-color-1.webp", alt: "Дълга изсветлена коса в платинено русо, изсушена и изправена" },
  { src: "/tenants/tania/g-updo-2.webp", alt: "Прибрана официална прическа с дребни къдрици" },
  { src: "/tenants/tania/g-kid-1.webp", alt: "Детско подстригване с преход и късо оформени страни" },
  { src: "/tenants/tania/g-color-3.webp", alt: "Дълга коса, боядисана в ярко червено" },
  { src: "/tenants/tania/g-kid-2.webp", alt: "Момчешко подстригване с обем отгоре и преход отстрани" },
];

export const TANIA_BEFORE_AFTER: {
  title: string;
  note: string;
  before: { src: string; alt: string };
  after: { src: string; alt: string };
}[] = [
  {
    title: "Подстригване в каре",
    note: "От неравна дължина към оформено градуирано каре",
    before: { src: "/tenants/tania/ba-cut-before.webp", alt: "Мокра коса преди подстригване, с неравна дължина и изтънели краища" },
    after: { src: "/tenants/tania/ba-cut-after.webp", alt: "Същата коса след подстригване — гладко градуирано каре" },
  },
  {
    title: "Изсветляване",
    note: "От тъмна основа към топло медено русо",
    before: { src: "/tenants/tania/ba-blonde-before.webp", alt: "Дълга тъмнокестенява коса преди изсветляване" },
    after: { src: "/tenants/tania/ba-blonde-after.webp", alt: "Същата коса след изсветляване — топло медено русо по цялата дължина" },
  },
];

/**
 * Групиране на ценоразписа. Услугите в базата са именувани „Категория — вариант“,
 * затова подредбата тук е по префикс. Услуга, преименувана от админ панела и
 * непопадаща в никоя група, се показва в „Други услуги“ — нищо не се губи.
 */
export const TANIA_CATEGORIES: { title: string; match: RegExp }[] = [
  { title: "Подстригване", match: /^Подстригване/i },
  { title: "Изсушаване", match: /^Изсушаване/i },
  { title: "Изправяне с преса", match: /^Изправяне с преса/i },
  { title: "Боядисване", match: /^Боядисване/i },
  { title: "Кичури с фолио", match: /^Кичури с фолио/i },
  { title: "Кичури с шапка", match: /^Кичури с шапка/i },
  { title: "Къдрене", match: /^Къдрене/i },
  { title: "Официални прически", match: /^Официал/i },
  { title: "Измиване и стилизиране", match: /^(Измиване|Оформяне)/i },
  { title: "Брада, мустак и вежди", match: /^(Брада|Мустак|Врат|Вежди)/i },
];

/** Услуги, чиято цена в ценоразписа е начална („от …“), не фиксирана. */
export const TANIA_FROM_PRICE = new Set(["Оформяне с маша", "Официална прическа"]);

/** Услуги без обявена цена — правят се след консултация (от листа на салона). */
export const TANIA_ON_REQUEST: { name: string; note: string }[] = [
  { name: "Балеаж", note: "Цената зависи от дължината и текущия цвят" },
  { name: "AIR TOUCH", note: "Техника за мек преход, по индивидуален план" },
  { name: "Колористика", note: "Индивидуален цветови план след консултация" },
  { name: "SCALPCLINIX", note: "Терапия за скалпа" },
  { name: "FIBRECLINIX", note: "Възстановяваща терапия за косъма" },
  { name: "ABC MEMENTO SPA", note: "СПА терапия за коса" },
  { name: "FIDE TRIBAL", note: "Терапия за коса" },
];

export type ServiceGroup = { title: string; items: Service[] };

/** Подрежда активните услуги по категориите по-горе, със запазен ред от базата. */
export function groupServices(services: Service[]): ServiceGroup[] {
  const active = services.filter((s) => s.is_active);
  const used = new Set<string>();
  const groups: ServiceGroup[] = [];

  for (const cat of TANIA_CATEGORIES) {
    const items = active.filter((s) => cat.match.test(s.name.trim()));
    for (const s of items) used.add(s.id);
    if (items.length > 0) groups.push({ title: cat.title, items });
  }

  const rest = active.filter((s) => !used.has(s.id));
  if (rest.length > 0) groups.push({ title: "Други услуги", items: rest });

  return groups;
}

/** „15 €“ / „от 20 €“ — цената в евро, с маркер за начална цена. */
export function eurLabel(s: Service): string {
  const value = Number(s.price_eur);
  const prefix = TANIA_FROM_PRICE.has(s.name.trim()) ? "от " : "";
  return `${prefix}${value.toFixed(0)} €`;
}

/** Левовата равностойност по фиксирания курс. */
export function bgnLabel(s: Service): string {
  return `${(Number(s.price_eur) * BGN_RATE).toFixed(2)} лв`;
}

export function durationLabel(min: number | null): string | null {
  if (!min || min <= 0) return null;
  if (min < 60) return `${min} мин`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} ч` : `${h} ч ${m} мин`;
}

/**
 * Име без префикса — само когато префиксът е точно заглавието на групата
 * („Подстригване“ → „Подстригване — мъжко“ става „мъжко“). В смесена група
 * пълното име остава, за да не се получат две еднакви „средна коса“.
 */
export function shortName(name: string, groupTitle: string): string {
  const trimmed = name.trim();
  const prefix = `${groupTitle} — `;
  return trimmed.startsWith(prefix) ? trimmed.slice(prefix.length) : trimmed;
}

const DAY_LABELS = ["Неделя", "Понеделник", "Вторник", "Сряда", "Четвъртък", "Петък", "Събота"];
/** Показваме седмицата от понеделник. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

export function dayLabel(dayOfWeek: number): string {
  return DAY_LABELS[dayOfWeek] ?? "";
}

export function hhmm(t: string | null | undefined): string {
  if (!t) return "";
  return t.slice(0, 5);
}
