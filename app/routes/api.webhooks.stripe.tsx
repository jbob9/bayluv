import type Stripe from "stripe";
import { eq, sql, and } from "drizzle-orm";
import type { Route } from "./+types/api.webhooks.stripe";
import { db } from "~/db/index.server";
import { profile } from "~/db/schemas/profile";
import { paymentAccount, support } from "~/db/schemas/payments";
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
        }
        break;
      }
      case "account.updated": {
        await syncAccount(event.data.object as Stripe.Account);
        break;
      }
      // Subscription lifecycle (memberships + monthly tips) handled in Phase 4.
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
    .set({ status: "paid", stripePaymentIntentId: paymentIntentId })
    .where(and(eq(support.id, supportId), eq(support.status, "pending")));

  await db
    .update(profile)
    .set({ supporterCount: sql`${profile.supporterCount} + 1` })
    .where(eq(profile.id, row.profileId));
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
