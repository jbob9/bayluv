import { CheckCircle2, Download, ExternalLink, Clock } from "lucide-react";
import { eq } from "drizzle-orm";
import type { Route } from "./+types/d.$orderId";
import { db } from "~/db/index.server";
import { order, product } from "~/db/schemas/shop";
import { getStripe, hasStripe } from "~/lib/stripe.server";
import { Logo } from "~/components/brand/logo";
import { Card, CardContent } from "~/components/ui/card";
import { ButtonLink } from "~/components/ui/button";

export function meta() {
  return [{ title: "Your purchase · bayluv" }];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const row = await db.query.order.findFirst({
    where: eq(order.id, params.orderId),
    with: { product: true, profile: true },
  });
  if (!row || row.accessToken !== token) {
    throw new Response("Not found", { status: 404 });
  }

  // Resilience: if the webhook hasn't landed yet, confirm via the session.
  if (row.status === "pending" && hasStripe && row.stripeCheckoutSessionId) {
    const session = await getStripe().checkout.sessions.retrieve(
      row.stripeCheckoutSessionId,
    );
    if (session.payment_status === "paid") {
      await db
        .update(order)
        .set({ status: "paid" })
        .where(eq(order.id, row.id));
      await db
        .update(product)
        .set({ salesCount: row.product.salesCount + 1 })
        .where(eq(product.id, row.productId));
      row.status = "paid";
    }
  }

  return {
    paid: row.status === "paid",
    product: {
      name: row.product.name,
      type: row.product.type,
      fileUrl: row.product.fileUrl,
      externalUrl: row.product.externalUrl,
    },
    creator: { name: row.profile.displayName, username: row.profile.username },
  };
}

export default function DownloadPage({ loaderData }: Route.ComponentProps) {
  const { paid, product, creator } = loaderData;
  const accessUrl = product.fileUrl ?? product.externalUrl;

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
      <Logo className="mb-8" />
      <Card className="w-full">
        <CardContent className="space-y-4 p-8">
          {paid ? (
            <>
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-success-soft text-success">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h1 className="text-2xl font-extrabold text-ink">Thank you! 🎉</h1>
              <p className="text-ink-soft">
                You bought <span className="font-semibold">{product.name}</span>{" "}
                from {creator.name}.
              </p>
              {accessUrl ? (
                <a
                  href={accessUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 font-semibold text-primary-foreground shadow-soft hover:bg-primary-600"
                >
                  {product.type === "digital" ? (
                    <>
                      <Download className="h-5 w-5" /> Download now
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-5 w-5" /> Access your purchase
                    </>
                  )}
                </a>
              ) : (
                <p className="text-sm text-muted">
                  The creator will be in touch with next steps.
                </p>
              )}
            </>
          ) : (
            <>
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-sunny-soft text-[#946100]">
                <Clock className="h-8 w-8" />
              </div>
              <h1 className="text-2xl font-extrabold text-ink">
                Processing your order
              </h1>
              <p className="text-ink-soft">
                Hang tight — this page will unlock once payment confirms. Refresh
                in a moment.
              </p>
            </>
          )}
          <ButtonLink to={`/${creator.username}`} variant="ghost">
            Back to {creator.name}
          </ButtonLink>
        </CardContent>
      </Card>
    </main>
  );
}
