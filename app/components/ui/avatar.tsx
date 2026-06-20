import { cn } from "~/lib/utils";

const sizes = {
  sm: "h-9 w-9 text-sm",
  md: "h-12 w-12 text-base",
  lg: "h-20 w-20 text-2xl",
  xl: "h-28 w-28 text-4xl",
} as const;

export function Avatar({
  src,
  name,
  size = "md",
  className,
}: {
  src?: string | null;
  name?: string | null;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const initials = (name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-100 font-display font-bold text-primary-700 ring-2 ring-surface",
        sizes[size],
        className,
      )}
    >
      {src ? (
        <img
          src={src}
          alt={name ?? "avatar"}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      ) : (
        initials
      )}
    </span>
  );
}
