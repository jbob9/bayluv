import { cn } from "~/lib/utils";

export function Progress({
  value,
  className,
  barClassName,
}: {
  /** 0–100 (values above 100 are clamped for the bar but can be shown in a label). */
  value: number;
  className?: string;
  barClassName?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "h-3 w-full overflow-hidden rounded-full bg-ink/10",
        className,
      )}
    >
      <div
        className={cn(
          "h-full rounded-full bg-success transition-[width] duration-500 ease-out",
          barClassName,
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
