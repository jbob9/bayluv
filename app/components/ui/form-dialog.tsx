import * as React from "react";
import { useFetcher } from "react-router";
import { Dialog } from "./dialog";
import { Button } from "./button";
import { useToast } from "./toast";
import { cn } from "~/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "soft" | "danger";
type Size = "sm" | "md" | "lg" | "icon";

type Trigger = {
  label?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: Variant;
  size?: Size;
  className?: string;
  "aria-label"?: string;
};

/**
 * A modal containing a form. Submits via a fetcher to the current route's
 * action, shows a toast from the `{ ok | error }` result, and closes on success.
 * Pass the form fields (including a hidden `intent`) as children — the dialog
 * renders the Cancel/Submit footer.
 */
export function FormDialog({
  title,
  description,
  trigger,
  submitLabel = "Save",
  className,
  children,
}: {
  title: string;
  description?: string;
  trigger: Trigger;
  submitLabel?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const fetcher = useFetcher<{ ok?: string; error?: string }>();
  const { toast } = useToast();
  const busy = fetcher.state !== "idle";
  const Icon = trigger.icon;

  React.useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) return;
    if (fetcher.data.ok) {
      toast({ tone: "success", title: fetcher.data.ok });
      setOpen(false);
    } else if (fetcher.data.error) {
      toast({ tone: "error", title: fetcher.data.error });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher.state, fetcher.data]);

  return (
    <>
      <Button
        type="button"
        variant={trigger.variant ?? "primary"}
        size={trigger.size}
        className={trigger.className}
        aria-label={trigger["aria-label"]}
        onClick={() => setOpen(true)}
      >
        {Icon && <Icon className="h-4 w-4" />}
        {trigger.label}
      </Button>

      <Dialog open={open} onOpenChange={setOpen} title={title} className={className}>
        {description && <p className="-mt-2 mb-4 text-sm text-muted">{description}</p>}
        <fetcher.Form method="post" className="space-y-4">
          {children}
          <div className={cn("flex justify-end gap-2 pt-2")}>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : submitLabel}
            </Button>
          </div>
        </fetcher.Form>
      </Dialog>
    </>
  );
}
