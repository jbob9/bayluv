import { eq } from "drizzle-orm";
import type { Route } from "./+types/api.checkout.subscription";
import { db } from "~/db/index.server";
import { tier as tierTable } from "~/db/schemas/membership";
import { paymentAccount } from "~/db/schemas/payments";
import { getOptionalUser } from "~/lib/session.server";
import {
  hasStripe,
  createSubscriptionCheckout,
  platformFeeCents,
  appUrl,
} from "~/lib/stripe.server";

// POST /api/checkout/subscription — start a membership subscription.
export async function action({ request }: Route.ActionArgs) {
  if (!hasStripe) {
    return Response.json({ error: "Payments aren't enabled yet." }, { status: 503 });
  }

  const form = await request.formData();
  const tierId = String(form.get("tierId") ?? "");
  const username = String(form.get("username") ?? "");
  const cycle = String(form.get("cycle")) === "year" ? "year" : "month";

  const viewer = await getOptionalUser(request);
  if (!viewer) {
    // Client should redirect to login then back to the page.
    return Response.json(
      { loginRequired: true, redirect: `/login?redirect=/${username}` },
      { status: 401 },
    );
  }

  const tier = await db.query.tier.findFirst({
    where: eq(tierTable.id, tierId),
    with: { profile: true },
  });
  if (!tier || !tier.isActive || !tier.stripePriceId) {
    return Response.json({ error: "This tier isn't available." }, { status: 400 });
  }

  const acct = await db.query.paymentAccount.findFirst({
    where: eq(paymentAccount.userId, tier.profile.userId),
  });
  if (!acct || !acct.chargesEnabled) {
    return Response.json(
      { error: "This creator can't accept memberships yet." },
      { status: 400 },
    );
  }

  // Use the yearly price when requested and available; else the base price.
  const useYearly = cycle === "year" && Boolean(tier.stripeYearlyPriceId);
  const priceId = useYearly ? tier.stripeYearlyPriceId! : tier.stripePriceId;
  const baseAmount =
    useYearly && tier.yearlyPriceCents ? tier.yearlyPriceCents : tier.priceCents;
  const feePercent = Number(
    ((platformFeeCents(baseAmount) / baseAmount) * 100).toFixed(2),
  );

  const url = await createSubscriptionCheckout({
    priceId,
    connectedAccountId: acct.stripeAccountId,
    feePercent,
    customerEmail: viewer.email,
    successUrl: appUrl(`/${tier.profile.username}?support=success`),
    cancelUrl: appUrl(`/${tier.profile.username}?support=cancel`),
    metadata: {
      type: "membership",
      tierId: tier.id,
      profileId: tier.profileId,
      supporterUserId: viewer.id,
    },
  });

  return Response.json({ url });
}
