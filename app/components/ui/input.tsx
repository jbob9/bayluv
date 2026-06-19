import * as React from "react";
import { cn } from "~/lib/utils";

// Warm, rounded fields: a soft cream fill that turns white on focus with a
// friendly coral glow ring (instead of a hard outline).
export const inputBase =
  "w-full rounded-2xl border-2 border-border bg-paper px-4 text-[15px] font-medium text-ink placeholder:font-normal placeholder:text-muted transition-all hover:border-border-strong focus:border-primary focus:bg-surface focus:outline-none focus:[box-shadow:0_0_0_4px_var(--color-primary-100)]";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type = "text", ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn(inputBase, "h-12", className)}
    {...props}
  />
));
Input.displayName = "Input";
