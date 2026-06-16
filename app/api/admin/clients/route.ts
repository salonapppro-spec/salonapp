import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminCapabilityForApi } from "@/lib/admin-rbac";
import { tenantDb } from "@/lib/tenant-db";
import { normalizePhone } from "@/lib/phone";

const CreateSchema = z.object({
  name: z.string().min(1, "Името е задължително"),
  phone: z.string().min(4, "Телефонът е задължителен"),
  email: z.union([z.string().email(), z.literal(""), z.null()]).optional(),
  notes: z.string().max(5000).optional(),
});

export async function POST(req: Request) {
  const a = await requireAdminCapabilityForApi("clients_write");
  if (!a.ok) return a.response;
  const salonSlug = a.slug;

  const body = (await req.json().catch(() => null)) as unknown;
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ error: first?.message ?? "Невалидни данни" }, { status: 400 });
  }

  const rawPhone = parsed.data.phone.trim();
  const { data, error } = await tenantDb(salonSlug).clients.create({
    name: parsed.data.name.trim(),
    phone: normalizePhone(rawPhone) || rawPhone,
    email: parsed.data.email || null,
    notes: parsed.data.notes || null,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Клиент с този телефон вече съществува." }, { status: 409 });
    }
    return NextResponse.json({ error: "Грешка при запис" }, { status: 500 });
  }

  return NextResponse.json({ client: data }, { status: 201 });
}
