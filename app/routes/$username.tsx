import { useEffect } from "react";
import { useFetcher, useSearchParams } from "react-router";
import { desc, eq, and } from "drizzle-orm";
import { Share2, ExternalLink, Heart, Eye } from "lucide-react";
import type { Route } from "./+types/$username";
import { getPublicProfile } from "~/lib/profile.server";
import { getOptionalUser } from "~/lib/session.server";
import { db } from "~/db/index.server";
import { support } from "~/db/schemas/payments";
import { tier as tierTable } from "~/db/schemas/membership";
import { product as productTable } from "~/db/schemas/shop";
import { asc } from "drizzle-orm";
import { getTheme } from "~/lib/theme";
import { cn, formatMoney } from "~/lib/utils";
import { Logo } from "~/components/brand/logo";
import { Avatar } from "~/components/ui/avatar";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Progress } from "~/components/ui/progress";
import { useToast } from "~/components/ui/toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import { SocialRow } from "~/components/profile/socials";
import { SupportWidget } from "~/components/profile/support-widget";
import { TierCard } from "~/components/profile/tier-card";
import { ProductCard } from "~/components/profile/product-card";

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData?.profile) return [{ title: "Not found · bayluv" }];
  const p = loaderData.profile;
  return [
    { title: `${p.displayName} · bayluv` },
    { name: "description", content: p.tagline ?? p.bio ?? `Support ${p.displayName} on bayluv` },
  ];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const viewer = await getOptionalUser(request);
  const profile = await getPublicProfile(params.username, viewer?.id);
  if (!profile) throw new Response("Not found", { status: 404 });
  const isPreview = !profile.isPublished;

  const supporters = await db.query.support.findMany({
    where: and(
      eq(support.profileId, profile.id),
      eq(support.status, "paid"),
      eq(support.isPublic, true),
    ),
    orderBy: desc(support.createdAt),
    limit: 8,
  });

  // Actual amount raised (all paid tips), for the goal bar.
  const paid = await db.query.support.findMany({
    where: and(eq(support.profileId, profile.id), eq(support.status, "paid")),
    columns: { amountCents: true },
  });
  const raisedCents = paid.reduce((sum, p) => sum + p.amountCents, 0);

  const tiers = await db.query.tier.findMany({
    where: and(eq(tierTable.profileId, profile.id), eq(tierTable.isActive, true)),
    orderBy: asc(tierTable.priceCents),
  });

  const products = await db.query.product.findMany({
    where: and(
      eq(productTable.profileId, profile.id),
      eq(productTable.isActive, true),
    ),
    orderBy: asc(productTable.sortOrder),
  });

  return {
    profile,
    isPreview,
    raisedCents,
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      priceCents: p.priceCents,
      type: p.type,
      imageUrl: p.imageUrl,
    })),
    tiers: tiers.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      priceCents: t.priceCents,
      interval: t.interval,
      benefits: t.benefits ?? [],
      accentColor: t.accentColor,
      imageUrl: t.imageUrl,
      joinable: Boolean(t.stripePriceId),
    })),
    supporters: supporters.map((s) => ({
      id: s.id,
      name: s.supporterName,
      amountCents: s.amountCents,
      message: s.message,
      isMonthly: s.isMonthly,
    })),
  };
}

type CheckoutFetcher = {
  url?: string;
  error?: string;
  loginRequired?: boolean;
  redirect?: string;
};

export default function PublicProfile({ loaderData }: Route.ComponentProps) {
  const { profile, supporters, tiers, products, isPreview, raisedCents } =
    loaderData;
  const theme = getTheme(profile.themeColor);
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const fetcher = useFetcher<CheckoutFetcher>();
  const checkingOut = fetcher.state !== "idle";
  const tags = (profile.category ?? "")
    .split(/[,|]/)
    .map((t) => t.trim())
    .filter(Boolean);

  // Redirect to Stripe Checkout / login (or surface an error) on action return.
  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) return;
    const d = fetcher.data;
    if (d.url) {
      window.location.href = d.url;
    } else if (d.loginRequired && d.redirect) {
      window.location.href = d.redirect;
    } else if (d.error) {
      toast({ tone: "error", title: d.error });
    }
  }, [fetcher.state, fetcher.data, toast]);

  const joinTier = (tierId: string) =>
    fetcher.submit(
      { tierId, username: profile.username },
      { method: "post", action: "/api/checkout/subscription" },
    );

  const buyProduct = (productId: string) =>
    fetcher.submit(
      { productId },
      { method: "post", action: "/api/checkout/product" },
    );

  const tip = (p: {
    quantity: number;
    amountCents: number;
    name: string;
    message: string;
    monthly: boolean;
  }) =>
    fetcher.submit(
      {
        username: profile.username,
        quantity: String(p.quantity),
        amountCents: String(p.amountCents),
        name: p.name,
        message: p.message,
        monthly: String(p.monthly),
      },
      { method: "post", action: "/api/checkout/tip" },
    );

  // One-time toast for return from Checkout.
  useEffect(() => {
    const status = params.get("support");
    if (status === "success") {
      toast({ tone: "success", title: "Thank you for the support! 🎉" });
    } else if (status === "cancel") {
      toast({ tone: "info", title: "Checkout canceled" });
    }
    if (status) {
      params.delete("support");
      setParams(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goalCents = profile.goalAmountCents ?? 0;
  const goalPct = goalCents > 0 ? Math.round((raisedCents / goalCents) * 100) : null;

  return (
    <div className="min-h-screen pb-20">
      {isPreview && (
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-ink px-4 py-2 text-center text-sm font-semibold text-white">
          <span className="flex items-center gap-1.5">
            <Eye className="h-4 w-4" /> Preview — only you can see this. Your page
            isn't published yet.
          </span>
          <a href="/dashboard/page" className="underline underline-offset-2">
            Publish it →
          </a>
        </div>
      )}

      {/* Sticky top bar: avatar + name + actions */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-cream/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <Avatar src={profile.avatarUrl} name={profile.displayName} size="sm" />
            <span className="truncate font-display text-lg font-extrabold text-ink">
              {profile.displayName}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ShareButton />
            <a
              href="#support"
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-full px-5 text-sm font-bold transition-all active:scale-95",
                theme.btn,
              )}
            >
              <Heart className="h-4 w-4" /> Support
            </a>
          </div>
        </div>
      </header>

      {/* Cover */}
      <div
        className={cn(
          "h-44 w-full overflow-hidden bg-linear-to-br sm:h-60",
          theme.coverFrom,
        )}
      >
        {profile.coverUrl && (
          <img src={profile.coverUrl} alt="" className="h-full w-full object-cover" />
        )}
      </div>

      <div className="mx-auto max-w-5xl px-4">
        {/* Identity — relative+z so the avatar sits above the cover */}
        <div className="relative z-10 -mt-12 mb-8 flex items-end gap-4 sm:-mt-14">
          <Avatar
            src={profile.avatarUrl}
            name={profile.displayName}
            size="xl"
            className="ring-4 ring-cream"
          />
          <div className="pb-1">
            <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">
              {profile.displayName}
            </h1>
            <p className="flex items-center gap-1.5 text-sm font-medium text-muted">
              <Heart className={cn("h-4 w-4", theme.text)} />
              {profile.supporterCount}{" "}
              {profile.supporterCount === 1 ? "supporter" : "supporters"}
            </p>
          </div>
        </div>

        {/* Two columns — left: about/links/feed · right: support + shop */}
        <div className="grid gap-6 lg:grid-cols-[1fr_23rem]">
          {/* LEFT */}
          <div className="space-y-6">
            {/* URL + goal card (Ko-fi style) */}
            <Card className="p-6">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate font-display text-lg font-extrabold text-ink">
                  bayluv.com/{profile.username}
                </p>
                <ShareButton compact />
              </div>
              {profile.tagline && (
                <p className="mt-1 text-ink-soft">{profile.tagline}</p>
              )}
              {goalPct !== null && (
                <div className="mt-4">
                  <Progress value={goalPct} />
                  <p className="mt-2 text-sm">
                    <span className="font-bold text-ink">{goalPct}%</span>{" "}
                    <span className="text-muted">of goal</span>
                    {profile.goalLabel && (
                      <span className="text-ink-soft"> · {profile.goalLabel}</span>
                    )}
                  </p>
                </div>
              )}
            </Card>

            {/* About */}
            <Card className="p-6">
              <h2 className="text-lg font-bold text-ink">About</h2>
              {profile.bio ? (
                <p className="mt-2 whitespace-pre-line leading-relaxed text-ink-soft">
                  {profile.bio}
                </p>
              ) : (
                <p className="mt-2 text-muted">No bio yet.</p>
              )}
              {profile.socialLinks.length > 0 && (
                <div className="mt-4">
                  <SocialRow links={profile.socialLinks} />
                </div>
              )}
              {tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-ink/5 px-3 py-1 text-xs font-semibold text-ink-soft"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </Card>

            {/* Links */}
            {profile.links.length > 0 && (
              <div className="space-y-3">
                {profile.links.map((l) =>
                  l.type === "header" ? (
                    <h3
                      key={l.id}
                      className="px-1 pt-2 text-sm font-bold uppercase tracking-wide text-muted"
                    >
                      {l.title}
                    </h3>
                  ) : (
                    <a
                      key={l.id}
                      href={`/l/${l.id}`}
                      className="group flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card"
                    >
                      {l.thumbnailUrl ? (
                        <img
                          src={l.thumbnailUrl}
                          alt=""
                          className="h-12 w-12 shrink-0 rounded-xl object-cover"
                        />
                      ) : (
                        <span
                          className={cn(
                            "grid h-12 w-12 shrink-0 place-items-center rounded-xl",
                            theme.soft,
                          )}
                        >
                          <ExternalLink className="h-5 w-5" />
                        </span>
                      )}
                      <span className="flex-1 font-semibold text-ink">
                        {l.title}
                      </span>
                      <ExternalLink className="h-4 w-4 text-muted transition-colors group-hover:text-ink" />
                    </a>
                  ),
                )}
              </div>
            )}

            {/* Feed */}
            {supporters.length > 0 && (
              <Card className="p-6">
                <h2 className="mb-4 text-lg font-bold text-ink">Feed</h2>
                <ul className="space-y-4">
                  {supporters.map((s) => (
                    <li key={s.id} className="flex gap-3">
                      <Avatar name={s.name ?? "Someone"} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm text-ink">
                          <span className="font-bold">{s.name ?? "Someone"}</span>{" "}
                          {s.isMonthly ? (
                            "is a monthly supporter 💜"
                          ) : (
                            <>
                              tipped{" "}
                              <span className="font-semibold">
                                {formatMoney(s.amountCents)}
                              </span>
                            </>
                          )}
                        </p>
                        {s.message && (
                          <p className="mt-1 rounded-xl bg-ink/5 px-3 py-2 text-sm text-ink-soft">
                            {s.message}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>

          {/* RIGHT */}
          <div
            id="support"
            className="space-y-6 scroll-mt-24 lg:sticky lg:top-20 lg:self-start"
          >
            {/* Support card with One-time / Membership toggle */}
            <Card className="p-6">
              {tiers.length > 0 ? (
                <Tabs defaultValue="onetime">
                  <TabsList className="w-full">
                    <TabsTrigger value="onetime" className="flex-1">
                      One-time
                    </TabsTrigger>
                    <TabsTrigger value="membership" className="flex-1">
                      Membership
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="onetime" className="pt-5">
                    <SupportWidget
                      creatorName={profile.displayName}
                      themeColor={profile.themeColor}
                      pending={checkingOut}
                      onSupport={tip}
                    />
                  </TabsContent>
                  <TabsContent value="membership" className="space-y-4 pt-5">
                    {tiers.map((t) => (
                      <TierCard
                        key={t.id}
                        tier={t}
                        pending={checkingOut}
                        onJoin={joinTier}
                      />
                    ))}
                  </TabsContent>
                </Tabs>
              ) : (
                <SupportWidget
                  creatorName={profile.displayName}
                  themeColor={profile.themeColor}
                  pending={checkingOut}
                  onSupport={tip}
                />
              )}
            </Card>

            {/* Shop */}
            {products.length > 0 && (
              <Card className="p-6">
                <h2 className="mb-4 text-lg font-bold text-ink">Shop</h2>
                <div className="space-y-3">
                  {products.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      themeColor={profile.themeColor}
                      pending={checkingOut}
                      onBuy={buyProduct}
                    />
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Footer CTA — grow bayluv, our own voice */}
        <footer className="mt-16 text-center">
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-ink-soft shadow-soft transition-all hover:-translate-y-0.5 hover:text-ink"
          >
            Want a page like this? Make your own on <Logo className="text-base" />
          </a>
        </footer>
      </div>
    </div>
  );
}

function ShareButton({ compact = false }: { compact?: boolean }) {
  const { toast } = useToast();
  const share = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url);
      toast({ tone: "success", title: "Link copied!" });
    }
  };
  if (compact) {
    return (
      <button
        onClick={share}
        aria-label="Share"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink"
      >
        <Share2 className="h-4 w-4" />
      </button>
    );
  }
  return (
    <Button variant="soft" size="sm" onClick={share}>
      <Share2 className="h-4 w-4" /> Share
    </Button>
  );
}

export function ErrorBoundary() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-display text-7xl font-extrabold text-primary">404</p>
      <p className="text-lg text-ink-soft">
        This page doesn't exist — or hasn't been published yet.
      </p>
      <a
        href="/"
        className="inline-flex h-11 items-center rounded-full bg-primary px-6 font-semibold text-primary-foreground shadow-soft hover:bg-primary-600"
      >
        Go home
      </a>
    </main>
  );
}
