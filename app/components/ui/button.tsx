import * as React from "react";
import { Link, type LinkProps } from "react-router";
import { cn } from "~/lib/utils";

type Variant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "soft"
  | "danger";
type Size = "sm" | "md" | "lg" | "icon";

// Chunky, tactile, candy-like buttons: solid colors sit on a darker "lip"
// (bottom box-shadow) so they feel pressable, lift on hover, and squish on tap.
const base =
  "inline-flex items-center justify-center gap-2 font-bold whitespace-nowrap rounded-full transition-all duration-150 ease-out select-none active:scale-[0.96] disabled:opacity-50 disabled:pointer-events-none disabled:hover:translate-y-0";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground [box-shadow:0_3px_0_var(--color-primary-700),0_10px_22px_-10px_rgba(255,92,57,0.55)] hover:-translate-y-0.5 hover:bg-primary-600 hover:[box-shadow:0_5px_0_var(--color-primary-700),0_18px_30px_-12px_rgba(255,92,57,0.6)]",
  secondary:
    "bg-ink text-white [box-shadow:0_3px_0_#140f0a] hover:-translate-y-0.5 hover:bg-ink/90",
  outline:
    "border-2 border-border-strong bg-surface text-ink [box-shadow:0_3px_0_var(--color-border-strong)] hover:-translate-y-0.5 hover:border-primary hover:text-primary",
  ghost: "text-ink-soft hover:bg-ink/5 hover:text-ink",
  soft: "bg-primary-100 text-primary-700 hover:-translate-y-0.5 hover:bg-primary-200",
  danger:
    "bg-danger text-white [box-shadow:0_3px_0_#b81e22] hover:-translate-y-0.5 hover:brightness-105",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-[15px]",
  lg: "h-14 px-8 text-lg",
  icon: "h-11 w-11",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export interface ButtonLinkProps extends LinkProps {
  variant?: Variant;
  size?: Size;
}

export function ButtonLink({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}

export const buttonVariants = ({
  variant = "primary",
  size = "md",
}: { variant?: Variant; size?: Size } = {}) =>
  cn(base, variants[variant], sizes[size]);
