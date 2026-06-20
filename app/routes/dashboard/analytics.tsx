import { eq, and, desc } from "drizzle-orm";
import { Heart, Wallet, Eye, MousePointerClick, Crown } from "lucide-react";
import type { Route } from "./+types/analytics";
import { requireProfile } from "~/lib/session.server";
import { db } from "~/db/index.server";
import { support } from "~/db/schemas/payments";
import { order } from "~/db/schemas/shop";
import { membership } from "~/db/schemas/membership";
import { link } from "~/db/schemas/profile";
import { formatMoney } from "~/lib/utils";
import { PageHeader } from "~/components/dashboard/page-header";
import { BarChart, type ChartPoint } from "~/components/dashboard/bar-chart";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Avatar } from "~/components/ui/avatar";

export function meta() {
  return [{ title: "Analytics · bayluv" }];
}

const DAYS = 30;

export async function loader({ request }: Route.LoaderArgs) {
  const { profile } = await requireProfile(request);

  const [tips, orders, links, activeMembers] = await Promise.all([
    db.query.support.findMany({
      where: and(eq(support.profileId, profile.id), eq(support.status, "paid")),
    }),
    db.query.order.findMany({
      where: and(eq(order.profileId, profile.id), eq(order.status, "paid")),
    }),
    db.query.link.findMany({
      where: eq(link.profileId, profile.id),
      orderBy: desc(link.clicks),
      limit: 5,
    }),
    db.query.membership.findMany({
      where: and(
        eq(membership.profileId, profile.id),
        eq(membership.status, "active"),
      ),
      columns: { id: true },
    }),
  ]);

  const tipCents = tips.reduce((s, t) => s + (t.amountCents - t.feeCents), 0);
  const orderCents = orders.reduce((s, o) => s + (o.amountCents - o.feeCents), 0);

  // Daily earnings buckets for the last 30 days.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const buckets = Array.from({ length: DAYS }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (DAYS - 1 - i));
    return { date: d, cents: 0 };
  });
  const add = (createdAt: Date, cents: number) => {
    const day = new Date(createdAt);
    day.setHours(0, 0, 0, 0);
    const b = buckets.find((x) => x.date.getTime() === day.getTime());
    if (b) b.cents += cents;
  };
  tips.forEach((t) => add(t.createdAt, t.amountCents - t.feeCents));
  orders.forEach((o) => add(o.createdAt, o.amountCents - o.feeCents));

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const earnedThisMonth = buckets
    .filter((b) => b.date >= monthStart)
    .reduce((s, b) => s + b.cents, 0);

  // Top supporters by total tipped (grouped by name).
  const byName = new Map<string, number>();
  for (const t of tips) {
    const key = t.supporterName?.trim() || "Someone";
    byName.set(key, (byName.get(key) ?? 0) + t.amountCents);
  }
  const topSupporters = [...byName.entries()]
    .map(([name, cents]) => ({ name, cents }))
    .sort((a, b) => b.cents - a.cents)
    .slice(0, 5);

  return {
    totals: {
      raisedCents: tipCents + orderCents,
      earnedThisMonth,
      supporters: profile.supporterCount,
      pageViews: profile.pageViews,
      activeMembers: activeMembers.length,
    },
    chart: buckets.map<ChartPoint>((b) => ({
      label: String(b.date.getDate()),
      value: b.cents,
      tooltip: `${b.date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}: ${formatMoney(b.cents)}`,
    })),
    topSupporters,
    topLinks: links
      .filter((l) => l.type !== "header")
      .map((l) => ({ title: l.title, clicks: l.clicks })),
  };
}

export default function Analytics({ loaderData }: Route.ComponentProps) {
  const { totals, chart, topSupporters, topLinks } = loaderData;

  const stats = [
    { label: "Net earnings", value: formatMoney(totals.raisedCents), icon: Wallet, tone: "bg-primary-100 text-primary-700" },
    { label: "This month", value: formatMoney(totals.earnedThisMonth), icon: Wallet, tone: "bg-mint-soft text-mint" },
    { label: "Supporters", value: totals.supporters, icon: Heart, tone: "bg-grape-soft text-grape" },
    { label: "Members", value: totals.activeMembers, icon: Crown, tone: "bg-sunny-soft text-[#946100]" },
    { label: "Page views", value: totals.pageViews, icon: Eye, tone: "bg-sky-soft text-sky" },
  ];

  return (
    <>
      <PageHeader title="Analytics" subtitle="How your page is performing." />

      <div className="mb-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <div className={`mb-3 grid h-10 w-10 place-items-center rounded-xl ${s.tone}`}>
              <s.icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-extrabold text-ink">{s.value}</p>
            <p className="text-sm font-medium text-muted">{s.label}</p>
          </Card>
        ))}
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Earnings — last 30 days</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart data={chart} formatValue={formatMoney} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top supporters</CardTitle>
          </CardHeader>
          <CardContent>
            {topSupporters.length === 0 ? (
              <p className="text-sm text-muted">No supporters yet.</p>
            ) : (
              <ul className="space-y-3">
                {topSupporters.map((s, i) => (
                  <li key={s.name} className="flex items-center gap-3">
                    <span className="w-4 text-sm font-bold text-muted">{i + 1}</span>
                    <Avatar name={s.name} size="sm" />
                    <span className="flex-1 truncate font-semibold text-ink">{s.name}</span>
                    <span className="font-bold text-ink">{formatMoney(s.cents)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top links</CardTitle>
          </CardHeader>
          <CardContent>
            {topLinks.length === 0 ? (
              <p className="text-sm text-muted">No links yet.</p>
            ) : (
              <ul className="space-y-3">
                {topLinks.map((l) => (
                  <li key={l.title} className="flex items-center gap-3">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink/5 text-ink-soft">
                      <MousePointerClick className="h-4 w-4" />
                    </span>
                    <span className="flex-1 truncate font-semibold text-ink">{l.title}</span>
                    <span className="font-bold text-ink">{l.clicks}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
