import { Form, useNavigation } from "react-router";
import { and, asc, eq } from "drizzle-orm";
import {
  Trash2,
  ShoppingBag,
  Plus,
  FileDown,
  Video,
  Brush,
  Package,
  Tag,
  Check,
  MousePointerClick,
} from "lucide-react";
import type { Route } from "./+types/products";
import { requireProfile } from "~/lib/session.server";
import { db } from "~/db/index.server";
import { product as productTable } from "~/db/schemas/shop";
import {
  affiliateProduct,
  creatorAffiliateProduct,
  creatorAffiliateAccount,
} from "~/db/schemas/affiliate";
import { networkLabel } from "~/lib/affiliate";
import { formatMoney } from "~/lib/utils";
import { useActionToast } from "~/lib/use-action-toast";
import { PageHeader } from "~/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Field } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";

export function meta() {
  return [{ title: "Shop · bayluv" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const { profile } = await requireProfile(request);
  const [own, catalog, selections, accounts] = await Promise.all([
    db.query.product.findMany({
      where: eq(productTable.profileId, profile.id),
      orderBy: asc(productTable.sortOrder),
    }),
    db.query.affiliateProduct.findMany({
      where: eq(affiliateProduct.isActive, true),
    }),
    db.query.creatorAffiliateProduct.findMany({
      where: eq(creatorAffiliateProduct.profileId, profile.id),
    }),
    db.query.creatorAffiliateAccount.findMany({
      where: eq(creatorAffiliateAccount.profileId, profile.id),
    }),
  ]);

  const selById = new Map(selections.map((s) => [s.affiliateProductId, s]));
  const tagByNetwork = new Map(accounts.map((a) => [a.network, a.tag]));
  const networks = [...new Set(catalog.map((c) => c.network))];

  return {
    digital: own.filter((p) => p.kind === "digital"),
    physical: own.filter((p) => p.kind === "physical"),
    catalog: catalog.map((c) => ({
      id: c.id,
      title: c.title,
      imageUrl: c.imageUrl,
      priceCents: c.priceCents,
      network: c.network,
      category: c.category,
      selected: selById.has(c.id),
      clicks: selById.get(c.id)?.clicks ?? 0,
    })),
    networks: networks.map((n) => ({
      network: n,
      label: networkLabel(n),
      tag: tagByNetwork.get(n) ?? "",
    })),
  };
}

export async function action({ request }: Route.ActionArgs) {
  const { profile } = await requireProfile(request);
  const form = await request.formData();
  const intent = String(form.get("intent"));
  const owns = (id: string) =>
    db.query.product.findFirst({
      where: and(eq(productTable.id, id), eq(productTable.profileId, profile.id)),
    });
  const str = (k: string) => {
    const v = form.get(k);
    return v == null || v === "" ? null : String(v).trim();
  };

  if (intent === "addProduct" || intent === "updateProduct") {
    const kind = str("kind") === "physical" ? "physical" : "digital";
    const values = {
      name: str("name") ?? "New product",
      kind: kind as "digital" | "physical",
      type:
        kind === "digital"
          ? ((str("type") as "digital" | "call" | "commission") ?? "digital")
          : ("digital" as const),
      priceCents: Math.max(100, Math.round(Number(form.get("price")) * 100) || 100),
      description: str("description"),
      imageUrl: str("imageUrl"),
      fileUrl: kind === "digital" ? str("fileUrl") : null,
      externalUrl: kind === "digital" ? str("externalUrl") : null,
    };
    if (intent === "addProduct") {
      const existing = await db.query.product.findMany({
        where: eq(productTable.profileId, profile.id),
        columns: { sortOrder: true },
      });
      const sortOrder = existing.reduce((m, p) => Math.max(m, p.sortOrder), -1) + 1;
      await db.insert(productTable).values({ profileId: profile.id, sortOrder, ...values });
      return { ok: "Product added" };
    }
    const id = String(form.get("id"));
    if (!(await owns(id))) return { error: "Not found" };
    await db.update(productTable).set(values).where(eq(productTable.id, id));
    return { ok: "Saved" };
  }

  if (intent === "toggleProduct") {
    const id = String(form.get("id"));
    const p = await owns(id);
    if (!p) return { error: "Not found" };
    await db
      .update(productTable)
      .set({ isActive: !p.isActive })
      .where(eq(productTable.id, id));
    return { ok: "Updated" };
  }

  if (intent === "deleteProduct") {
    const id = String(form.get("id"));
    if (!(await owns(id))) return { error: "Not found" };
    await db.delete(productTable).where(eq(productTable.id, id));
    return { ok: "Deleted" };
  }

  // --- Affiliate ---
  if (intent === "toggleAffiliate") {
    const affId = String(form.get("affiliateProductId"));
    const existing = await db.query.creatorAffiliateProduct.findFirst({
      where: and(
        eq(creatorAffiliateProduct.profileId, profile.id),
        eq(creatorAffiliateProduct.affiliateProductId, affId),
      ),
    });
    if (existing) {
      await db
        .delete(creatorAffiliateProduct)
        .where(eq(creatorAffiliateProduct.id, existing.id));
      return { ok: "Removed from your page" };
    }
    const count = await db.query.creatorAffiliateProduct.findMany({
      where: eq(creatorAffiliateProduct.profileId, profile.id),
      columns: { sortOrder: true },
    });
    const sortOrder = count.reduce((m, s) => Math.max(m, s.sortOrder), -1) + 1;
    await db.insert(creatorAffiliateProduct).values({
      profileId: profile.id,
      affiliateProductId: affId,
      sortOrder,
    });
    return { ok: "Added to your page" };
  }

  if (intent === "saveAffiliateTag") {
    const network = str("network");
    const tag = str("tag");
    if (!network) return { error: "Missing network" };
    const existing = await db.query.creatorAffiliateAccount.findFirst({
      where: and(
        eq(creatorAffiliateAccount.profileId, profile.id),
        eq(creatorAffiliateAccount.network, network),
      ),
    });
    if (!tag) {
      if (existing)
        await db
          .delete(creatorAffiliateAccount)
          .where(eq(creatorAffiliateAccount.id, existing.id));
      return { ok: "Tag cleared" };
    }
    if (existing) {
      await db
        .update(creatorAffiliateAccount)
        .set({ tag })
        .where(eq(creatorAffiliateAccount.id, existing.id));
    } else {
      await db
        .insert(creatorAffiliateAccount)
        .values({ profileId: profile.id, network, tag });
    }
    return { ok: `${networkLabel(network)} tag saved` };
  }

  return { error: "Unknown action" };
}

const typeMeta = {
  digital: { icon: FileDown, label: "Digital" },
  call: { icon: Video, label: "1-1 Call" },
  commission: { icon: Brush, label: "Commission" },
} as const;

export default function Products({ loaderData, actionData }: Route.ComponentProps) {
  const { digital, physical, catalog, networks } = loaderData;
  const nav = useNavigation();
  const busy = nav.state !== "idle";
  useActionToast(actionData);

  return (
    <>
      <PageHeader title="Shop" subtitle="Sell digital, physical, and affiliate products." />

      <Tabs defaultValue="digital">
        <TabsList>
          <TabsTrigger value="digital">Digital</TabsTrigger>
          <TabsTrigger value="physical">Physical</TabsTrigger>
          <TabsTrigger value="affiliate">Affiliate</TabsTrigger>
        </TabsList>

        {/* DIGITAL */}
        <TabsContent value="digital" className="pt-6">
          <OwnProducts kind="digital" products={digital} busy={busy} />
        </TabsContent>

        {/* PHYSICAL */}
        <TabsContent value="physical" className="pt-6">
          <div className="mb-4 rounded-2xl bg-sky-soft px-4 py-3 text-sm font-medium text-sky">
            Physical products collect the buyer's shipping address at checkout — you fulfill &amp; ship.
          </div>
          <OwnProducts kind="physical" products={physical} busy={busy} />
        </TabsContent>

        {/* AFFILIATE */}
        <TabsContent value="affiliate" className="space-y-6 pt-6">
          {/* Tag settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" /> Your affiliate tags
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted">
                Add your own affiliate tag per network so you earn the commission on featured products.
              </p>
              {networks.length === 0 ? (
                <p className="text-sm text-muted">No catalog networks yet.</p>
              ) : (
                networks.map((n) => (
                  <Form key={n.network} method="post" className="flex items-end gap-2">
                    <input type="hidden" name="intent" value="saveAffiliateTag" />
                    <input type="hidden" name="network" value={n.network} />
                    <Field label={n.label} className="flex-1">
                      <Input name="tag" defaultValue={n.tag} placeholder="your-tag-20" />
                    </Field>
                    <Button type="submit" variant="soft" disabled={busy}>
                      Save
                    </Button>
                  </Form>
                ))
              )}
            </CardContent>
          </Card>

          {/* Catalog */}
          <div>
            <h2 className="mb-3 text-lg font-bold text-ink">Browse catalog</h2>
            {catalog.length === 0 ? (
              <Card className="border-2 border-dashed border-border bg-paper">
                <CardContent className="p-10 text-center text-ink-soft">
                  <ShoppingBag className="mx-auto mb-3 h-8 w-8 text-muted" />
                  No affiliate products available yet.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {catalog.map((c) => (
                  <Card key={c.id}>
                    <CardContent className="flex gap-4 p-4">
                      <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-ink/5">
                        {c.imageUrl ? (
                          <img
                            src={c.imageUrl}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Package className="h-7 w-7 text-muted" />
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <p className="truncate font-bold text-ink">{c.title}</p>
                        <p className="text-sm text-muted">
                          {networkLabel(c.network)}
                          {c.priceCents != null && ` · ${formatMoney(c.priceCents)}`}
                        </p>
                        {c.selected && (
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                            <MousePointerClick className="h-3 w-3" /> {c.clicks} clicks
                          </p>
                        )}
                        <div className="mt-auto pt-2">
                          <Form method="post">
                            <input type="hidden" name="intent" value="toggleAffiliate" />
                            <input type="hidden" name="affiliateProductId" value={c.id} />
                            <Button
                              type="submit"
                              size="sm"
                              variant={c.selected ? "outline" : "primary"}
                              disabled={busy}
                            >
                              {c.selected ? (
                                <>
                                  <Check className="h-4 w-4" /> Featured
                                </>
                              ) : (
                                <>
                                  <Plus className="h-4 w-4" /> Feature
                                </>
                              )}
                            </Button>
                          </Form>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}

function OwnProducts({
  kind,
  products,
  busy,
}: {
  kind: "digital" | "physical";
  products: Route.ComponentProps["loaderData"]["digital"];
  busy: boolean;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {products.map((p) => {
        const Icon = kind === "physical" ? Package : typeMeta[p.type].icon;
        return (
          <Card key={p.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-primary" /> {p.name}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge tone="neutral">{p.salesCount} sold</Badge>
                {p.isActive ? (
                  <Badge tone="success">Live</Badge>
                ) : (
                  <Badge tone="neutral">Hidden</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <ProductForm product={p} kind={kind} busy={busy} />
              <div className="flex items-center gap-2 border-t border-border pt-3">
                <Form method="post">
                  <input type="hidden" name="intent" value="toggleProduct" />
                  <input type="hidden" name="id" value={p.id} />
                  <Button type="submit" variant="outline" size="sm" disabled={busy}>
                    {p.isActive ? "Hide" : "Show"}
                  </Button>
                </Form>
                <Form method="post">
                  <input type="hidden" name="intent" value="deleteProduct" />
                  <input type="hidden" name="id" value={p.id} />
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
        );
      })}

      <Card className="border-2 border-dashed border-border bg-paper">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" /> Add {kind} product
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm kind={kind} busy={busy} />
        </CardContent>
      </Card>
    </div>
  );
}

function ProductForm({
  product,
  kind,
  busy,
}: {
  product?: Route.ComponentProps["loaderData"]["digital"][number];
  kind: "digital" | "physical";
  busy: boolean;
}) {
  const isEdit = Boolean(product);
  return (
    <Form method="post" className="space-y-4">
      <input type="hidden" name="intent" value={isEdit ? "updateProduct" : "addProduct"} />
      <input type="hidden" name="kind" value={kind} />
      {isEdit && <input type="hidden" name="id" value={product!.id} />}

      <Field label="Name">
        <Input name="name" defaultValue={product?.name ?? ""} required />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        {kind === "digital" ? (
          <Field label="Type">
            <select
              name="type"
              defaultValue={product?.type ?? "digital"}
              className="h-12 w-full rounded-xl border-2 border-border bg-surface px-3 text-[15px] text-ink outline-none focus:border-primary"
            >
              <option value="digital">Digital download</option>
              <option value="call">1-1 Call</option>
              <option value="commission">Commission</option>
            </select>
          </Field>
        ) : (
          <Field label="Kind">
            <Input value="Physical" disabled />
          </Field>
        )}
        <Field label="Price">
          <Input
            name="price"
            type="number"
            min={1}
            step="0.01"
            defaultValue={product ? product.priceCents / 100 : ""}
            placeholder="20"
            required
          />
        </Field>
      </div>
      <Field label="Description">
        <Textarea
          name="description"
          defaultValue={product?.description ?? ""}
          className="min-h-20"
        />
      </Field>
      <Field label="Image URL">
        <Input name="imageUrl" defaultValue={product?.imageUrl ?? ""} placeholder="https://…" />
      </Field>
      {kind === "digital" && (
        <>
          <Field label="Download file URL" hint="Delivered after purchase">
            <Input name="fileUrl" defaultValue={product?.fileUrl ?? ""} placeholder="https://…" />
          </Field>
          <Field label="Booking / access link" hint="Shown after purchase (calls & commissions)">
            <Input
              name="externalUrl"
              defaultValue={product?.externalUrl ?? ""}
              placeholder="https://calendly.com/…"
            />
          </Field>
        </>
      )}
      <Button type="submit" disabled={busy}>
        {isEdit ? "Save product" : (
          <>
            <Plus className="h-4 w-4" /> Create product
          </>
        )}
      </Button>
    </Form>
  );
}
