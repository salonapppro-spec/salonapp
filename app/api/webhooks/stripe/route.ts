import Stripe from "stripe";
import { NextResponse } from "next/server";

import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";

/**
 * Stripe Webhook — активира/подновява тенант при успешно плащане.
 *
 * Нужни ENV:
 *   STRIPE_SECRET_KEY        — от Stripe → Developers → API keys
 *   STRIPE_WEBHOOK_SECRET    — от Stripe → Developers → Webhooks (whsec_...)
 *
 * Events, които трябва да слуша в Stripe Dashboard:
 *   checkout.session.completed   — еднократно плащане или първи абонамент
 *   invoice.paid                 — подновяване на абонамент всеки месец
 *   invoice.payment_failed       — неуспешно плащане (записваме в лог)
 *   customer.subscription.deleted — абонаментът е прекратен
 */

// Lazy init — не се инициализира при билд, само при реална заявка
function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY не е зададен");
  return new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
}

// ── helpers ──────────────────────────────────────────────────────────────────

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function activateByEmail(email: string, months = 1): Promise<void> {
  if (!email) return;
  const supabase = createSupabaseServiceRoleClient();

  // Намери тенанта по имейл на собственика
  const { data: tenant } = await supabase
    .from("tenants")
    .select("salon_slug, salon_name, expiry_date")
    .eq("owner_email", email.toLowerCase().trim())
    .maybeSingle();

  if (!tenant) {
    console.warn(`[stripe-webhook] Не намерен тенант за имейл: ${email}`);
    return;
  }

  // Ако има активен период, удължаваме от края му (не от днес)
  const base = tenant.expiry_date && tenant.expiry_date > isoDate(new Date())
    ? new Date(`${tenant.expiry_date}T00:00:00`)
    : new Date();
  const expiry = new Date(base.getFullYear(), base.getMonth() + months, base.getDate());
  const grace = new Date(expiry);
  grace.setDate(grace.getDate() + 30);

  const { error } = await supabase
    .from("tenants")
    .update({
      status: "active",
      payment_type: "stripe",
      expiry_date: isoDate(expiry),
      grace_until_date: isoDate(grace),
    })
    .eq("salon_slug", tenant.salon_slug);

  if (error) {
    console.error(`[stripe-webhook] Грешка при активация на ${tenant.salon_slug}:`, error.message);
    return;
  }

  console.log(`[stripe-webhook] ✓ Активиран ${tenant.salon_slug} до ${isoDate(expiry)}`);

  // Изпрати имейл за потвърждение (ако Resend е настроен)
  if (process.env.RESEND_API_KEY) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM ?? "SalonApp <no-reply@salonapp.pro>",
        to: [email],
        subject: "SalonApp — платен абонамент активиран ✓",
        html: `
          <p>Здравейте,</p>
          <p>Плащането за <strong>${tenant.salon_name ?? tenant.salon_slug}</strong> беше получено успешно.</p>
          <p>Абонаментът е активен до: <strong>${isoDate(expiry)}</strong></p>
          <p>Влезте в админ панела от <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://salonapp.pro"}/admin/dashboard">тук</a>.</p>
        `,
      }),
    }).catch((e) => console.error("[stripe-webhook] Resend error:", e));
  }
}

async function deactivateByEmail(email: string): Promise<void> {
  if (!email) return;
  const supabase = createSupabaseServiceRoleClient();
  const { data: tenant } = await supabase
    .from("tenants")
    .select("salon_slug, grace_until_date")
    .eq("owner_email", email.toLowerCase().trim())
    .maybeSingle();

  if (!tenant) return;

  // Не деактивираме веднага — оставяме grace периода да изтече естествено.
  // Само логваме за информация.
  console.log(`[stripe-webhook] Абонаментът е прекратен за ${tenant.salon_slug}. Grace до: ${tenant.grace_until_date ?? "—"}`);
}

// ── Webhook handler ───────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET не е зададен!");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("[stripe-webhook] Невалиден подпис:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      // ── Успешен checkout (еднократно плащане или първи абонамент) ──
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const email = session.customer_details?.email ?? session.customer_email ?? "";
        // За абонаменти invoice.paid ще дойде след малко — пропускаме за да не активираме два пъти
        if (session.mode === "payment") {
          await activateByEmail(email, 1);
        }
        break;
      }

      // ── Платена фактура (абонамент — първо и всяко следващо плащане) ──
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const email = (invoice as unknown as { customer_email?: string }).customer_email ?? "";
        await activateByEmail(email, 1);
        break;
      }

      // ── Неуспешно плащане ──
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const email = (invoice as unknown as { customer_email?: string }).customer_email ?? "";
        console.warn(`[stripe-webhook] ⚠️ Неуспешно плащане за ${email}`);
        // Не деактивираме — Stripe ще retry-ва. Grace периодът ще свърши работа.
        break;
      }

      // ── Прекратен абонамент ──
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        // Намери имейла от customer обекта
        try {
          const customer = await getStripe().customers.retrieve(customerId) as Stripe.Customer;
          if (customer.email) await deactivateByEmail(customer.email);
        } catch {
          console.error(`[stripe-webhook] Не може да се намери customer ${customerId}`);
        }
        break;
      }

      default:
        // Игнорираме останалите events
        break;
    }
  } catch (err) {
    console.error("[stripe-webhook] Грешка при обработка:", err);
    // Връщаме 200 за да не retry-ва Stripe (грешката е наша, не негова)
    return NextResponse.json({ received: true, warning: "Processing error logged" });
  }

  return NextResponse.json({ received: true });
}
