import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";
import { SUPER_ADMIN_SALON_COOKIE } from "@/lib/admin-tenant";
import { performSalonSlugRename } from "@/lib/perform-salon-slug-rename";
import { requireSuperAdminForApi } from "@/lib/super-admin-auth";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const Body = z.object({
  old_salon_slug: z.string().min(2).max(64).regex(SLUG, "Невалиден стар адрес."),
  new_salon_slug: z
    .string()
    .min(2)
    .max(64)
    .regex(SLUG, "Само малки латински букви, цифри и тирета."),
});

function statusForRenameError(msg: string): number {
  if (msg.includes("вече е зает")) return 409;
  if (msg.includes("Storage") || msg.includes("базата")) return 500;
  return 400;
}

/** Смяна на публичния slug — само super_admin. Салонският /admin вече няма тази опция. */
export async function POST(req: Request) {
  const auth = await requireSuperAdminForApi();
  if (!auth.ok) return auth.response;

  const body = (await req.json().catch(() => null)) as unknown;
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Невалидни данни" },
      { status: 400 }
    );
  }
  const { old_salon_slug: oldSlug, new_salon_slug: newSlug } = parsed.data;
  if (newSlug === oldSlug) {
    return NextResponse.json({ error: "Новият адрес съвпада с текущия." }, { status: 400 });
  }

  const admin = createSupabaseServiceRoleClient();
  const { error } = await performSalonSlugRename(admin, oldSlug, newSlug);
  if (error) {
    return NextResponse.json({ error }, { status: statusForRenameError(error) });
  }

  const res = NextResponse.json({ ok: true, new_salon_slug: newSlug, old_salon_slug: oldSlug });
  const store = await cookies();
  if (store.get(SUPER_ADMIN_SALON_COOKIE)?.value === oldSlug) {
    res.cookies.set(SUPER_ADMIN_SALON_COOKIE, newSlug, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }
  return res;
}
