import { Link } from "react-router";
import { cn } from "~/lib/utils";

/** bayluv wordmark with a little coffee-heart mark. */
export function Logo({
  className,
  to = "/",
}: {
  className?: string;
  to?: string;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "inline-flex items-center gap-2 font-display text-2xl font-extrabold tracking-tight text-ink",
        className,
      )}
    >
      <span className="grid h-9 w-9 place-items-center rounded-2xl bg-primary text-lg text-primary-foreground shadow-soft">
        b
      </span>
      bayluv
    </Link>
  );
}
