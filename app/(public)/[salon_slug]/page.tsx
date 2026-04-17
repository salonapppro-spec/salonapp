import { notFound } from "next/navigation";

import type { Template } from "@/types";
import { getGallery, getServices } from "@/lib/data";
import { getTenant } from "@/lib/tenant";
import { BloomTemplate } from "@/components/templates/BloomTemplate";
import { LuxeTemplate } from "@/components/templates/LuxeTemplate";
import { CleanTemplate } from "@/components/templates/CleanTemplate";
import { ZenTemplate } from "@/components/templates/ZenTemplate";
import { BoldTemplate } from "@/components/templates/BoldTemplate";

function renderTemplate(template: Template, props: Parameters<typeof BloomTemplate>[0]) {
  switch (template) {
    case "bloom":
      return <BloomTemplate {...props} />;
    case "luxe":
      return <LuxeTemplate {...props} />;
    case "clean":
      return <CleanTemplate {...props} />;
    case "zen":
      return <ZenTemplate {...props} />;
    case "bold":
      return <BoldTemplate {...props} />;
    default:
      return <BloomTemplate {...props} />;
  }
}

export default async function PublicSalonPage(props: { params: Promise<{ salon_slug: string }> }) {
  const { salon_slug } = await props.params;

  const tenant = await getTenant(salon_slug).catch(() => null);
  if (!tenant) notFound();

  const [services, gallery] = await Promise.all([getServices(salon_slug), getGallery(salon_slug)]);

  return renderTemplate(tenant.template, { tenant, services, gallery });
}

