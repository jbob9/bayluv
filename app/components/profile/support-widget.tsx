import { useState } from "react";
import { Heart } from "lucide-react";
import { cn, formatMoney } from "~/lib/utils";
import { getTheme } from "~/lib/theme";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";

/** Preset tip amounts, in cents. */
const PRESETS = [300, 500, 1000];

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
  const [preset, setPreset] = useState(500);
  const [custom, setCustom] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [monthly, setMonthly] = useState(false);

  const amountCents = custom
    ? Math.max(100, Math.round(parseFloat(custom) * 100) || 0)
    : preset;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSupport({ quantity: 1, amountCents, name, message, monthly });
      }}
      className="space-y-4"
    >
      <h2 className="text-xl font-bold text-ink">
        Send {creatorName.split(" ")[0]} a tip
      </h2>

      {/* Amount selector */}
      <div className="flex items-center gap-3 rounded-2xl bg-ink/3 p-3">
        <span
          className={cn(
            "grid h-12 w-12 shrink-0 place-items-center rounded-xl",
            theme.soft,
          )}
        >
          <Heart className="h-6 w-6" />
        </span>
        <div className="flex flex-1 items-center gap-2">
          {PRESETS.map((cents) => (
            <button
              key={cents}
              type="button"
              onClick={() => {
                setPreset(cents);
                setCustom("");
              }}
              className={cn(
                "h-11 flex-1 rounded-xl border-2 text-[15px] font-bold transition-colors",
                !custom && preset === cents
                  ? cn(theme.bg, "border-transparent text-white")
                  : "border-border bg-surface text-ink hover:border-border-strong",
              )}
            >
              ${cents / 100}
            </button>
          ))}
          <div className="relative w-20">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted">
              $
            </span>
            <input
              type="number"
              min={1}
              placeholder="…"
              aria-label="Custom tip amount in dollars"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              className={cn(
                "h-11 w-full rounded-xl border-2 bg-surface pl-6 pr-2 text-[15px] font-bold text-ink outline-none",
                custom ? cn("border-current", theme.text) : "border-border",
              )}
            />
          </div>
        </div>
      </div>

      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name or @yoursocial"
        aria-label="Your name or social handle"
      />
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Say something nice…"
        aria-label="Your message"
      />

      <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-ink-soft">
        <input
          type="checkbox"
          checked={monthly}
          onChange={(e) => setMonthly(e.target.checked)}
          className="h-4 w-4 accent-primary"
        />
        Make this monthly
      </label>

      <Button
        type="submit"
        size="lg"
        disabled={pending}
        className={cn("w-full", theme.btn)}
      >
        {pending
          ? "Redirecting…"
          : `Tip ${formatMoney(amountCents)}${monthly ? " /mo" : ""}`}
      </Button>
    </form>
  );
}
