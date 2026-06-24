import { Form } from "react-router";
import { desc, eq } from "drizzle-orm";
import { PackageSearch, Trash2, Plus, Download, Pencil } from "lucide-react";
import type { Route } from "./+types/affiliate-products";
import { requireAdmin } from "~/lib/session.server";
import { db } from "~/db/index.server";
import { affiliateProduct } from "~/db/schemas/affiliate";
import { NETWORK_KEYS, networkLabel } from "~/lib/affiliate";
import { getSource } from "~/lib/affiliate-sources.server";
import { formatMoney } from "~/lib/utils";
import { useActionToast } from "~/lib/use-action-toast";
import { PageHeader } from "~/components/dashboard/page-header";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { FormDialog } from "~/components/ui/form-dialog";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Field } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";

export function meta() {
  return [{ title: "Affiliate catalog · bayluv" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  const products = await db.query.affiliateProduct.findMany({
    orderBy: desc(affiliateProduct.createdAt),
  });
  return { products };
}

export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);
  const form = await request.formData();
  const intent = String(form.get("intent"));
  const str = (k: string) => {
    const v = form.get(k);
    return v == null || v === "" ? null : String(v).trim();
  };

  if (intent === "add" || intent === "update") {
    const values = {
      title: str("title") ?? "Untitled",
      description: str("description"),
      imageUrl: str("imageUrl"),
      priceCents: Number(form.get("price"))
        ? Math.round(Number(form.get("price")) * 100)
        : null,
      category: str("category"),
      network: str("network") ?? "amazon",
      productUrl: str("productUrl") ?? "",
      externalId: str("externalId"),
    };
    if (!values.productUrl) return { error: "Product URL is required." };
    if (intent === "add") {
      await db.insert(affiliateProduct).values(values);
      return { ok: "Product added to catalog" };
    }
    const id = String(form.get("id"));
    await db.update(affiliateProduct).set(values).where(eq(affiliateProduct.id, id));
    return { ok: "Saved" };
  }

  if (intent === "toggle") {
    const id = String(form.get("id"));
    const p = await db.query.affiliateProduct.findFirst({
      where: eq(affiliateProduct.id, id),
    });
    if (!p) return { error: "Not found" };
    await db
      .update(affiliateProduct)
      .set({ isActive: !p.isActive })
      .where(eq(affiliateProduct.id, id));
    return { ok: "Updated" };
  }

  if (intent === "delete") {
    await db
      .delete(affiliateProduct)
      .where(eq(affiliateProduct.id, String(form.get("id"))));
    return { ok: "Deleted" };
  }

  if (intent === "import") {
    const network = str("network") ?? "amazon";
    const query = str("query") ?? "";
    const source = getSource(network);
    if (!source) return { error: "Unknown network." };
    const result = await source.search(query);
    if (!result.ok) return { error: result.reason };
    for (const item of result.items) {
      await db.insert(affiliateProduct).values({ network, ...item });
    }
    return { ok: `Imported ${result.items.length} products` };
  }

  return { error: "Unknown action" };
}

export default function AffiliateProducts({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { products } = loaderData;
  useActionToast(actionData);

  return (
    <>
      <PageHeader
        title="Affiliate catalog"
        subtitle="Products creators can feature. Creators earn via their own tags."
        action={
          <div className="flex items-center gap-2">
            <FormDialog
              title="Import from API"
              submitLabel="Import"
              trigger={{ label: "Import", icon: Download, variant: "outline" }}
            >
              <input type="hidden" name="intent" value="import" />
              <Field label="Network">
                <NetworkSelect />
              </Field>
              <Field label="Search query">
                <Input name="query" placeholder="e.g. mechanical keyboard" />
              </Field>
              <p className="text-xs text-muted">
                API import is stubbed until network keys are configured — add
                products manually for now.
              </p>
            </FormDialog>
            <FormDialog
              title="Add catalog product"
              submitLabel="Add to catalog"
              trigger={{ label: "Add product", icon: Plus }}
            >
              <CatalogFields intent="add" />
            </FormDialog>
          </div>
        }
      />

      {products.length === 0 ? (
        <Card className="border-2 border-dashed border-border bg-paper p-12 text-center text-ink-soft">
          <PackageSearch className="mx-auto mb-3 h-8 w-8 text-muted" />
          Catalog is empty — add a product.
        </Card>
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <Card key={p.id} className="flex items-center gap-4 p-4">
              {p.imageUrl ? (
                <img
                  src={p.imageUrl}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-14 w-14 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-ink/5 text-muted">
                  <PackageSearch className="h-6 w-6" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-ink">{p.title}</p>
                <p className="text-sm text-muted">
                  {networkLabel(p.network)}
                  {p.priceCents != null && ` · ${formatMoney(p.priceCents)}`}
                  {p.category && ` · ${p.category}`}
                </p>
              </div>
              {p.isActive ? (
                <Badge tone="success">Live</Badge>
              ) : (
                <Badge tone="neutral">Hidden</Badge>
              )}
              <div className="flex items-center gap-1">
                <FormDialog
                  title="Edit catalog product"
                  submitLabel="Save"
                  trigger={{ label: "Edit", icon: Pencil, variant: "outline", size: "sm" }}
                >
                  <CatalogFields product={p} intent="update" />
                </FormDialog>
                <Form method="post">
                  <input type="hidden" name="intent" value="toggle" />
                  <input type="hidden" name="id" value={p.id} />
                  <Button type="submit" variant="ghost" size="sm">
                    {p.isActive ? "Hide" : "Show"}
                  </Button>
                </Form>
                <Form method="post">
                  <input type="hidden" name="intent" value="delete" />
                  <input type="hidden" name="id" value={p.id} />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="icon"
                    aria-label="Delete product"
                    className="text-muted hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </Form>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

function NetworkSelect({ defaultValue }: { defaultValue?: string }) {
  return (
    <select
      name="network"
      defaultValue={defaultValue ?? "amazon"}
      className="h-12 w-full rounded-xl border-2 border-border bg-surface px-3 text-[15px] capitalize text-ink outline-none focus:border-primary"
    >
      {NETWORK_KEYS.map((n) => (
        <option key={n} value={n}>
          {networkLabel(n)}
        </option>
      ))}
    </select>
  );
}

function CatalogFields({
  product,
  intent,
}: {
  product?: Route.ComponentProps["loaderData"]["products"][number];
  intent: "add" | "update";
}) {
  return (
    <>
      <input type="hidden" name="intent" value={intent} />
      {product && <input type="hidden" name="id" value={product.id} />}
      <Field label="Title">
        <Input name="title" defaultValue={product?.title ?? ""} required />
      </Field>
      <Field label="Product URL">
        <Input
          name="productUrl"
          defaultValue={product?.productUrl ?? ""}
          placeholder="https://www.amazon.com/dp/…"
          required
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Network">
          <NetworkSelect defaultValue={product?.network} />
        </Field>
        <Field label="Price ($)">
          <Input
            name="price"
            type="number"
            min={0}
            step="0.01"
            defaultValue={product?.priceCents ? product.priceCents / 100 : ""}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Category">
          <Input name="category" defaultValue={product?.category ?? ""} />
        </Field>
        <Field label="External ID">
          <Input
            name="externalId"
            defaultValue={product?.externalId ?? ""}
            placeholder="ASIN…"
          />
        </Field>
      </div>
      <Field label="Image URL">
        <Input name="imageUrl" defaultValue={product?.imageUrl ?? ""} placeholder="https://…" />
      </Field>
      <Field label="Description">
        <Textarea
          name="description"
          defaultValue={product?.description ?? ""}
          className="min-h-20"
        />
      </Field>
    </>
  );
}
