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

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY не е зададен");
  return new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ── helpers ───────────────────────────────────────────────────────────────────

async function findTenant(
  customerId: string | null,
  email: string,
  subscriptionId?: string | null,
) {
  const supabase = createSupabaseServiceRoleClient();
  const sel = "salon_slug, salon_name, expiry_date, grace_until_date, owner_email";

  // Lookup priority: subscription_id > customer_id > email (email is least reliable)
  if (subscriptionId) {
    const { data } = await supabase
      .from("tenants")
      .select(sel)
      .eq("stripe_subscription_id", subscriptionId)
      .maybeSingle();
    if (data) return data;
  }

  if (customerId) {
    const { data } = await supabase
      .from("tenants")
      .select(sel)
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    if (data) return data;
  }

  if (!email) return null;
  const { data } = await supabase
    .from("tenants")
    .select(sel)
    .eq("owner_email", email.toLowerCase().trim())
    .maybeSingle();
  return data ?? null;
}

async function activateTenant(
  customerId: string | null,
  email: string,
  months = 1,
  subscriptionId?: string | null,
): Promise<void> {
  const supabase = createSupabaseServiceRoleClient();
  const tenant = await findTenant(customerId, email, subscriptionId);

  if (!tenant) {
    console.warn(`[stripe-webhook] Не намерен тенант — customer_id=${customerId}, sub_id=${subscriptionId ?? "—"}, email=${email}`);
    return;
  }

  const base =
    tenant.expiry_date && tenant.expiry_date > isoDate(new Date())
      ? new Date(`${tenant.expiry_date}T00:00:00`)
      : new Date();
  const expiry = new Date(base.getFullYear(), base.getMonth() + months, base.getDate());
  const grace = new Date(expiry);
  grace.setDate(grace.getDate() + 30);

  const patch: Record<string, unknown> = {
    status: "active",
    payment_type: "stripe",
    expiry_date: isoDate(expiry),
    grace_until_date: isoDate(grace),
  };
  if (customerId) patch.stripe_customer_id = customerId;
  if (subscriptionId) patch.stripe_subscription_id = subscriptionId;

  const { error } = await supabase
    .from("tenants")
    .update(patch)
    .eq("salon_slug", tenant.salon_slug);

  if (error) throw new Error(`Активация на ${tenant.salon_slug}: ${error.message}`);

  console.log(`[stripe-webhook] ✓ Активиран ${tenant.salon_slug} до ${isoDate(expiry)}`);

  const notifyEmail = tenant.owner_email ?? email;
  if (notifyEmail && process.env.RESEND_API_KEY) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM ?? "SalonApp <no-reply@salonapp.pro>",
        to: [notifyEmail],
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

async function deactivateTenant(
  customerId: string | null,
  email: string,
  subscriptionId?: string | null,
): Promise<void> {
  const tenant = await findTenant(customerId, email, subscriptionId);
  if (!tenant) return;

  // Изчистваме subscription_id — абонаментът вече не е активен
  const supabase = createSupabaseServiceRoleClient();
  await supabase
    .from("tenants")
    .update({ stripe_subscription_id: null })
    .eq("salon_slug", tenant.salon_slug);

  // Не деактивираме веднага — оставяме grace периода да изтече естествено.
  console.log(
    `[stripe-webhook] Абонаментът е прекратен за ${tenant.salon_slug}. Grace до: ${tenant.grace_until_date ?? "—"}`,
  );
}

// ── Idempotency ───────────────────────────────────────────────────────────────

async function claimEvent(eventId: string, eventType: string): Promise<boolean> {
  const supabase = createSupabaseServiceRoleClient();

  // Allow retry of previously-failed events by deleting the 'failed' record first
  const { data: existing } = await supabase
    .from("stripe_events")
    .select("status")
    .eq("stripe_event_id", eventId)
    .maybeSingle();

  if (existing) {
    if (existing.status === "failed") {
      // Previous attempt failed — delete and allow re-claim
      await supabase.from("stripe_events").delete().eq("stripe_event_id", eventId);
    } else {
      // 'processing' or 'completed' — already handled
      return false;
    }
  }

  const { error } = await supabase
    .from("stripe_events")
    .insert({ stripe_event_id: eventId, event_type: eventType, status: "processing" });

  if (!error) return true;
  if (error.code === "23505") return false; // concurrent request won the race
  throw new Error(`stripe_events INSERT: ${error.message}`);
}

async function markEventCompleted(eventId: string): Promise<void> {
  const supabase = createSupabaseServiceRoleClient();
  await supabase
    .from("stripe_events")
    .update({ status: "completed" })
    .eq("stripe_event_id", eventId);
}

async function markEventFailed(eventId: string): Promise<void> {
  const supabase = createSupabaseServiceRoleClient();
  await supabase
    .from("stripe_events")
    .update({ status: "failed" })
    .eq("stripe_event_id", eventId);
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
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("[stripe-webhook] Невалиден подпис:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Idempotency — ако event-ът е вече обработен, спираме тук
  let claimed: boolean;
  try {
    claimed = await claimEvent(event.id, event.type);
  } catch (err) {
    console.error("[stripe-webhook] claimEvent грешка:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
  if (!claimed) {
    console.log(`[stripe-webhook] Duplicate event ${event.id} — пропускам`);
    return NextResponse.json({ received: true });
  }

  // Mark completed after successful processing
  let processingError: unknown = null;
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = typeof session.customer === "string" ? session.customer : null;
        const email = session.customer_details?.email ?? session.customer_email ?? "";
        const subId = typeof session.subscription === "string" ? session.subscription : null;
        // За абонаменти invoice.paid ще дойде след малко — пропускаме за да не активираме два пъти
        if (session.mode === "payment") {
          await activateTenant(customerId, email, 1);
        } else if (session.mode === "subscription" && subId) {
          // Записваме subscription_id при първото checkout — invoice.paid ще го потвърди
          const supabase = createSupabaseServiceRoleClient();
          const tenant = await findTenant(customerId, email);
          if (tenant) {
            await supabase
              .from("tenants")
              .update({ stripe_subscription_id: subId, stripe_customer_id: customerId })
              .eq("salon_slug", tenant.salon_slug);
          }
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : null;
        const subId = typeof invoice.subscription === "string" ? invoice.subscription : null;
        const email = (invoice as unknown as { customer_email?: string }).customer_email ?? "";
        await activateTenant(customerId, email, 1, subId);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const email = (invoice as unknown as { customer_email?: string }).customer_email ?? "";
        console.warn(`[stripe-webhook] ⚠️ Неуспешно плащане за ${email}`);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const subId = sub.id;
        try {
          const customer = (await getStripe().customers.retrieve(customerId)) as Stripe.Customer;
          await deactivateTenant(customerId, customer.email ?? "", subId);
        } catch {
          console.error(`[stripe-webhook] Не може да се намери customer ${customerId}`);
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    processingError = err;
  }

  if (processingError) {
    console.error("[stripe-webhook] Грешка при обработка:", processingError);
    // Mark as failed — Stripe will retry; claimEvent will allow re-processing of failed events
    await markEventFailed(event.id);
    return NextResponse.json({ error: "Processing error" }, { status: 500 });
  }

  await markEventCompleted(event.id);
  return NextResponse.json({ received: true });
}
