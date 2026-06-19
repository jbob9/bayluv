import { Coffee, Heart, ShoppingBag, Sparkles } from "lucide-react";
import { Logo } from "~/components/brand/logo";

/** Split-screen shell for the login / signup pages. */
export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Form side */}
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Logo />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <h1 className="text-3xl font-extrabold text-ink">{title}</h1>
          <p className="mt-1 text-ink-soft">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>

      {/* Brand side */}
      <div className="relative hidden overflow-hidden bg-primary lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,.25),transparent_45%)]" />
        <div className="relative flex h-full flex-col justify-center gap-6 p-14 text-primary-foreground">
          <Sparkles className="h-10 w-10 opacity-90" />
          <h2 className="font-display text-4xl font-extrabold leading-tight">
            Fund your creative work.
          </h2>
          <p className="max-w-md text-lg text-white/90">
            Accept tips, start a membership, and sell digital products — all from
            one beautiful link in your bio.
          </p>
          <ul className="mt-2 space-y-3 text-white/95">
            <li className="flex items-center gap-3">
              <Coffee className="h-5 w-5" /> One-time support, in a couple of taps
            </li>
            <li className="flex items-center gap-3">
              <Heart className="h-5 w-5" /> Recurring memberships for your biggest fans
            </li>
            <li className="flex items-center gap-3">
              <ShoppingBag className="h-5 w-5" /> A shop built for creators
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
