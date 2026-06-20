import type Stripe from "stripe";
import { eq, sql, and } from "drizzle-orm";
import type { Route } from "./+types/api.webhooks.stripe";
import { db } from "~/db/index.server";
import { profile } from "~/db/schemas/profile";
import { paymentAccount, support } from "~/db/schemas/payments";
import { tier, membership } from "~/db/schemas/membership";
import { product, order } from "~/db/schemas/shop";
import { getStripe, hasStripe } from "~/lib/stripe.server";
import { env } from "~/lib/env.server";

// POST /api/webhooks/stripe — verifies + processes Stripe events.
export async function action({ request }: Route.ActionArgs) {
  if (!hasStripe || !env.STRIPE_WEBHOOK_SECRET) {
    return new Response("Stripe not configured", { status: 503 });
  }

  const stripe = getStripe();
  const sig = request.headers.get("stripe-signature");
  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      payload,
      sig ?? "",
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    return new Response(
      `Webhook signature verification failed: ${(err as Error).message}`,
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.type === "tip") {
          await markTipPaid(session);
        } else if (session.metadata?.type === "product") {
          await markOrderPaid(session);
        }
        break;
      }
      case "account.updated": {
        await syncAccount(event.data.object as Stripe.Account);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        await upsertMembership(event.data.object as Stripe.Subscription);
        break;
      }
      case "customer.subscription.deleted": {
        await cancelMembership(event.data.object as Stripe.Subscription);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return new Response("Handler error", { status: 500 });
  }

  return Response.json({ received: true });
}

/** Marks a pending tip as paid (idempotent) and bumps the supporter count. */
async function markTipPaid(session: Stripe.Checkout.Session) {
  const supportId = session.metadata?.supportId;
  if (!supportId) return;

  const row = await db.query.support.findFirst({
    where: eq(support.id, supportId),
  });
  if (!row || row.status === "paid") return; // idempotent

  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : null;

  await db
    .update(support)
    .set({
      status: "paid",
      stripePaymentIntentId: paymentIntentId,
      supporterEmail: row.supporterEmail ?? session.customer_details?.email ?? null,
    })
    .where(and(eq(support.id, supportId), eq(support.status, "pending")));

  await db
    .update(profile)
    .set({ supporterCount: sql`${profile.supporterCount} + 1` })
    .where(eq(profile.id, row.profileId));
}

/** Marks a pending product order paid (idempotent) and bumps sales count. */
async function markOrderPaid(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId;
  if (!orderId) return;
  const row = await db.query.order.findFirst({ where: eq(order.id, orderId) });
  if (!row || row.status === "paid") return;

  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : null;

  await db
    .update(order)
    .set({
      status: "paid",
      stripePaymentIntentId: paymentIntentId,
      buyerEmail: row.buyerEmail ?? session.customer_details?.email ?? null,
    })
    .where(and(eq(order.id, orderId), eq(order.status, "pending")));

  await db
    .update(product)
    .set({ salesCount: sql`${product.salesCount} + 1` })
    .where(eq(product.id, row.productId));
}

const ACTIVE = new Set(["active", "trialing"]);

function mapStatus(s: string): typeof membership.$inferInsert.status {
  if (s === "active") return "active";
  if (s === "trialing") return "trialing";
  if (s === "past_due" || s === "unpaid") return "past_due";
  if (s === "canceled") return "canceled";
  return "incomplete";
}

/** Reads the current period end (handles API versions that moved the field). */
function periodEnd(sub: Stripe.Subscription): Date | null {
  const top = (sub as unknown as { current_period_end?: number })
    .current_period_end;
  const itemEnd = sub.items?.data?.[0]?.current_period_end;
  const unix = top ?? itemEnd;
  return unix ? new Date(unix * 1000) : null;
}

/** Creates or updates a membership from a Stripe subscription event. */
async function upsertMembership(sub: Stripe.Subscription) {
  const meta = sub.metadata ?? {};
  const profileId = meta.profileId;
  const supporterUserId = meta.supporterUserId;
  const tierId = meta.tierId || null;
  if (!profileId || !supporterUserId) return; // not one of ours

  const status = mapStatus(sub.status);
  const customerId = typeof sub.customer === "string" ? sub.customer : null;
  const existing = await db.query.membership.findFirst({
    where: eq(membership.stripeSubscriptionId, sub.id),
  });

  if (existing) {
    await db
      .update(membership)
      .set({ status, currentPeriodEnd: periodEnd(sub), tierId })
      .where(eq(membership.id, existing.id));
    return;
  }

  await db.insert(membership).values({
    profileId,
    tierId,
    supporterUserId,
    stripeSubscriptionId: sub.id,
    stripeCustomerId: customerId,
    status,
    currentPeriodEnd: periodEnd(sub),
  });

  // First active subscription → bump counters.
  if (ACTIVE.has(sub.status)) {
    if (tierId) {
      await db
        .update(tier)
        .set({ memberCount: sql`${tier.memberCount} + 1` })
        .where(eq(tier.id, tierId));
    }
    await db
      .update(profile)
      .set({ supporterCount: sql`${profile.supporterCount} + 1` })
      .where(eq(profile.id, profileId));
  }
}

/** Marks a membership canceled and decrements counters. */
async function cancelMembership(sub: Stripe.Subscription) {
  const existing = await db.query.membership.findFirst({
    where: eq(membership.stripeSubscriptionId, sub.id),
  });
  if (!existing || existing.status === "canceled") return;

  await db
    .update(membership)
    .set({ status: "canceled" })
    .where(eq(membership.id, existing.id));

  if (existing.tierId) {
    await db
      .update(tier)
      .set({ memberCount: sql`max(${tier.memberCount} - 1, 0)` })
      .where(eq(tier.id, existing.tierId));
  }
  await db
    .update(profile)
    .set({ supporterCount: sql`max(${profile.supporterCount} - 1, 0)` })
    .where(eq(profile.id, existing.profileId));
}

/** Keeps the local connected-account status in sync with Stripe. */
async function syncAccount(account: Stripe.Account) {
  await db
    .update(paymentAccount)
    .set({
      chargesEnabled: account.charges_enabled ?? false,
      payoutsEnabled: account.payouts_enabled ?? false,
      detailsSubmitted: account.details_submitted ?? false,
      country: account.country ?? null,
      defaultCurrency: account.default_currency ?? "usd",
    })
    .where(eq(paymentAccount.stripeAccountId, account.id));
}
