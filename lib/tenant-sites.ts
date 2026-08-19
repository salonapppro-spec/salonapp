import type { ComponentType } from "react";

import { PawEmpire } from "@/components/paw-empire/PawEmpireSite";
import { TheBeastSite } from "@/components/tenants/TheBeastSite";
import { EuphoriaSite } from "@/components/tenants/euphoria/Page";
import { LindySite } from "@/components/tenants/lindy/Page";
import { TheSkinSite } from "@/components/tenants/theskin/Page";
import { MagneticEyesSite } from "@/components/tenants/magnetic-eyes/Page";
import { AtsMassageSite } from "@/components/tenants/ats-massage/Page";
import { TaniaSite } from "@/components/tenants/tania/Page";
import type { SalonData } from "@/types/database";

import { hasTenantSite, TENANT_SITE_SLUGS } from "./tenant-site-slugs";

export type TenantSiteComponent = ComponentType<{ data: SalonData }>;

export { hasTenantSite, TENANT_SITE_SLUGS };

const TENANT_SITE_COMPONENTS: Record<string, TenantSiteComponent> = {
  "paw-empire": PawEmpire,
  thebeast: TheBeastSite,
  euphoria: EuphoriaSite,
  lindynails: LindySite,
  theskin: TheSkinSite,
  "magnetic-eyes": MagneticEyesSite,
  "ats-massage": AtsMassageSite,
  tania: TaniaSite,
};

export function getTenantSite(slug: string): TenantSiteComponent | undefined {
  if (!hasTenantSite(slug)) return undefined;
  return TENANT_SITE_COMPONENTS[slug];
}
