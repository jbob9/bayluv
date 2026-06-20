import { Form, useNavigation } from "react-router";
import { and, asc, eq } from "drizzle-orm";
import { Plus, Trash2, Crown, Check } from "lucide-react";
import type { Route } from "./+types/tiers";
import { requireProfile } from "~/lib/session.server";
import { db } from "~/db/index.server";
import { tier as tierTable } from "~/db/schemas/membership";
import { hasStripe, createTierPrice } from "~/lib/stripe.server";
import { useActionToast } from "~/lib/use-action-toast";
import { THEME_COLORS } from "~/lib/theme";
import { formatMoney } from "~/lib/utils";
import { PageHeader } from "~/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Field } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";

export function meta() {
  return [{ title: "Memberships · bayluv" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const { profile } = await requireProfile(request);
  const tiers = await db.query.tier.findMany({
    where: eq(tierTable.profileId, profile.id),
    orderBy: asc(tierTable.sortOrder),
  });
  return { tiers, stripeReady: hasStripe };
}

function parseBenefits(raw: string): string[] {
  return raw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12);
}

export async function action({ request }: Route.ActionArgs) {
  const { profile } = await requireProfile(request);
  const form = await request.formData();
  const intent = String(form.get("intent"));
  const owns = (id: string) =>
    db.query.tier.findFirst({
      where: and(eq(tierTable.id, id), eq(tierTable.profileId, profile.id)),
    });

  if (intent === "addTier" || intent === "updateTier") {
    const name = String(form.get("name") ?? "").trim() || "New tier";
    const priceCents = Math.max(
      100,
      Math.round(Number(form.get("price")) * 100) || 100,
    );
    const interval = (String(form.get("interval")) === "year"
      ? "year"
      : "month") as "month" | "year";
    const description = String(form.get("description") ?? "").trim() || null;
    const benefits = parseBenefits(String(form.get("benefits") ?? ""));
    const accentColor = String(form.get("accentColor") ?? "primary");
    const yearlyRaw = Number(form.get("yearlyPrice"));
    const yearlyPriceCents =
      yearlyRaw > 0 ? Math.round(yearlyRaw * 100) : null;

    if (intent === "addTier") {
      let productId: string | undefined;
      let priceId: string | undefined;
      let yearlyPriceId: string | undefined;
      if (hasStripe) {
        const base = await createTierPrice({
          name,
          description,
          amountCents: priceCents,
          interval,
        });
        productId = base.productId;
        priceId = base.priceId;
        if (yearlyPriceCents) {
          const yr = await createTierPrice({
            name,
            description,
            amountCents: yearlyPriceCents,
            interval: "year",
            existingProductId: productId,
          });
          yearlyPriceId = yr.priceId;
        }
      }
      const count = await db.query.tier.findMany({
        where: eq(tierTable.profileId, profile.id),
        columns: { sortOrder: true },
      });
      const sortOrder = count.reduce((m, t) => Math.max(m, t.sortOrder), -1) + 1;
      await db.insert(tierTable).values({
        profileId: profile.id,
        name,
        description,
        priceCents,
        interval,
        yearlyPriceCents,
        benefits,
        accentColor,
        sortOrder,
        stripeProductId: productId,
        stripePriceId: priceId,
        stripeYearlyPriceId: yearlyPriceId,
      });
      return { ok: "Tier created" };
    }

    // updateTier
    const id = String(form.get("id"));
    const existing = await owns(id);
    if (!existing) return { error: "Not found" };

    const priceChanged =
      existing.priceCents !== priceCents || existing.interval !== interval;
    const yearlyChanged = existing.yearlyPriceCents !== yearlyPriceCents;
    let priceId = existing.stripePriceId;
    let productId = existing.stripeProductId;
    let yearlyPriceId = existing.stripeYearlyPriceId;
    if (hasStripe && (priceChanged || !priceId)) {
      const ids = await createTierPrice({
        name,
        description,
        amountCents: priceCents,
        interval,
        existingProductId: existing.stripeProductId,
      });
      productId = ids.productId;
      priceId = ids.priceId;
    }
    if (hasStripe && yearlyChanged) {
      if (yearlyPriceCents) {
        const yr = await createTierPrice({
          name,
          description,
          amountCents: yearlyPriceCents,
          interval: "year",
          existingProductId: productId,
        });
        yearlyPriceId = yr.priceId;
      } else {
        yearlyPriceId = null;
      }
    }

    await db
      .update(tierTable)
      .set({
        name,
        description,
        priceCents,
        interval,
        yearlyPriceCents,
        benefits,
        accentColor,
        stripeProductId: productId,
        stripePriceId: priceId,
        stripeYearlyPriceId: yearlyPriceId,
      })
      .where(eq(tierTable.id, id));
    return { ok: "Tier saved" };
  }

  if (intent === "toggleTier") {
    const id = String(form.get("id"));
    const t = await owns(id);
    if (!t) return { error: "Not found" };
    await db
      .update(tierTable)
      .set({ isActive: !t.isActive })
      .where(eq(tierTable.id, id));
    return { ok: "Updated" };
  }

  if (intent === "deleteTier") {
    const id = String(form.get("id"));
    if (!(await owns(id))) return { error: "Not found" };
    await db.delete(tierTable).where(eq(tierTable.id, id));
    return { ok: "Deleted" };
  }

  return { error: "Unknown action" };
}

export default function Tiers({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { tiers, stripeReady } = loaderData;
  const nav = useNavigation();
  const busy = nav.state !== "idle";
  useActionToast(actionData);

  return (
    <>
      <PageHeader
        title="Memberships"
        subtitle="Offer recurring tiers to your biggest fans."
      />

      {!stripeReady && (
        <div className="mb-6 rounded-2xl bg-sunny-soft px-4 py-3 text-sm font-medium text-[#946100]">
          Connect Stripe on the Payouts page to let fans actually subscribe. You
          can still set tiers up now.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {tiers.map((t) => (
          <Card key={t.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-sunny" /> {t.name}
              </CardTitle>
              <div className="flex items-center gap-2">
                {t.isActive ? (
                  <Badge tone="success">Live</Badge>
                ) : (
                  <Badge tone="neutral">Hidden</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <TierForm tier={t} busy={busy} />
              {/* Separate sibling forms (not nested) for toggle + delete */}
              <div className="flex items-center gap-2 border-t border-border pt-3">
                <Form method="post">
                  <input type="hidden" name="intent" value="toggleTier" />
                  <input type="hidden" name="id" value={t.id} />
                  <Button type="submit" variant="outline" size="sm" disabled={busy}>
                    {t.isActive ? "Hide" : "Show"}
                  </Button>
                </Form>
                <Form method="post">
                  <input type="hidden" name="intent" value="deleteTier" />
                  <input type="hidden" name="id" value={t.id} />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    disabled={busy}
                    className="text-muted hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </Button>
                </Form>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* New tier */}
        <Card className="border-2 border-dashed border-border bg-paper">
          <CardHeader>
            <CardTitle>Add a tier</CardTitle>
          </CardHeader>
          <CardContent>
            <TierForm busy={busy} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function TierForm({
  tier,
  busy,
}: {
  tier?: Route.ComponentProps["loaderData"]["tiers"][number];
  busy: boolean;
}) {
  const isEdit = Boolean(tier);
  return (
    <Form method="post" className="space-y-4">
      <input type="hidden" name="intent" value={isEdit ? "updateTier" : "addTier"} />
      {isEdit && <input type="hidden" name="id" value={tier!.id} />}

      <Field label="Tier name">
        <Input name="name" defaultValue={tier?.name ?? ""} placeholder="Super Fan" required />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Price">
          <Input
            name="price"
            type="number"
            min={1}
            step="0.01"
            defaultValue={tier ? tier.priceCents / 100 : ""}
            placeholder="6"
            required
          />
        </Field>
        <Field label="Billing">
          <select
            name="interval"
            defaultValue={tier?.interval ?? "month"}
            className="h-12 w-full rounded-xl border-2 border-border bg-surface px-3 text-[15px] text-ink outline-none focus:border-primary"
          >
            <option value="month">Monthly</option>
            <option value="year">Yearly</option>
          </select>
        </Field>
      </div>
      <Field
        label="Annual option ($/year)"
        hint="Optional — let members pay yearly at a discount"
      >
        <Input
          name="yearlyPrice"
          type="number"
          min={1}
          step="0.01"
          defaultValue={tier?.yearlyPriceCents ? tier.yearlyPriceCents / 100 : ""}
          placeholder="e.g. 60"
        />
      </Field>
      <Field label="Description">
        <Textarea
          name="description"
          defaultValue={tier?.description ?? ""}
          placeholder="What this tier is about…"
          className="min-h-20"
        />
      </Field>
      <Field label="Benefits" hint="One per line">
        <Textarea
          name="benefits"
          defaultValue={(tier?.benefits ?? []).join("\n")}
          placeholder={"Access to discord\nMonthly shoutout\nEarly content"}
          className="min-h-20"
        />
      </Field>
      <Field label="Accent">
        <div className="flex flex-wrap gap-2">
          {THEME_COLORS.map((c) => (
            <label key={c.id} className="cursor-pointer">
              <input
                type="radio"
                name="accentColor"
                value={c.id}
                defaultChecked={(tier?.accentColor ?? "primary") === c.id}
                className="peer sr-only"
              />
              <span
                className="grid h-8 w-8 place-items-center rounded-full ring-2 ring-transparent peer-checked:ring-ink"
                style={{ background: c.swatch }}
              >
                <Check className="hidden h-4 w-4 text-white peer-checked:block" />
              </span>
            </label>
          ))}
        </div>
      </Field>

      <Button type="submit" disabled={busy}>
        {isEdit ? "Save tier" : (
          <>
            <Plus className="h-4 w-4" /> Create tier
          </>
        )}
      </Button>
    </Form>
  );
}
