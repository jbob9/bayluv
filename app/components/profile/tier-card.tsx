import { Check, Crown } from "lucide-react";
import { cn, formatMoney } from "~/lib/utils";
import { getTheme } from "~/lib/theme";
import { Button } from "~/components/ui/button";

export type PublicTier = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  interval: "month" | "year";
  benefits: string[];
  accentColor: string;
  joinable: boolean;
};

export function TierCard({
  tier,
  pending,
  onJoin,
}: {
  tier: PublicTier;
  pending?: boolean;
  onJoin: (tierId: string) => void;
}) {
  const theme = getTheme(tier.accentColor);
  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-card">
      <div className={cn("flex items-center gap-2 px-6 py-4 text-white", theme.bg)}>
        <Crown className="h-5 w-5" />
        <h3 className="font-display text-lg font-extrabold">{tier.name}</h3>
      </div>
      <div className="space-y-4 p-6">
        <p className="text-3xl font-extrabold text-ink">
          {formatMoney(tier.priceCents)}
          <span className="text-base font-medium text-muted">
            {" "}
            / {tier.interval}
          </span>
        </p>
        {tier.description && (
          <p className="text-ink-soft">{tier.description}</p>
        )}
        {tier.benefits.length > 0 && (
          <ul className="space-y-2">
            {tier.benefits.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-ink-soft">
                <Check className={cn("mt-0.5 h-5 w-5 shrink-0", theme.text)} />
                {b}
              </li>
            ))}
          </ul>
        )}
        <Button
          className={cn("w-full", theme.bg, "hover:brightness-95")}
          disabled={pending || !tier.joinable}
          onClick={() => onJoin(tier.id)}
        >
          {tier.joinable ? "Join" : "Coming soon"}
        </Button>
      </div>
    </div>
  );
}
