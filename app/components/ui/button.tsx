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

const base =
  "inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap rounded-full transition-all duration-150 active:scale-[.98] disabled:opacity-50 disabled:pointer-events-none select-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground shadow-soft hover:bg-primary-600 hover:shadow-pop",
  secondary:
    "bg-ink text-white hover:bg-ink/90 shadow-soft",
  outline:
    "border-2 border-border-strong bg-surface text-ink hover:border-primary hover:text-primary",
  ghost: "text-ink-soft hover:bg-ink/5 hover:text-ink",
  soft: "bg-primary-100 text-primary-700 hover:bg-primary-200",
  danger: "bg-danger text-white hover:brightness-95 shadow-soft",
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
