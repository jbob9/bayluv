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
  imageUrl?: string | null;
  yearlyPriceCents?: number | null;
  joinable: boolean;
};

export function TierCard({
  tier,
  cycle = "month",
  pending,
  onJoin,
}: {
  tier: PublicTier;
  cycle?: "month" | "year";
  pending?: boolean;
  onJoin: (tierId: string, cycle: "month" | "year") => void;
}) {
  const theme = getTheme(tier.accentColor);
  // Show yearly pricing only when the cycle is yearly AND this tier offers it.
  const yearly = cycle === "year" && tier.yearlyPriceCents != null;
  const amount = yearly ? tier.yearlyPriceCents! : tier.priceCents;
  const per = yearly ? "year" : tier.interval;

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-card">
      <div
        className={cn(
          "relative flex h-28 items-center justify-center bg-linear-to-br",
          theme.coverFrom,
        )}
      >
        {tier.imageUrl ? (
          <img
            src={tier.imageUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <Crown className="h-10 w-10 text-white/90" />
        )}
      </div>

      <div className="space-y-4 p-6 text-center">
        <h3 className="font-display text-xl font-extrabold text-ink">
          {tier.name}
        </h3>
        <p className="text-3xl font-extrabold text-ink">
          {formatMoney(amount)}
          <span className="text-base font-medium text-muted"> / {per}</span>
        </p>
        <Button
          className={cn("w-full", theme.btn)}
          disabled={pending || !tier.joinable}
          onClick={() => onJoin(tier.id, yearly ? "year" : "month")}
        >
          {tier.joinable ? "Join" : "Coming soon"}
        </Button>
        {tier.description && (
          <p className="text-left text-ink-soft">{tier.description}</p>
        )}
        {tier.benefits.length > 0 && (
          <ul className="space-y-2 text-left">
            {tier.benefits.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-ink-soft">
                <Check className={cn("mt-0.5 h-5 w-5 shrink-0", theme.text)} />
                {b}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
