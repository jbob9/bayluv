import { Form, redirect } from "react-router";
import { desc, eq, and } from "drizzle-orm";
import { Crown, ExternalLink } from "lucide-react";
import type { Route } from "./+types/account";
import { requireUser } from "~/lib/session.server";
import { db } from "~/db/index.server";
import { membership } from "~/db/schemas/membership";
import { hasStripe, createBillingPortal, appUrl } from "~/lib/stripe.server";
import { formatMoney } from "~/lib/utils";
import { Logo } from "~/components/brand/logo";
import { Card, CardContent } from "~/components/ui/card";
import { Button, ButtonLink } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";

export function meta() {
  return [{ title: "My memberships · bayluv" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireUser(request);
  const rows = await db.query.membership.findMany({
    where: eq(membership.supporterUserId, user.id),
    orderBy: desc(membership.createdAt),
    with: { profile: true, tier: true },
  });
  return {
    memberships: rows.map((m) => ({
      id: m.id,
      status: m.status,
      currentPeriodEnd: m.currentPeriodEnd,
      hasCustomer: Boolean(m.stripeCustomerId),
      creator: { name: m.profile.displayName, username: m.profile.username },
      tier: m.tier
        ? { name: m.tier.name, priceCents: m.tier.priceCents, interval: m.tier.interval }
        : null,
    })),
  };
}

export async function action({ request }: Route.ActionArgs) {
  const user = await requireUser(request);
  if (!hasStripe) return { error: "Billing isn't available." };
  const id = String((await request.formData()).get("id"));
  const m = await db.query.membership.findFirst({
    where: and(eq(membership.id, id), eq(membership.supporterUserId, user.id)),
  });
  if (!m?.stripeCustomerId) return { error: "No billing account found." };
  const url = await createBillingPortal(m.stripeCustomerId, appUrl("/account"));
  return redirect(url);
}

export default function Account({ loaderData }: Route.ComponentProps) {
  const { memberships } = loaderData;

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <Logo />
        <ButtonLink to="/dashboard" variant="ghost">
          Dashboard
        </ButtonLink>
      </div>

      <h1 className="text-3xl font-extrabold text-ink">My memberships</h1>
      <p className="mt-1 text-ink-soft">Subscriptions you support.</p>

      {memberships.length === 0 ? (
        <Card className="mt-8">
          <CardContent className="p-10 text-center text-ink-soft">
            <Crown className="mx-auto mb-3 h-8 w-8 text-muted" />
            You're not a member of anyone yet.
          </CardContent>
        </Card>
      ) : (
        <div className="mt-8 space-y-4">
          {memberships.map((m) => (
            <Card key={m.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div>
                  <p className="font-bold text-ink">{m.creator.name}</p>
                  <p className="text-sm text-muted">
                    {m.tier
                      ? `${m.tier.name} · ${formatMoney(m.tier.priceCents)}/${m.tier.interval}`
                      : "Membership"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={m.status === "active" ? "success" : "neutral"}>
                    {m.status}
                  </Badge>
                  <ButtonLink to={`/${m.creator.username}`} variant="outline" size="sm">
                    Visit
                  </ButtonLink>
                  {m.hasCustomer && (
                    <Form method="post">
                      <input type="hidden" name="id" value={m.id} />
                      <Button type="submit" size="sm">
                        <ExternalLink className="h-4 w-4" /> Manage
                      </Button>
                    </Form>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
