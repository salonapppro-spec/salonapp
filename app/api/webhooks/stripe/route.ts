import Stripe from "stripe";
import { NextResponse } from "next/server";

import { logAbuseEvent } from "@/lib/abuse-log";
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

type ResolvedTenant = {
  salon_slug: string;
  salon_name: string | null;
  expiry_date: string | null;
  grace_until_date: string | null;
  owner_email: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
};

type TenantLookupResult =
  | { tenant: ResolvedTenant; resolvedBy: "subscription" | "customer" | "owner_email" }
  | { tenant: null; resolvedBy: null };

function allowOwnerEmailFallback(): boolean {
  const raw = process.env.STRIPE_ALLOW_OWNER_EMAIL_FALLBACK?.trim().toLowerCase();
  if (!raw) return true; // default safe migration path
  return raw === "1" || raw === "true" || raw === "yes" || raw === "on";
}

async function findTenant(
  customerId: string | null,
  subscriptionId: string | null,
  email: string
): Promise<TenantLookupResult> {
  const supabase = createSupabaseServiceRoleClient();

  if (subscriptionId) {
    const { data } = await supabase
      .from("tenants")
      .select("salon_slug, salon_name, expiry_date, grace_until_date, owner_email, stripe_customer_id, stripe_subscription_id")
      .eq("stripe_subscription_id", subscriptionId)
      .maybeSingle();
    if (data) return { tenant: data as ResolvedTenant, resolvedBy: "subscription" };
  }

  // Предпочита stripe_customer_id — имейлът не е уникален идентификатор
  if (customerId) {
    const { data } = await supabase
      .from("tenants")
      .select("salon_slug, salon_name, expiry_date, grace_until_date, owner_email, stripe_customer_id, stripe_subscription_id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    if (data) return { tenant: data as ResolvedTenant, resolvedBy: "customer" };
  }

  if (!allowOwnerEmailFallback()) {
    if (email) {
      const msg = `[stripe-webhook] owner_email fallback is disabled (customer_id=${customerId}, subscription_id=${subscriptionId}, email=${email})`;
      console.warn(msg);
      logAbuseEvent({
        kind: "client_error",
        path: "/api/webhooks/stripe",
        method: "POST",
        status: 200,
        ip: "stripe_webhook",
        key: "stripe_lookup_owner_email_fallback_disabled",
        detail: msg,
      });
    }
    return { tenant: null, resolvedBy: null };
  }

  if (!email) return { tenant: null, resolvedBy: null };
  const { data } = await supabase
    .from("tenants")
    .select("salon_slug, salon_name, expiry_date, grace_until_date, owner_email, stripe_customer_id, stripe_subscription_id")
    .eq("owner_email", email.toLowerCase().trim())
    .maybeSingle();
  if (!data) return { tenant: null, resolvedBy: null };
  return { tenant: data as ResolvedTenant, resolvedBy: "owner_email" };
}

async function activateTenant(
  customerId: string | null,
  subscriptionId: string | null,
  email: string,
  months = 1,
): Promise<void> {
  const supabase = createSupabaseServiceRoleClient();
  const found = await findTenant(customerId, subscriptionId, email);
  const tenant = found.tenant;

  if (!tenant) {
    console.warn(
      `[stripe-webhook] Не намерен тенант — customer_id=${customerId}, subscription_id=${subscriptionId}, email=${email}`
    );
    return;
  }

  if (found.resolvedBy === "owner_email") {
    const msg = `[stripe-webhook] ⚠️ tenant lookup fallback by owner_email for ${tenant.salon_slug} (customer_id=${customerId}, subscription_id=${subscriptionId}, email=${email})`;
    console.warn(msg);
    logAbuseEvent({
      kind: "client_error",
      path: "/api/webhooks/stripe",
      method: "POST",
      status: 200,
      ip: "stripe_webhook",
      key: "stripe_lookup_owner_email_fallback",
      detail: msg,
    });
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
  // Свързваме customer_id ако не е записан още
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

async function deactivateTenant(customerId: string | null, subscriptionId: string | null, email: string): Promise<void> {
  const found = await findTenant(customerId, subscriptionId, email);
  const tenant = found.tenant;
  if (!tenant) return;
  if (found.resolvedBy === "owner_email") {
    const msg = `[stripe-webhook] ⚠️ deactivate fallback by owner_email for ${tenant.salon_slug} (customer_id=${customerId}, subscription_id=${subscriptionId}, email=${email})`;
    console.warn(msg);
    logAbuseEvent({
      kind: "client_error",
      path: "/api/webhooks/stripe",
      method: "POST",
      status: 200,
      ip: "stripe_webhook",
      key: "stripe_deactivate_owner_email_fallback",
      detail: msg,
    });
  }
  // Не деактивираме веднага — оставяме grace периода да изтече естествено.
  console.log(
    `[stripe-webhook] Абонаментът е прекратен за ${tenant.salon_slug}. Grace до: ${tenant.grace_until_date ?? "—"}`,
  );
}

// ── Idempotency ───────────────────────────────────────────────────────────────

async function claimEvent(eventId: string, eventType: string): Promise<boolean> {
  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase
    .from("stripe_events")
    .insert({ stripe_event_id: eventId, event_type: eventType });

  if (!error) return true; // claimed
  if (error.code === "23505") return false; // duplicate — already processed
  throw new Error(`stripe_events INSERT: ${error.message}`);
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

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = typeof session.customer === "string" ? session.customer : null;
        const subscriptionId = typeof session.subscription === "string" ? session.subscription : null;
        const email = session.customer_details?.email ?? session.customer_email ?? "";
        // За абонаменти invoice.paid ще дойде след малко — пропускаме за да не активираме два пъти
        if (session.mode === "payment") {
          await activateTenant(customerId, subscriptionId, email, 1);
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : null;
        const subscriptionId =
          typeof (invoice as unknown as { subscription?: unknown }).subscription === "string"
            ? ((invoice as unknown as { subscription?: string }).subscription ?? null)
            : null;
        const email = (invoice as unknown as { customer_email?: string }).customer_email ?? "";
        await activateTenant(customerId, subscriptionId, email, 1);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const email = (invoice as unknown as { customer_email?: string }).customer_email ?? "";
        const customerId = typeof invoice.customer === "string" ? invoice.customer : null;
        const subscriptionId =
          typeof (invoice as unknown as { subscription?: unknown }).subscription === "string"
            ? ((invoice as unknown as { subscription?: string }).subscription ?? null)
            : null;
        console.warn(`[stripe-webhook] ⚠️ Неуспешно плащане за ${email}`);
        const found = await findTenant(customerId, subscriptionId, email);
        const notifyEmail = found.tenant?.owner_email ?? (email || null);
        if (notifyEmail && process.env.RESEND_API_KEY) {
          const salonName = found.tenant?.salon_name ?? found.tenant?.salon_slug ?? email;
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: process.env.RESEND_FROM ?? "SalonApp <no-reply@salonapp.pro>",
              to: [notifyEmail],
              subject: "SalonApp — плащането не беше успешно",
              html: `
                <p>Здравейте,</p>
                <p>Плащането за абонамента на <strong>${salonName}</strong> не беше успешно.</p>
                <p>Моля, обновете начина на плащане, за да запазите достъпа до SalonApp.</p>
                <p>Ако имате въпроси, пишете ни на <a href="mailto:support@salonapp.pro">support@salonapp.pro</a>.</p>
              `,
            }),
          }).catch((e) => console.error("[stripe-webhook] dunning email error:", e));
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const subscriptionId = typeof sub.id === "string" ? sub.id : null;
        try {
          const customer = (await getStripe().customers.retrieve(customerId)) as Stripe.Customer;
          await deactivateTenant(customerId, subscriptionId, customer.email ?? "");
        } catch {
          console.error(`[stripe-webhook] Не може да се намери customer ${customerId}`);
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    // Връщаме 500 — Stripe ще retry-ва. Събитието вече е в stripe_events,
    // затова следващият retry ще мине claimEvent и ще пробва отново.
    console.error("[stripe-webhook] Грешка при обработка:", err);
    // Изтриваме записа за да може retry-ят да го reclaim-не
    const supabase = createSupabaseServiceRoleClient();
    await supabase.from("stripe_events").delete().eq("stripe_event_id", event.id);
    return NextResponse.json({ error: "Processing error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
