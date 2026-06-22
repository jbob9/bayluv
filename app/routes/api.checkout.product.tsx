import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import type { Route } from "./+types/api.checkout.product";
import { db } from "~/db/index.server";
import { product as productTable, order } from "~/db/schemas/shop";
import { paymentAccount } from "~/db/schemas/payments";
import { getOptionalUser } from "~/lib/session.server";
import {
  getStripe,
  hasStripe,
  platformFeeCents,
  appUrl,
} from "~/lib/stripe.server";

// Countries we let buyers ship to (Stripe requires an explicit list).
const SHIP_COUNTRIES: Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[] =
  [
    "US", "CA", "GB", "IE", "AU", "NZ", "FR", "DE", "ES", "IT", "NL", "BE",
    "AT", "CH", "SE", "NO", "DK", "FI", "PT", "JP", "HT",
  ];

// POST /api/checkout/product — buy a product (one-tap checkout).
export async function action({ request }: Route.ActionArgs) {
  if (!hasStripe) {
    return Response.json({ error: "Payments aren't enabled yet." }, { status: 503 });
  }

  const productId = String((await request.formData()).get("productId") ?? "");
  const product = await db.query.product.findFirst({
    where: eq(productTable.id, productId),
    with: { profile: true },
  });
  if (!product || !product.isActive) {
    return Response.json({ error: "This item isn't available." }, { status: 400 });
  }

  const acct = await db.query.paymentAccount.findFirst({
    where: eq(paymentAccount.userId, product.profile.userId),
  });
  if (!acct || !acct.chargesEnabled) {
    return Response.json(
      { error: "This creator can't accept payments yet." },
      { status: 400 },
    );
  }

  const viewer = await getOptionalUser(request);
  const currency = acct.defaultCurrency ?? "usd";
  const feeCents = platformFeeCents(product.priceCents);
  const accessToken = `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, "");

  const [row] = await db
    .insert(order)
    .values({
      productId: product.id,
      profileId: product.profileId,
      buyerUserId: viewer?.id ?? null,
      buyerEmail: viewer?.email ?? null,
      amountCents: product.priceCents,
      feeCents,
      currency,
      accessToken,
      status: "pending",
    })
    .returning({ id: order.id });

  const stripe = getStripe();
  const metadata = { type: "product", orderId: row.id, profileId: product.profileId };
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency,
          product_data: {
            name: product.name,
            images: product.imageUrl ? [product.imageUrl] : undefined,
          },
          unit_amount: product.priceCents,
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: feeCents,
      transfer_data: { destination: acct.stripeAccountId },
      metadata,
    },
    // Physical goods: collect a shipping address so the creator can fulfill.
    ...(product.kind === "physical"
      ? { shipping_address_collection: { allowed_countries: SHIP_COUNTRIES } }
      : {}),
    customer_email: viewer?.email,
    success_url: appUrl(`/d/${row.id}?token=${accessToken}`),
    cancel_url: appUrl(`/${product.profile.username}?support=cancel`),
    metadata,
  });

  await db
    .update(order)
    .set({ stripeCheckoutSessionId: session.id })
    .where(eq(order.id, row.id));

  return Response.json({ url: session.url });
}
