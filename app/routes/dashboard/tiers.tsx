import { Crown } from "lucide-react";
import { PageHeader, ComingSoon } from "~/components/dashboard/page-header";

export function meta() {
  return [{ title: "Memberships · bayluv" }];
}

export default function Tiers() {
  return (
    <>
      <PageHeader title="Memberships" subtitle="Recurring support tiers." />
      <ComingSoon
        icon={Crown}
        title="Membership tiers coming soon"
        description="Create monthly/yearly tiers with benefits and member-only perks. Built in Phase 4."
      />
    </>
  );
}
