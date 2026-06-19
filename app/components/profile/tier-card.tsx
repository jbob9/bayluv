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
      {/* Cover band — image or a themed gradient with a crown */}
      <div
        className={cn(
          "relative flex h-28 items-center justify-center bg-linear-to-br",
          theme.coverFrom,
        )}
      >
        {tier.imageUrl ? (
          <img src={tier.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <Crown className="h-10 w-10 text-white/90" />
        )}
      </div>

      <div className="space-y-4 p-6 text-center">
        <h3 className="font-display text-xl font-extrabold text-ink">
          {tier.name}
        </h3>
        <p className="text-3xl font-extrabold text-ink">
          {formatMoney(tier.priceCents)}
          <span className="text-base font-medium text-muted">
            {" "}
            / {tier.interval}
          </span>
        </p>
        <Button
          className={cn("w-full", theme.btn)}
          disabled={pending || !tier.joinable}
          onClick={() => onJoin(tier.id)}
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
