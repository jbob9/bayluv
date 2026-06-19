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
