import { ShoppingBag } from "lucide-react";
import { PageHeader, ComingSoon } from "~/components/dashboard/page-header";

export function meta() {
  return [{ title: "Shop · bayluv" }];
}

export default function Products() {
  return (
    <>
      <PageHeader title="Shop" subtitle="Sell digital products & services." />
      <ComingSoon
        icon={ShoppingBag}
        title="Your shop coming soon"
        description="Sell downloads, 1-1 calls, and commissions with one-tap checkout. Built in Phase 5."
      />
    </>
  );
}
