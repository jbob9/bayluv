import * as React from "react";
import { cn } from "~/lib/utils";

type Tone = "neutral" | "primary" | "mint" | "sky" | "grape" | "sunny" | "success";

const tones: Record<Tone, string> = {
  neutral: "bg-ink/5 text-ink-soft",
  primary: "bg-primary-100 text-primary-700",
  mint: "bg-mint-soft text-mint",
  sky: "bg-sky-soft text-sky",
  grape: "bg-grape-soft text-grape",
  sunny: "bg-sunny-soft text-[#946100]",
  success: "bg-success-soft text-success",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
