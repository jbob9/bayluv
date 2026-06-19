import { Link } from "react-router";
import {
  Coffee,
  Crown,
  ShoppingBag,
  Link2,
  Sparkles,
  ArrowRight,
  Heart,
  Zap,
  ShieldCheck,
} from "lucide-react";
import type { Route } from "./+types/home";
import { getOptionalUser } from "~/lib/session.server";
import { Logo } from "~/components/brand/logo";
import { ButtonLink } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";

export function meta() {
  return [
    { title: "bayluv · Fund your creative work" },
    {
      name: "description",
      content:
        "Accept tips, start a membership, and sell digital products from one beautiful link in your bio.",
    },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getOptionalUser(request);
  return { signedIn: Boolean(user) };
}

const features = [
  {
    icon: Coffee,
    tone: "primary" as const,
    title: "One-time tips",
    body: "Let fans say thanks in a couple of taps — pick an amount, leave a message, done.",
  },
  {
    icon: Crown,
    tone: "sunny" as const,
    title: "Memberships",
    body: "Earn recurring income with monthly and yearly tiers and member-only perks.",
  },
  {
    icon: ShoppingBag,
    tone: "mint" as const,
    title: "A creative shop",
    body: "Sell ebooks, downloads, 1-1 calls, and commissions with one-tap checkout.",
  },
  {
    icon: Link2,
    tone: "sky" as const,
    title: "Link in bio",
    body: "One beautiful page for everything you make and everywhere you are.",
  },
];

const perks = [
  { icon: Zap, label: "Paid instantly", body: "Money lands in your account via Stripe — no 30-day delays." },
  { icon: Heart, label: "Made for creators", body: "They're your supporters, not transactions. You own the relationship." },
  { icon: ShieldCheck, label: "Keep more", body: "A low platform fee means more of every tip goes to you." },
];

export default function Home({ loaderData }: Route.ComponentProps) {
  const { signedIn } = loaderData;

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-cream/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo />
          <nav className="flex items-center gap-2">
            {signedIn ? (
              <ButtonLink to="/dashboard">Dashboard</ButtonLink>
            ) : (
              <>
                <ButtonLink to="/login" variant="ghost">
                  Log in
                </ButtonLink>
                <ButtonLink to="/signup">Start my page</ButtonLink>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_-10%,var(--color-primary-100),transparent_55%)]" />
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <Badge tone="primary" className="mx-auto">
            <Sparkles className="h-3 w-3" /> Loved by creators
          </Badge>
          <h1 className="mt-5 font-display text-6xl font-extrabold leading-[1.05] text-ink sm:text-7xl">
            Fund your <span className="text-primary">creative</span> work
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-xl text-ink-soft">
            Accept support, start a membership, and set up a shop — all from one
            link in your bio. It's easier than you think.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink to="/signup" size="lg">
              Start my page <ArrowRight className="h-5 w-5" />
            </ButtonLink>
            <ButtonLink to="/dev/styleguide" size="lg" variant="outline">
              See the design system
            </ButtonLink>
          </div>
          <p className="mt-4 text-sm text-muted">
            It's free and takes less than a minute.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, body, tone }) => (
            <Card key={title} className="p-6">
              <div className="mb-4">
                <Badge tone={tone} className="h-11 w-11 justify-center rounded-2xl">
                  <Icon className="h-5 w-5" />
                </Badge>
              </div>
              <h3 className="text-lg font-bold text-ink">{title}</h3>
              <p className="mt-1.5 text-ink-soft">{body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Perks */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-center font-display text-4xl font-extrabold text-ink">
          Designed for creators, not businesses.
        </h2>
        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {perks.map(({ icon: Icon, label, body }) => (
            <div key={label} className="text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-surface shadow-soft">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-ink">{label}</h3>
              <p className="mt-1 text-ink-soft">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-16 text-center text-primary-foreground shadow-pop">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,.2),transparent_45%)]" />
          <div className="relative">
            <h2 className="font-display text-4xl font-extrabold">
              Ready to get started?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-lg text-white/90">
              Join creators funding their work on bayluv.
            </p>
            <ButtonLink
              to="/signup"
              size="lg"
              variant="secondary"
              className="mt-7 bg-white text-ink hover:bg-white/90"
            >
              Create your page <ArrowRight className="h-5 w-5" />
            </ButtonLink>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted sm:flex-row">
          <Logo className="text-xl" />
          <p>© {new Date().getFullYear()} bayluv. Made for creators.</p>
          <div className="flex gap-4">
            <Link to="/login" className="hover:text-ink">
              Log in
            </Link>
            <Link to="/signup" className="hover:text-ink">
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
