---
name: salonapp-stripe-production
description: Use when working on Stripe in production — webhooks, dunning, failed payments, idempotency. Triggers on phrases like "Stripe production", "failed payment", "webhook", "dunning", "плащане се провали", "subscription".
---

# SalonApp Stripe Production

## Production checklist

### Stripe Dashboard
- Activate live mode
- Webhook endpoint: https://salonapp.pro/api/webhooks/stripe
- Events: checkout.session.completed, customer.subscription.*, invoice.paid, invoice.payment_failed, charge.dispute.created
- Webhook signing secret → Vercel env STRIPE_WEBHOOK_SECRET
- Smart Retries: enabled
- Customer portal: enabled

### Vercel ENV
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PAYMENT_LINK_*=...

## Idempotency (КРИТИЧНО)
const eventId = event.id;
const existing = await supabase.from('stripe_events').select('id').eq('stripe_event_id', eventId).single();
if (existing.data) return new Response('Already processed', { status: 200 });
// process...
await supabase.from('stripe_events').insert({ stripe_event_id: eventId, type: event.type });

## Failed payment lifecycle
- Grace period (3 дни): salon active, email notification
- Past due (3-7 дни): banner в admin, still functional
- Suspended (7+ дни): public site shows "недостъпно", admin read-only
- Cancelled (30+ дни): read-only за export, после GDPR delete

## Webhook signature verification (НЕ ОТСТРАНЯВАЙ)
const sig = req.headers.get('stripe-signature');
const event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);

## Test cards
- 4242 4242 4242 4242 → success
- 4000 0000 0000 0002 → declined
- 4000 0000 0000 9995 → insufficient funds (за dunning test)
