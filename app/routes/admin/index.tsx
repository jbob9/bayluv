import { eq } from "drizzle-orm";
import { PackageSearch, Users, Layers } from "lucide-react";
import type { Route } from "./+types/index";
import { requireAdmin } from "~/lib/session.server";
import { db } from "~/db/index.server";
import { affiliateProduct } from "~/db/schemas/affiliate";
import { PageHeader } from "~/components/dashboard/page-header";
import { Card } from "~/components/ui/card";
import { ButtonLink } from "~/components/ui/button";

export function meta() {
  return [{ title: "Admin · bayluv" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  const all = await db.query.affiliateProduct.findMany({
    columns: { id: true, network: true, isActive: true },
  });
  const networks = new Set(all.map((p) => p.network));
  return {
    total: all.length,
    active: all.filter((p) => p.isActive).length,
    networks: networks.size,
  };
}

export default function AdminHome({ loaderData }: Route.ComponentProps) {
  const { total, active, networks } = loaderData;
  const stats = [
    { label: "Catalog products", value: total, icon: PackageSearch },
    { label: "Active", value: active, icon: Layers },
    { label: "Networks", value: networks, icon: Users },
  ];
  return (
    <>
      <PageHeader
        title="Admin"
        subtitle="Manage the global affiliate product catalog."
        action={
          <ButtonLink to="/admin/affiliate-products">Manage catalog</ButtonLink>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className="p-6">
            <div className="mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-primary-100 text-primary-700">
              <s.icon className="h-5 w-5" />
            </div>
            <p className="text-3xl font-extrabold text-ink">{s.value}</p>
            <p className="text-sm font-medium text-muted">{s.label}</p>
          </Card>
        ))}
      </div>
    </>
  );
}
