import { eq } from "drizzle-orm";
import type { Route } from "./+types/api.checkout.tip";
import { db } from "~/db/index.server";
import { profile } from "~/db/schemas/profile";
import { paymentAccount, support } from "~/db/schemas/payments";
import { getOptionalUser } from "~/lib/session.server";
import {
  getStripe,
  hasStripe,
  platformFeeCents,
  appUrl,
} from "~/lib/stripe.server";

// POST /api/checkout/tip — creates a Stripe Checkout Session for a tip.
export async function action({ request }: Route.ActionArgs) {
  if (!hasStripe) {
    return Response.json(
      { error: "Payments aren't enabled yet." },
      { status: 503 },
    );
  }

  const form = await request.formData();
  const username = String(form.get("username") ?? "");
  const quantity = Math.max(1, Number(form.get("quantity")) || 1);
  const amountCents = Math.max(100, Number(form.get("amountCents")) || 0);
  const supporterName = (String(form.get("name") ?? "").trim() || null) as
    | string
    | null;
  const message = (String(form.get("message") ?? "").trim() || null) as
    | string
    | null;
  const monthly = String(form.get("monthly")) === "true";

  const creator = await db.query.profile.findFirst({
    where: eq(profile.username, username.toLowerCase()),
  });
  if (!creator) return Response.json({ error: "Creator not found" }, { status: 404 });

  const acct = await db.query.paymentAccount.findFirst({
    where: eq(paymentAccount.userId, creator.userId),
  });
  if (!acct || !acct.chargesEnabled) {
    return Response.json(
      { error: "This creator can't accept payments yet." },
      { status: 400 },
    );
  }

  const viewer = await getOptionalUser(request);
  const currency = acct.defaultCurrency ?? "usd";
  const feeCents = platformFeeCents(amountCents);
  const stripe = getStripe();

  // Pre-create a pending support row so the webhook can resolve it by id.
  const [row] = await db
    .insert(support)
    .values({
      profileId: creator.id,
      supporterUserId: viewer?.id ?? null,
      supporterName,
      quantity,
      amountCents,
      feeCents,
      currency,
      message,
      isMonthly: monthly,
      status: "pending",
    })
    .returning({ id: support.id });

  const productName = `Support for ${creator.displayName}`;
  const success = appUrl(`/${creator.username}?support=success`);
  const cancel = appUrl(`/${creator.username}?support=cancel`);
  const metadata = { type: "tip", supportId: row.id, profileId: creator.id };

  const session = monthly
    ? await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [
          {
            price_data: {
              currency,
              product_data: { name: `${productName} (monthly)` },
              unit_amount: amountCents,
              recurring: { interval: "month" },
            },
            quantity: 1,
          },
        ],
        subscription_data: {
          application_fee_percent: Number(
            ((feeCents / amountCents) * 100).toFixed(2),
          ),
          transfer_data: { destination: acct.stripeAccountId },
          metadata,
        },
        customer_email: viewer?.email,
        success_url: success,
        cancel_url: cancel,
        metadata,
      })
    : await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency,
              product_data: { name: productName },
              unit_amount: amountCents,
            },
            quantity: 1,
          },
        ],
        payment_intent_data: {
          application_fee_amount: feeCents,
          transfer_data: { destination: acct.stripeAccountId },
          metadata,
        },
        customer_email: viewer?.email,
        success_url: success,
        cancel_url: cancel,
        metadata,
      });

  await db
    .update(support)
    .set({ stripeCheckoutSessionId: session.id })
    .where(eq(support.id, row.id));

  return Response.json({ url: session.url });
}
