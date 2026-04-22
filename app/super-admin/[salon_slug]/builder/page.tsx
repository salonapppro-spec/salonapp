import { randomBytes } from "crypto";
import { notFound } from "next/navigation";
import Link from "next/link";

import { BuilderClient } from "./BuilderClient";
import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";
import { mergeTokens } from "@/lib/design-tokens";
import type { Tenant } from "@/types";

export default async function BuilderPage({
  params,
}: {
  params: Promise<{ salon_slug: string }>;
}) {
  const { salon_slug } = await params;
  const supabase = createSupabaseServiceRoleClient();
  const { data } = await supabase.from("tenants").select("*").eq("salon_slug", salon_slug).maybeSingle();
  const tenant = data as (Tenant & { design_tokens?: Record<string, unknown> | null }) | null;
  if (!tenant) notFound();

  const initialTokens = mergeTokens(
    tenant.design_tokens as Parameters<typeof mergeTokens>[0] ?? null
  );

  const initialContent = {
    salonName:    tenant.salon_name      ?? "",
    logoUrl:      tenant.logo_url        ?? "",
    heroTitle:    tenant.hero_title      ?? "",
    heroSubtitle: tenant.hero_subtitle   ?? "",
    heroImageUrl: tenant.hero_image_url  ?? "",
    description:  tenant.description     ?? "",
    aboutText1:   tenant.about_text1     ?? "",
    aboutText2:   tenant.about_text2     ?? "",
    aboutImageUrl: tenant.about_image_url ?? "",
  };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const basePreview = appUrl
    ? `https://${salon_slug}.salonapp.pro`
    : `https://salonapp-ten.vercel.app/${salon_slug}`;

  const previewToken = randomBytes(16).toString("hex");
  const previewWithToken = (() => {
    try {
      const u = new URL(basePreview);
      u.searchParams.set("builderPreview", "1");
      u.searchParams.set("pt", previewToken);
      return u.toString();
    } catch {
      const sep = basePreview.includes("?") ? "&" : "?";
      return `${basePreview}${sep}builderPreview=1&pt=${encodeURIComponent(previewToken)}`;
    }
  })();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-sm text-neutral-500">
        <Link href="/super-admin" className="hover:text-neutral-300">Супер-админ</Link>
        <span>/</span>
        <Link href={`/super-admin/${salon_slug}`} className="hover:text-neutral-300">{tenant.salon_name}</Link>
        <span>/</span>
        <span className="text-neutral-300">Visual Builder</span>
      </div>

      <BuilderClient
        salonSlug={salon_slug}
        salonName={tenant.salon_name}
        initialTokens={initialTokens}
        initialContent={initialContent}
        previewUrl={previewWithToken}
        previewToken={previewToken}
      />
    </div>
  );
}
