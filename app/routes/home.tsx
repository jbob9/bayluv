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
  Star,
  Quote,
} from "lucide-react";
import type { Route } from "./+types/home";
import { getOptionalUser } from "~/lib/session.server";
import { Logo } from "~/components/brand/logo";
import { ButtonLink } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Avatar } from "~/components/ui/avatar";
import { cn } from "~/lib/utils";

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

const steps = [
  {
    n: "1",
    bg: "bg-primary",
    title: "Claim your link",
    body: "Grab bayluv.com/yourname and make it yours in under a minute.",
  },
  {
    n: "2",
    bg: "bg-mint",
    title: "Add your stuff",
    body: "Set up tips, membership tiers, products, and your favorite links.",
  },
  {
    n: "3",
    bg: "bg-sky",
    title: "Get paid",
    body: "Connect Stripe and money lands straight in your account. That's it.",
  },
];

const perks = [
  { icon: Zap, label: "Paid instantly", body: "Money lands in your account via Stripe — no 30-day delays." },
  { icon: Heart, label: "Made for creators", body: "They're your supporters, not transactions. You own the relationship." },
  { icon: ShieldCheck, label: "Keep more", body: "A low platform fee means more of every tip goes to you." },
];

const testimonials = [
  {
    quote: "Set up in literally two minutes and got my first coffee the same day. The page just feels nice.",
    name: "Maya R.",
    handle: "illustrator",
    tone: "primary" as const,
    tilt: "-2deg",
  },
  {
    quote: "Memberships changed everything — recurring income from my biggest fans without the Patreon cut.",
    name: "Devon K.",
    handle: "podcaster",
    tone: "mint" as const,
    tilt: "1.5deg",
  },
  {
    quote: "Sold out my first ebook in a week. One link does tips, shop, and everything else.",
    name: "Priya S.",
    handle: "designer",
    tone: "grape" as const,
    tilt: "-1deg",
  },
];

const floatingChips = [
  { name: "Nadia Q.", note: "sells art prints", tone: "grape" as const, className: "left-[2%] top-10", tilt: "-5deg", delay: "0s" },
  { name: "The Daily Brew", note: "a weekly newsletter", tone: "sky" as const, className: "left-[4%] top-72", tilt: "4deg", delay: "1.2s" },
  { name: "Leo Makes", note: "music & sample packs", tone: "mint" as const, className: "right-[3%] top-16", tilt: "5deg", delay: "0.6s" },
  { name: "Pixel Pals", note: "an indie game studio", tone: "sunny" as const, className: "right-[5%] top-72", tilt: "-4deg", delay: "1.8s" },
];

export default function Home({ loaderData }: Route.ComponentProps) {
  const { signedIn } = loaderData;

  return (
    <div className="min-h-screen overflow-x-hidden">
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
        {/* soft decorative blobs */}
        <div className="absolute -left-24 top-24 -z-10 h-72 w-72 rounded-full bg-mint-soft/60 blur-3xl" />
        <div className="absolute -right-24 top-40 -z-10 h-72 w-72 rounded-full bg-sky-soft/60 blur-3xl" />

        {/* floating creator chips (decorative) */}
        {floatingChips.map((c) => (
          <div
            key={c.name}
            style={{ ["--tilt" as string]: c.tilt, animationDelay: c.delay }}
            className={cn(
              "animate-float absolute z-0 hidden lg:block",
              c.className,
            )}
          >
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface/90 px-4 py-3 shadow-card backdrop-blur">
              <Avatar name={c.name} size="sm" />
              <div className="leading-tight">
                <p className="text-sm font-bold text-ink">{c.name}</p>
                <p className="text-xs text-muted">{c.note}</p>
              </div>
            </div>
          </div>
        ))}

        <div className="relative mx-auto max-w-3xl px-6 py-24 text-center">
          <Badge tone="primary" className="mx-auto gap-1.5 px-3 py-1.5">
            <Sparkles className="h-3.5 w-3.5 animate-wiggle" /> Made for every kind of creator
          </Badge>
          <h1 className="mt-5 font-display text-6xl font-extrabold leading-[1.02] text-ink sm:text-7xl">
            Fund your{" "}
            <span className="relative whitespace-nowrap text-primary">
              creative
              <svg
                className="absolute -bottom-2 left-0 w-full text-primary/40"
                viewBox="0 0 300 12"
                fill="none"
                aria-hidden
              >
                <path
                  d="M2 9C70 3 230 3 298 9"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
            </span>{" "}
            work
          </h1>
          <p className="mx-auto mt-7 max-w-xl text-xl text-ink-soft">
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
          <p className="mt-4 flex items-center justify-center gap-1.5 text-sm text-muted">
            <Coffee className="h-4 w-4" /> It's free and takes less than a minute.
          </p>
        </div>
      </section>

      {/* Stats strip */}
      <section className="mx-auto max-w-5xl px-6 pb-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { value: "4", label: "ways to earn" },
            { value: "5%", label: "low platform fee" },
            { value: "0", label: "payout delays" },
            { value: "1", label: "link for it all" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-3xl border border-border bg-surface px-4 py-5 text-center shadow-soft"
            >
              <p className="font-display text-3xl font-extrabold text-primary">
                {s.value}
              </p>
              <p className="text-sm font-medium text-muted">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="mb-10 text-center font-display text-4xl font-extrabold text-ink">
          Everything in one link
        </h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, body, tone }) => (
            <Card
              key={title}
              className="group p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-card"
            >
              <div className="mb-4">
                <Badge
                  tone={tone}
                  className="h-12 w-12 justify-center rounded-2xl transition-transform duration-200 group-hover:-rotate-6"
                >
                  <Icon className="h-6 w-6" />
                </Badge>
              </div>
              <h3 className="text-lg font-bold text-ink">{title}</h3>
              <p className="mt-1.5 text-ink-soft">{body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="mb-12 text-center font-display text-4xl font-extrabold text-ink">
          Up and running in 3 steps
        </h2>
        <div className="grid gap-8 sm:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="text-center">
              <div
                className={cn(
                  "mx-auto grid h-16 w-16 place-items-center rounded-2xl font-display text-2xl font-extrabold text-white [box-shadow:0_4px_0_rgba(0,0,0,0.12)]",
                  s.bg,
                )}
              >
                {s.n}
              </div>
              <h3 className="mt-5 text-xl font-bold text-ink">{s.title}</h3>
              <p className="mt-1 text-ink-soft">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Showcase — a peek at a real page */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <Badge tone="mint" className="mb-3">
              <Sparkles className="h-3 w-3" /> Your page, your vibe
            </Badge>
            <h2 className="font-display text-4xl font-extrabold leading-tight text-ink">
              A page fans actually want to support.
            </h2>
            <p className="mt-4 text-lg text-ink-soft">
              Pick an accent color, write your bio, drop in your links, and turn
              on a goal. Fans get a warm, friendly checkout — not a cold payment
              form.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "5 accent themes + cover & avatar",
                "Reorderable link blocks with click tracking",
                "Goal bar, supporter feed, and badges",
              ].map((t) => (
                <li key={t} className="flex items-center gap-3 text-ink-soft">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-success-soft text-xs font-bold text-success">
                    ✓
                  </span>
                  {t}
                </li>
              ))}
            </ul>
            <ButtonLink to="/signup" className="mt-7">
              Build mine <ArrowRight className="h-5 w-5" />
            </ButtonLink>
          </div>

          {/* Mock support widget */}
          <Card className="mx-auto w-full max-w-sm p-6">
            <div className="mb-4 flex items-center gap-3">
              <Avatar name="Ava Stone" size="lg" />
              <div>
                <p className="font-display text-lg font-extrabold text-ink">
                  Ava Stone
                </p>
                <p className="flex items-center gap-1 text-sm text-muted">
                  <Heart className="h-3.5 w-3.5 text-primary" /> 248 supporters
                </p>
              </div>
            </div>
            <h3 className="text-lg font-bold text-ink">Support Ava</h3>
            <div className="mt-3 flex items-center gap-3 rounded-2xl bg-primary-50 p-3">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary-100 text-primary-700">
                <Coffee className="h-6 w-6" />
              </span>
              <span className="text-2xl font-bold text-muted">×</span>
              <div className="flex flex-1 items-center gap-2">
                {[1, 3, 5].map((n, i) => (
                  <span
                    key={n}
                    className={cn(
                      "grid h-11 flex-1 place-items-center rounded-xl border-2 text-lg font-bold",
                      i === 0
                        ? "border-transparent bg-primary text-white"
                        : "border-border bg-surface text-ink",
                    )}
                  >
                    {n}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-4 h-12 rounded-2xl border-2 border-border bg-paper" />
            <div className="mt-3 h-20 rounded-2xl border-2 border-border bg-paper" />
            <div className="mt-4 grid h-12 place-items-center rounded-full bg-primary font-bold text-white [box-shadow:0_3px_0_var(--color-primary-700)]">
              Support $5
            </div>
          </Card>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="mb-12 text-center font-display text-4xl font-extrabold text-ink">
          Creators are into it
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <Card
              key={t.name}
              style={{ ["--tilt" as string]: t.tilt }}
              className="p-6 rotate-(--tilt) transition-transform duration-200 hover:rotate-0"
            >
              <Quote className="h-7 w-7 text-primary/30" />
              <p className="mt-2 text-ink">{t.quote}</p>
              <div className="mt-5 flex items-center gap-3">
                <Avatar name={t.name} size="sm" />
                <div>
                  <p className="text-sm font-bold text-ink">{t.name}</p>
                  <p className="text-xs text-muted">{t.handle}</p>
                </div>
                <div className="ml-auto flex gap-0.5 text-sunny">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
              </div>
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
        <div className="relative overflow-hidden rounded-[2.5rem] bg-primary px-8 py-16 text-center text-primary-foreground shadow-pop">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,.25),transparent_45%)]" />
          <Coffee className="absolute left-8 top-8 h-10 w-10 text-white/20" />
          <Heart className="absolute bottom-8 right-10 h-12 w-12 text-white/20" />
          <div className="relative">
            <h2 className="font-display text-4xl font-extrabold sm:text-5xl">
              Ready to get started?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-lg text-white/90">
              Join creators funding their work on bayluv.
            </p>
            <ButtonLink
              to="/signup"
              size="lg"
              className="mt-7 bg-white text-ink [box-shadow:0_3px_0_var(--color-border-strong)] hover:bg-white"
            >
              Create your page <ArrowRight className="h-5 w-5" />
            </ButtonLink>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted sm:flex-row">
          <Logo className="text-xl" />
          <p>© {new Date().getFullYear()} bayluv. Made with ☕ for creators.</p>
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
