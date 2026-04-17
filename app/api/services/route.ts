import { NextResponse } from "next/server";
import { z } from "zod";

import { getServices } from "@/lib/data";

const QuerySchema = z.object({
  salon_slug: z.string().min(1),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({ salon_slug: url.searchParams.get("salon_slug") ?? "" });
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing salon_slug" }, { status: 400 });
  }

  const services = await getServices(parsed.data.salon_slug);
  return NextResponse.json({ services });
}

