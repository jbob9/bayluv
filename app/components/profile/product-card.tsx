import { FileDown, Video, Brush, ShoppingBag } from "lucide-react";
import { cn, formatMoney } from "~/lib/utils";
import { getTheme } from "~/lib/theme";
import { Button } from "~/components/ui/button";

export type PublicProduct = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  type: "digital" | "call" | "commission";
  imageUrl: string | null;
};

const typeIcon = { digital: FileDown, call: Video, commission: Brush } as const;

export function ProductCard({
  product,
  themeColor,
  pending,
  onBuy,
}: {
  product: PublicProduct;
  themeColor?: string | null;
  pending?: boolean;
  onBuy: (productId: string) => void;
}) {
  const theme = getTheme(themeColor);
  const Icon = typeIcon[product.type];

  return (
    <div className="flex gap-4 rounded-2xl border border-border bg-surface p-4 shadow-soft">
      <div
        className={cn(
          "grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl",
          theme.soft,
        )}
      >
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <Icon className="h-7 w-7" />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="font-bold text-ink">{product.name}</h3>
        {product.description && (
          <p className="line-clamp-2 text-sm text-ink-soft">{product.description}</p>
        )}
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-lg font-extrabold text-ink">
            {formatMoney(product.priceCents)}
          </span>
          <Button
            size="sm"
            className={cn(theme.btn)}
            disabled={pending}
            onClick={() => onBuy(product.id)}
          >
            <ShoppingBag className="h-4 w-4" /> Buy
          </Button>
        </div>
      </div>
    </div>
  );
}
