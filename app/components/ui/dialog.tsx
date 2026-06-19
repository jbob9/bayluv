import * as React from "react";
import { X } from "lucide-react";
import { cn } from "~/lib/utils";

/**
 * Lightweight modal dialog. Controlled via `open` / `onOpenChange`.
 * Closes on Escape and backdrop click; locks scroll while open.
 */
export function Dialog({
  open,
  onOpenChange,
  children,
  className,
  title,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onOpenChange(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm animate-[fadeIn_.15s_ease]"
        onClick={() => onOpenChange(false)}
      />
      <div
        className={cn(
          "relative z-10 w-full max-w-lg rounded-t-3xl bg-surface p-6 shadow-card sm:rounded-3xl",
          className,
        )}
      >
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          aria-label="Close"
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-muted transition-colors hover:bg-ink/5 hover:text-ink"
        >
          <X className="h-5 w-5" />
        </button>
        {title && (
          <h2 className="mb-4 pr-10 text-xl font-bold text-ink">{title}</h2>
        )}
        {children}
      </div>
    </div>
  );
}
