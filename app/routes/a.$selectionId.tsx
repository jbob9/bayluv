import { redirect } from "react-router";
import { eq, and, sql } from "drizzle-orm";
import type { Route } from "./+types/a.$selectionId";
import { db } from "~/db/index.server";
import {
  creatorAffiliateProduct,
  creatorAffiliateAccount,
} from "~/db/schemas/affiliate";
import { buildAffiliateUrl } from "~/lib/affiliate";

// GET /a/:selectionId — build the creator-tagged affiliate URL, count, redirect.
export async function loader({ params }: Route.LoaderArgs) {
  const sel = await db.query.creatorAffiliateProduct.findFirst({
    where: eq(creatorAffiliateProduct.id, params.selectionId),
    with: { product: true },
  });
  if (!sel?.product) throw redirect("/");

  const account = await db.query.creatorAffiliateAccount.findFirst({
    where: and(
      eq(creatorAffiliateAccount.profileId, sel.profileId),
      eq(creatorAffiliateAccount.network, sel.product.network),
    ),
  });

  await db
    .update(creatorAffiliateProduct)
    .set({ clicks: sql`${creatorAffiliateProduct.clicks} + 1` })
    .where(eq(creatorAffiliateProduct.id, sel.id));

  return redirect(
    buildAffiliateUrl(sel.product.productUrl, sel.product.network, account?.tag),
  );
}
