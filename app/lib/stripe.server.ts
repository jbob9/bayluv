import Stripe from "stripe";
import { env, hasStripe } from "./env.server";

let _stripe: Stripe | null = null;

/** Lazily-constructed Stripe client. Throws if STRIPE_SECRET_KEY is unset. */
export function getStripe(): Stripe {
  if (!hasStripe) {
    throw new Error(
      "Stripe is not configured. Set STRIPE_SECRET_KEY in your environment.",
    );
  }
  if (!_stripe) {
    _stripe = new Stripe(env.STRIPE_SECRET_KEY!, {
      typescript: true,
      appInfo: { name: "bayluv" },
    });
  }
  return _stripe;
}

export { hasStripe };

/** Platform fee (in cents) taken from a gross amount. */
export function platformFeeCents(amountCents: number): number {
  return Math.round((amountCents * env.PLATFORM_FEE_PERCENT) / 100);
}

/** Absolute base URL for building Stripe redirect/return URLs. */
export function appUrl(path = ""): string {
  return `${env.BETTER_AUTH_URL.replace(/\/$/, "")}${path}`;
}

/**
 * Returns an existing connected account id or creates a new Express account.
 */
export async function ensureConnectedAccount(params: {
  existingAccountId?: string | null;
  email?: string | null;
}): Promise<string> {
  const stripe = getStripe();
  if (params.existingAccountId) return params.existingAccountId;
  const account = await stripe.accounts.create({
    type: "express",
    email: params.email ?? undefined,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });
  return account.id;
}

/** Creates an onboarding Account Link to send the creator to Stripe. */
export async function createAccountLink(accountId: string): Promise<string> {
  const stripe = getStripe();
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: appUrl("/dashboard/payouts?refresh=1"),
    return_url: appUrl("/dashboard/payouts?return=1"),
    type: "account_onboarding",
  });
  return link.url;
}

/** Fetches account capability flags from Stripe. */
export async function getAccountStatus(accountId: string) {
  const stripe = getStripe();
  const acct = await stripe.accounts.retrieve(accountId);
  return {
    chargesEnabled: acct.charges_enabled,
    payoutsEnabled: acct.payouts_enabled,
    detailsSubmitted: acct.details_submitted,
    country: acct.country ?? null,
    defaultCurrency: acct.default_currency ?? "usd",
  };
}

/** Login link to the Stripe Express dashboard for an onboarded creator. */
export async function createLoginLink(accountId: string): Promise<string> {
  const stripe = getStripe();
  const link = await stripe.accounts.createLoginLink(accountId);
  return link.url;
}

/**
 * Creates (or recreates) a Product + recurring Price on the platform account
 * for a membership tier. Prices are immutable, so editing price = new Price.
 */
export async function createTierPrice(params: {
  name: string;
  description?: string | null;
  amountCents: number;
  interval: "month" | "year";
  currency?: string;
  existingProductId?: string | null;
}): Promise<{ productId: string; priceId: string }> {
  const stripe = getStripe();
  const productId =
    params.existingProductId ??
    (
      await stripe.products.create({
        name: params.name,
        description: params.description ?? undefined,
      })
    ).id;

  const price = await stripe.prices.create({
    product: productId,
    currency: params.currency ?? "usd",
    unit_amount: params.amountCents,
    recurring: { interval: params.interval },
  });

  return { productId, priceId: price.id };
}

/** Subscription Checkout Session for a Connect destination subscription. */
export async function createSubscriptionCheckout(params: {
  priceId: string;
  connectedAccountId: string;
  feePercent: number;
  customerEmail?: string | null;
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, string>;
}): Promise<string | null> {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: params.priceId, quantity: 1 }],
    subscription_data: {
      application_fee_percent: params.feePercent,
      transfer_data: { destination: params.connectedAccountId },
      metadata: params.metadata,
    },
    customer_email: params.customerEmail ?? undefined,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: params.metadata,
  });
  return session.url;
}

/** Stripe billing portal so supporters can manage/cancel their subscription. */
export async function createBillingPortal(
  customerId: string,
  returnUrl: string,
): Promise<string> {
  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return session.url;
}
