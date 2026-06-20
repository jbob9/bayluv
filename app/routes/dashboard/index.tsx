import { Copy, Heart, Wallet, Eye, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { and, eq } from "drizzle-orm";
import type { Route } from "./+types/index";
import { requireProfile } from "~/lib/session.server";
import { db } from "~/db/index.server";
import { support } from "~/db/schemas/payments";
import { PageHeader } from "~/components/dashboard/page-header";
import { Card } from "~/components/ui/card";
import { Button, ButtonLink } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { useToast } from "~/components/ui/toast";

export function meta() {
  return [{ title: "Dashboard · bayluv" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const { profile } = await requireProfile(request);
  const paid = await db.query.support.findMany({
    where: and(eq(support.profileId, profile.id), eq(support.status, "paid")),
    columns: { amountCents: true, feeCents: true, createdAt: true },
  });
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const earningsThisMonthCents = paid
    .filter((p) => p.createdAt >= startOfMonth)
    .reduce((sum, p) => sum + (p.amountCents - p.feeCents), 0);

  return {
    username: profile.username,
    displayName: profile.displayName,
    isPublished: profile.isPublished,
    stats: {
      supporters: profile.supporterCount,
      earningsThisMonthCents,
      pageViews: profile.pageViews,
    },
  };
}

export default function DashboardHome({ loaderData }: Route.ComponentProps) {
  const { username, displayName, isPublished, stats } = loaderData;
  const { toast } = useToast();
  const [origin] = useState(
    () => (typeof window !== "undefined" ? window.location.origin : "https://bayluv.com"),
  );
  const pageUrl = `${origin}/${username}`;

  const cards = [
    { label: "Supporters", value: stats.supporters, icon: Heart, tone: "primary" as const },
    {
      label: "Earned this month",
      value: `$${(stats.earningsThisMonthCents / 100).toFixed(0)}`,
      icon: Wallet,
      tone: "mint" as const,
    },
    { label: "Page views", value: stats.pageViews, icon: Eye, tone: "sky" as const },
  ];

  return (
    <>
      <PageHeader
        title={`Hey, ${displayName.split(" ")[0]} 👋`}
        subtitle="Here's how your page is doing."
        action={
          <ButtonLink to="/dashboard/page" variant="outline">
            Edit my page
          </ButtonLink>
        }
      />

      {/* Share link */}
      <Card className="mb-6 flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-muted">Your page link</p>
          <p className="truncate text-lg font-bold text-ink">{pageUrl}</p>
        </div>
        <div className="flex items-center gap-2">
          {isPublished ? (
            <Badge tone="success">Published</Badge>
          ) : (
            <Badge tone="sunny">Draft</Badge>
          )}
          <Button
            variant="soft"
            onClick={() => {
              navigator.clipboard?.writeText(pageUrl);
              toast({ tone: "success", title: "Link copied!" });
            }}
          >
            <Copy className="h-4 w-4" /> Copy
          </Button>
          <ButtonLink to={`/${username}`} reloadDocument target="_blank">
            Visit <ArrowUpRight className="h-4 w-4" />
          </ButtonLink>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="p-6">
            <div className="mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-primary-100 text-primary-700">
              <Icon className="h-5 w-5" />
            </div>
            <p className="text-3xl font-extrabold text-ink">{value}</p>
            <p className="text-sm font-medium text-muted">{label}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-6 p-6">
        <h2 className="text-lg font-bold text-ink">Get set up</h2>
        <p className="mt-1 text-ink-soft">
          Finish these steps to start earning.
        </p>
        <ul className="mt-4 space-y-2 text-ink-soft">
          <li className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-success-soft text-xs font-bold text-success">
              ✓
            </span>
            Create your page
          </li>
          <li className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-ink/10 text-xs font-bold text-muted">
              2
            </span>
            <ButtonLink to="/dashboard/payouts" variant="ghost" className="h-auto px-0">
              Connect payouts
            </ButtonLink>
          </li>
          <li className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-ink/10 text-xs font-bold text-muted">
              3
            </span>
            <ButtonLink to="/dashboard/page" variant="ghost" className="h-auto px-0">
              Customize &amp; publish
            </ButtonLink>
          </li>
        </ul>
      </Card>
    </>
  );
}
