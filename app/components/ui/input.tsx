import * as React from "react";
import { cn } from "~/lib/utils";

export const inputBase =
  "w-full rounded-xl border-2 border-border bg-surface px-4 text-[15px] text-ink placeholder:text-muted transition-colors hover:border-border-strong focus:border-primary focus:outline-none";

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
