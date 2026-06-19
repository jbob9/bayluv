import { desc, eq, and } from "drizzle-orm";
import { Heart } from "lucide-react";
import type { Route } from "./+types/supporters";
import { requireProfile } from "~/lib/session.server";
import { db } from "~/db/index.server";
import { support } from "~/db/schemas/payments";
import { formatMoney } from "~/lib/utils";
import { PageHeader, ComingSoon } from "~/components/dashboard/page-header";
import { Card } from "~/components/ui/card";
import { Avatar } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";

export function meta() {
  return [{ title: "Supporters · bayluv" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const { profile } = await requireProfile(request);
  const rows = await db.query.support.findMany({
    where: and(eq(support.profileId, profile.id), eq(support.status, "paid")),
    orderBy: desc(support.createdAt),
    limit: 100,
  });
  const totalCents = rows.reduce((sum, r) => sum + r.amountCents, 0);
  return {
    total: rows.length,
    totalCents,
    supporters: rows.map((r) => ({
      id: r.id,
      name: r.supporterName,
      quantity: r.quantity,
      amountCents: r.amountCents,
      message: r.message,
      isMonthly: r.isMonthly,
      createdAt: r.createdAt,
    })),
  };
}

export default function Supporters({ loaderData }: Route.ComponentProps) {
  const { supporters, total, totalCents } = loaderData;

  return (
    <>
      <PageHeader
        title="Supporters"
        subtitle={`${total} supporters · ${formatMoney(totalCents)} raised`}
      />

      {supporters.length === 0 ? (
        <ComingSoon
          icon={Heart}
          title="No supporters yet"
          description="When someone tips you or joins a membership, they'll show up here."
        />
      ) : (
        <Card className="divide-y divide-border">
          {supporters.map((s) => (
            <div key={s.id} className="flex items-start gap-3 p-4">
              <Avatar name={s.name ?? "Someone"} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-ink">
                  <span className="font-bold">{s.name ?? "Someone"}</span>{" "}
                  {s.isMonthly ? "is a monthly supporter" : "supported you"}
                </p>
                {s.message && (
                  <p className="mt-1 text-sm text-ink-soft">{s.message}</p>
                )}
              </div>
              <div className="text-right">
                <p className="font-bold text-ink">{formatMoney(s.amountCents)}</p>
                {s.isMonthly && <Badge tone="grape">Monthly</Badge>}
              </div>
            </div>
          ))}
        </Card>
      )}
    </>
  );
}
