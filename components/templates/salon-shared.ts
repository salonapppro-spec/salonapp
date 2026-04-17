import type { SalonData } from "@/types/database";
import type { Service, Specialist } from "@/types";

export const WEEKDAY_LABELS_SHORT = ["Нед", "Пон", "Вто", "Сря", "Чет", "Пет", "Съб"] as const;

export function activeSpecialists(data: SalonData): Specialist[] {
  return (data.specialists ?? []).filter((s) => s.is_active);
}

/** Колектив с повече от един активен специалист → секции по човек на публичната страница. */
export function useSpecialistSectionsOnPublicSite(data: SalonData): boolean {
  return data.tenant.plan === "collective" && activeSpecialists(data).length > 1;
}

export function servicesForSpecialist(data: SalonData, specialistId: string): Service[] {
  return data.services.filter((s) => s.specialist_id === specialistId);
}

/** Един „общ“ списък: не-колектив или един специалист — всички услуги на салона. */
export function servicesFlatForPublic(data: SalonData): Service[] {
  return data.services;
}
