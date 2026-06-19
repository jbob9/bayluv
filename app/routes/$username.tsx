import { useEffect } from "react";
import { useFetcher, useSearchParams } from "react-router";
import { desc, eq, and } from "drizzle-orm";
import { Share2, ExternalLink, Heart, Coffee } from "lucide-react";
import type { Route } from "./+types/$username";
import { getPublicProfile } from "~/lib/profile.server";
import { db } from "~/db/index.server";
import { support } from "~/db/schemas/payments";
import { tier as tierTable } from "~/db/schemas/membership";
import { product as productTable } from "~/db/schemas/shop";
import { asc } from "drizzle-orm";
import { getTheme } from "~/lib/theme";
import { cn } from "~/lib/utils";
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

export async function loader({ params }: Route.LoaderArgs) {
  const profile = await getPublicProfile(params.username);
  if (!profile) throw new Response("Not found", { status: 404 });

  const supporters = await db.query.support.findMany({
    where: and(
      eq(support.profileId, profile.id),
      eq(support.status, "paid"),
      eq(support.isPublic, true),
    ),
    orderBy: desc(support.createdAt),
    limit: 8,
  });

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
      joinable: Boolean(t.stripePriceId),
    })),
    supporters: supporters.map((s) => ({
      id: s.id,
      name: s.supporterName,
      quantity: s.quantity,
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
  const { profile, supporters, tiers, products } = loaderData;
  const theme = getTheme(profile.themeColor);
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const fetcher = useFetcher<CheckoutFetcher>();
  const checkingOut = fetcher.state !== "idle";

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

  const goalPct =
    profile.goalAmountCents && profile.goalAmountCents > 0
      ? Math.round(((profile.supporterCount * 500) / profile.goalAmountCents) * 100)
      : null;

  return (
    <div className="min-h-screen pb-20">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-cream/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <span className="font-display text-lg font-extrabold text-ink">
            {profile.displayName}
          </span>
          <ShareButton />
        </div>
      </header>

      {/* Cover */}
      <div
        className={cn(
          "relative h-52 w-full bg-linear-to-br sm:h-64",
          theme.coverFrom,
        )}
      >
        {profile.coverUrl && (
          <img
            src={profile.coverUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <div className="mx-auto max-w-5xl px-4">
        {/* Identity */}
        <div className="-mt-12 flex flex-col items-start gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
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
                <Heart className="h-4 w-4 text-primary" />
                {profile.supporterCount} supporters
              </p>
            </div>
          </div>
        </div>

        {/* Two columns */}
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_24rem]">
          {/* Left: about + links + membership */}
          <div className="space-y-6">
            {profile.tagline && (
              <p className="text-lg font-medium text-ink-soft">
                {profile.tagline}
              </p>
            )}

            <Tabs defaultValue="about" className="space-y-4">
              {(tiers.length > 0 || products.length > 0) && (
                <TabsList>
                  <TabsTrigger value="about">About</TabsTrigger>
                  {tiers.length > 0 && (
                    <TabsTrigger value="membership">Membership</TabsTrigger>
                  )}
                  {products.length > 0 && (
                    <TabsTrigger value="shop">Shop</TabsTrigger>
                  )}
                </TabsList>
              )}

              <TabsContent value="about" className="space-y-6">
                <Card className="p-6">
                  <h2 className="text-lg font-bold text-ink">About</h2>
                  {profile.bio ? (
                    <p className="mt-2 whitespace-pre-line leading-relaxed text-ink-soft">
                      {profile.bio}
                    </p>
                  ) : (
                    <p className="mt-2 text-muted">No bio yet.</p>
                  )}
                  <div className="mt-4">
                    <SocialRow links={profile.socialLinks} />
                  </div>
                </Card>

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
                            <span className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-xl", theme.soft)}>
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
              </TabsContent>

              {tiers.length > 0 && (
                <TabsContent value="membership" className="space-y-4">
                  {tiers.map((t) => (
                    <TierCard
                      key={t.id}
                      tier={t}
                      pending={checkingOut}
                      onJoin={joinTier}
                    />
                  ))}
                </TabsContent>
              )}

              {products.length > 0 && (
                <TabsContent value="shop" className="space-y-3">
                  {products.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      themeColor={profile.themeColor}
                      pending={checkingOut}
                      onBuy={buyProduct}
                    />
                  ))}
                </TabsContent>
              )}
            </Tabs>
          </div>

          {/* Right: support widget + goal */}
          <div className="space-y-6 lg:sticky lg:top-20 lg:self-start">
            {goalPct !== null && (
              <Card className="p-5">
                <Progress value={goalPct} />
                <p className="mt-2 text-sm font-bold text-ink">
                  {goalPct}% of goal
                </p>
                {profile.goalLabel && (
                  <p className="text-sm text-ink-soft">{profile.goalLabel}</p>
                )}
              </Card>
            )}

            <Card className="p-6">
              <SupportWidget
                creatorName={profile.displayName}
                themeColor={profile.themeColor}
                pending={checkingOut}
                onSupport={(p) =>
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
                  )
                }
              />
            </Card>

            {supporters.length > 0 && (
              <Card className="p-6">
                <h2 className="mb-4 text-lg font-bold text-ink">
                  Recent supporters
                </h2>
                <ul className="space-y-4">
                  {supporters.map((s) => (
                    <li key={s.id} className="flex gap-3">
                      <Avatar name={s.name ?? "Someone"} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm text-ink">
                          <span className="font-bold">
                            {s.name ?? "Someone"}
                          </span>{" "}
                          {s.isMonthly ? "is a monthly supporter" : "bought"}{" "}
                          {!s.isMonthly && (
                            <span className="font-semibold">
                              {s.quantity} {s.quantity === 1 ? "coffee" : "coffees"}
                            </span>
                          )}
                          .
                        </p>
                        {s.message && (
                          <p className="mt-1 rounded-xl bg-primary-50 px-3 py-2 text-sm text-ink-soft">
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
        </div>

        <footer className="mt-16 flex items-center justify-center gap-2 text-sm text-muted">
          <Coffee className="h-4 w-4" /> Powered by <Logo className="text-base" />
        </footer>
      </div>
    </div>
  );
}

function ShareButton() {
  const { toast } = useToast();
  return (
    <Button
      variant="soft"
      size="sm"
      onClick={() => {
        const url = window.location.href;
        if (navigator.share) {
          navigator.share({ url }).catch(() => {});
        } else {
          navigator.clipboard?.writeText(url);
          toast({ tone: "success", title: "Link copied!" });
        }
      }}
    >
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
