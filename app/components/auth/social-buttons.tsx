import { useState } from "react";
import { authClient } from "~/lib/auth-client";
import { cn } from "~/lib/utils";

const labels: Record<string, string> = {
  google: "Continue with Google",
  github: "Continue with GitHub",
};

export function SocialButtons({
  providers,
  callbackURL = "/dashboard",
}: {
  providers: string[];
  callbackURL?: string;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  if (!providers.length) return null;

  return (
    <div className="space-y-3">
      {providers.map((provider) => (
        <button
          key={provider}
          type="button"
          disabled={loading !== null}
          onClick={async () => {
            setLoading(provider);
            await authClient.signIn.social({ provider, callbackURL });
          }}
          className={cn(
            "flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border-2 border-border bg-surface font-semibold text-ink transition-colors hover:border-border-strong disabled:opacity-50",
          )}
        >
          {loading === provider ? "Redirecting…" : labels[provider] ?? provider}
        </button>
      ))}
    </div>
  );
}

export function OrDivider({ label = "or" }: { label?: string }) {
  return (
    <div className="my-5 flex items-center gap-3 text-sm text-muted">
      <span className="h-px flex-1 bg-border" />
      {label}
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
