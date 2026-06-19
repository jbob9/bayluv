export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-extrabold text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-ink-soft">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/** Empty-state placeholder used by sections still being built out. */
export function ComingSoon({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border bg-paper px-6 py-20 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary-100 text-primary-700">
        <Icon className="h-8 w-8" />
      </div>
      <h2 className="mt-5 text-xl font-bold text-ink">{title}</h2>
      <p className="mt-1 max-w-sm text-ink-soft">{description}</p>
    </div>
  );
}
