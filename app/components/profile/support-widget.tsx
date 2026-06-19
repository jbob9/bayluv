import { useState } from "react";
import { Coffee } from "lucide-react";
import { cn } from "~/lib/utils";
import { getTheme } from "~/lib/theme";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";

const PRESETS = [1, 3, 5];
const UNIT_PRICE = 5; // dollars per "coffee"

export type SupportPayload = {
  quantity: number;
  amountCents: number;
  name: string;
  message: string;
  monthly: boolean;
};

export function SupportWidget({
  creatorName,
  themeColor,
  pending,
  onSupport,
}: {
  creatorName: string;
  themeColor?: string | null;
  pending?: boolean;
  onSupport: (payload: SupportPayload) => void;
}) {
  const theme = getTheme(themeColor);
  const [qty, setQty] = useState(1);
  const [custom, setCustom] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [monthly, setMonthly] = useState(false);

  const quantity = custom ? Math.max(1, parseInt(custom, 10) || 1) : qty;
  const amountCents = quantity * UNIT_PRICE * 100;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSupport({ quantity, amountCents, name, message, monthly });
      }}
      className="space-y-4"
    >
      <h2 className="text-xl font-bold text-ink">
        Buy {creatorName.split(" ")[0]} a coffee
      </h2>

      {/* Quantity selector */}
      <div className="flex items-center gap-3 rounded-2xl bg-primary-50 p-3">
        <span className={cn("grid h-12 w-12 place-items-center rounded-xl text-2xl", theme.soft)}>
          <Coffee className="h-6 w-6" />
        </span>
        <span className="text-2xl font-bold text-muted">×</span>
        <div className="flex flex-1 items-center gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setQty(p);
                setCustom("");
              }}
              className={cn(
                "h-11 flex-1 rounded-xl border-2 text-lg font-bold transition-colors",
                !custom && qty === p
                  ? cn(theme.bg, "border-transparent text-white")
                  : "border-border bg-surface text-ink hover:border-border-strong",
              )}
            >
              {p}
            </button>
          ))}
          <input
            type="number"
            min={1}
            placeholder="…"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            className={cn(
              "h-11 w-16 rounded-xl border-2 bg-surface text-center text-lg font-bold text-ink outline-none",
              custom ? cn(theme.ring, "border-current", theme.text) : "border-border",
            )}
          />
        </div>
      </div>

      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name or @yoursocial"
      />
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Say something nice…"
      />

      <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-ink-soft">
        <input
          type="checkbox"
          checked={monthly}
          onChange={(e) => setMonthly(e.target.checked)}
          className="h-4 w-4 accent-[var(--color-primary)]"
        />
        Make this monthly
      </label>

      <Button
        type="submit"
        size="lg"
        disabled={pending}
        className={cn("w-full", theme.bg, "hover:brightness-95")}
      >
        {pending
          ? "Redirecting…"
          : `Support $${(amountCents / 100).toFixed(0)}${monthly ? " /mo" : ""}`}
      </Button>
    </form>
  );
}
