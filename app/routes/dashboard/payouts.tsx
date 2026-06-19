import { Form, redirect, useNavigation } from "react-router";
import { eq } from "drizzle-orm";
import { Wallet, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import type { Route } from "./+types/payouts";
import { requireProfile } from "~/lib/session.server";
import { db } from "~/db/index.server";
import { paymentAccount } from "~/db/schemas/payments";
import {
  hasStripe,
  ensureConnectedAccount,
  createAccountLink,
  createLoginLink,
  getAccountStatus,
} from "~/lib/stripe.server";
import { PageHeader, ComingSoon } from "~/components/dashboard/page-header";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";

export function meta() {
  return [{ title: "Payouts · bayluv" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const { user } = await requireProfile(request);
  if (!hasStripe) return { configured: false as const, account: null };

  let account = await db.query.paymentAccount.findFirst({
    where: eq(paymentAccount.userId, user.id),
  });

  // Refresh capability flags from Stripe when not yet fully enabled.
  if (account && !(account.chargesEnabled && account.payoutsEnabled)) {
    const status = await getAccountStatus(account.stripeAccountId);
    await db
      .update(paymentAccount)
      .set(status)
      .where(eq(paymentAccount.id, account.id));
    account = { ...account, ...status };
  }

  return {
    configured: true as const,
    account: account
      ? {
          chargesEnabled: account.chargesEnabled,
          payoutsEnabled: account.payoutsEnabled,
          detailsSubmitted: account.detailsSubmitted,
          country: account.country,
        }
      : null,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const { user } = await requireProfile(request);
  const intent = String((await request.formData()).get("intent"));

  let account = await db.query.paymentAccount.findFirst({
    where: eq(paymentAccount.userId, user.id),
  });

  if (intent === "connect") {
    if (!account) {
      const accountId = await ensureConnectedAccount({ email: user.email });
      [account] = await db
        .insert(paymentAccount)
        .values({ userId: user.id, stripeAccountId: accountId })
        .returning();
    }
    const url = await createAccountLink(account.stripeAccountId);
    return redirect(url);
  }

  if (intent === "dashboard" && account) {
    const url = await createLoginLink(account.stripeAccountId);
    return redirect(url);
  }

  return null;
}

export default function Payouts({ loaderData }: Route.ComponentProps) {
  const nav = useNavigation();
  const busy = nav.state !== "idle";

  if (!loaderData.configured) {
    return (
      <>
        <PageHeader title="Payouts" subtitle="Get paid via Stripe." />
        <ComingSoon
          icon={Wallet}
          title="Stripe isn't configured yet"
          description="Add your Stripe keys to enable creator payouts."
        />
      </>
    );
  }

  const account = loaderData.account;
  const ready = account?.chargesEnabled && account?.payoutsEnabled;

  return (
    <>
      <PageHeader title="Payouts" subtitle="Get paid directly via Stripe." />

      {!account ? (
        <Card className="max-w-xl">
          <CardContent className="space-y-4 p-8 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary-100 text-primary-700">
              <Wallet className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-ink">Set up payouts</h2>
            <p className="text-ink-soft">
              Connect a Stripe account to start receiving tips, memberships, and
              sales. Money lands directly in your account.
            </p>
            <Form method="post">
              <input type="hidden" name="intent" value="connect" />
              <Button type="submit" size="lg" disabled={busy}>
                {busy ? "Redirecting…" : "Connect with Stripe"}
              </Button>
            </Form>
          </CardContent>
        </Card>
      ) : (
        <div className="max-w-xl space-y-4">
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-ink">Account status</h2>
                {ready ? (
                  <Badge tone="success">
                    <CheckCircle2 className="h-3 w-3" /> Active
                  </Badge>
                ) : (
                  <Badge tone="sunny">
                    <AlertCircle className="h-3 w-3" /> Action needed
                  </Badge>
                )}
              </div>

              <StatusRow label="Details submitted" ok={account.detailsSubmitted} />
              <StatusRow label="Accept payments" ok={account.chargesEnabled} />
              <StatusRow label="Receive payouts" ok={account.payoutsEnabled} />

              <div className="flex gap-2 pt-2">
                {!ready && (
                  <Form method="post">
                    <input type="hidden" name="intent" value="connect" />
                    <Button type="submit" disabled={busy}>
                      Finish setup
                    </Button>
                  </Form>
                )}
                {ready && (
                  <Form method="post">
                    <input type="hidden" name="intent" value="dashboard" />
                    <Button type="submit" variant="outline" disabled={busy}>
                      <ExternalLink className="h-4 w-4" /> Stripe dashboard
                    </Button>
                  </Form>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

function StatusRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
      <span className="font-medium text-ink-soft">{label}</span>
      {ok ? (
        <CheckCircle2 className="h-5 w-5 text-success" />
      ) : (
        <span className="text-sm font-semibold text-muted">Pending</span>
      )}
    </div>
  );
}
