import { cn } from "~/lib/utils";

export type ChartPoint = { label: string; value: number; tooltip?: string };

/**
 * Minimal, dependency-free SVG bar chart. Bars scale to the max value;
 * empty data renders a friendly baseline.
 */
export function BarChart({
  data,
  className,
  formatValue = (v) => String(v),
}: {
  data: ChartPoint[];
  className?: string;
  formatValue?: (v: number) => string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className={cn("w-full", className)}>
      <div className="flex h-40 items-end gap-1">
        {data.map((d, i) => {
          const pct = (d.value / max) * 100;
          return (
            <div
              key={i}
              className="group relative flex flex-1 flex-col items-center justify-end"
              title={d.tooltip ?? `${d.label}: ${formatValue(d.value)}`}
            >
              <div
                className={cn(
                  "w-full rounded-t-md transition-all duration-300",
                  d.value > 0 ? "bg-primary group-hover:bg-primary-600" : "bg-ink/5",
                )}
                style={{ height: `${Math.max(pct, 2)}%` }}
              />
            </div>
          );
        })}
      </div>
      {total === 0 && (
        <p className="mt-3 text-center text-sm text-muted">
          No data yet — earnings will appear here as they come in.
        </p>
      )}
    </div>
  );
}
