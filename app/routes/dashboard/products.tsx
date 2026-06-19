import { Form, useNavigation } from "react-router";
import { and, asc, eq } from "drizzle-orm";
import { Trash2, ShoppingBag, Plus, FileDown, Video, Brush } from "lucide-react";
import type { Route } from "./+types/products";
import { requireProfile } from "~/lib/session.server";
import { db } from "~/db/index.server";
import { product as productTable } from "~/db/schemas/shop";
import { formatMoney } from "~/lib/utils";
import { PageHeader } from "~/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
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
  const products = await db.query.product.findMany({
    where: eq(productTable.profileId, profile.id),
    orderBy: asc(productTable.sortOrder),
  });
  return { products };
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
    const values = {
      name: str("name") ?? "New product",
      type: (str("type") as "digital" | "call" | "commission") ?? "digital",
      priceCents: Math.max(100, Math.round(Number(form.get("price")) * 100) || 100),
      description: str("description"),
      imageUrl: str("imageUrl"),
      fileUrl: str("fileUrl"),
      externalUrl: str("externalUrl"),
    };

    if (intent === "addProduct") {
      const existing = await db.query.product.findMany({
        where: eq(productTable.profileId, profile.id),
        columns: { sortOrder: true },
      });
      const sortOrder =
        existing.reduce((m, p) => Math.max(m, p.sortOrder), -1) + 1;
      await db
        .insert(productTable)
        .values({ profileId: profile.id, sortOrder, ...values });
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

  return { error: "Unknown action" };
}

const typeMeta = {
  digital: { icon: FileDown, label: "Digital" },
  call: { icon: Video, label: "1-1 Call" },
  commission: { icon: Brush, label: "Commission" },
} as const;

export default function Products({ loaderData }: Route.ComponentProps) {
  const { products } = loaderData;
  const nav = useNavigation();
  const busy = nav.state !== "idle";

  return (
    <>
      <PageHeader title="Shop" subtitle="Sell digital products & services." />

      <div className="grid gap-6 lg:grid-cols-2">
        {products.map((p) => {
          const Icon = typeMeta[p.type].icon;
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
                <ProductForm product={p} busy={busy} />
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
              <ShoppingBag className="h-5 w-5" /> Add a product
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProductForm busy={busy} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function ProductForm({
  product,
  busy,
}: {
  product?: Route.ComponentProps["loaderData"]["products"][number];
  busy: boolean;
}) {
  const isEdit = Boolean(product);
  return (
    <Form method="post" className="space-y-4">
      <input
        type="hidden"
        name="intent"
        value={isEdit ? "updateProduct" : "addProduct"}
      />
      {isEdit && <input type="hidden" name="id" value={product!.id} />}

      <Field label="Name">
        <Input name="name" defaultValue={product?.name ?? ""} placeholder="Design E-book" required />
      </Field>
      <div className="grid grid-cols-2 gap-3">
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
          placeholder="What buyers get…"
          className="min-h-20"
        />
      </Field>
      <Field label="Image URL">
        <Input name="imageUrl" defaultValue={product?.imageUrl ?? ""} placeholder="https://…" />
      </Field>
      <Field
        label="Download file URL"
        hint="Delivered after purchase (digital items)"
      >
        <Input name="fileUrl" defaultValue={product?.fileUrl ?? ""} placeholder="https://…" />
      </Field>
      <Field
        label="Booking / access link"
        hint="Shown after purchase (calls & commissions)"
      >
        <Input
          name="externalUrl"
          defaultValue={product?.externalUrl ?? ""}
          placeholder="https://calendly.com/…"
        />
      </Field>

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
