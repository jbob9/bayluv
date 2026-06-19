import { redirect } from "react-router";
import { eq, sql } from "drizzle-orm";
import type { Route } from "./+types/l.$linkId";
import { db } from "~/db/index.server";
import { link } from "~/db/schemas/profile";

// GET /l/:linkId — record a click and redirect to the destination URL.
export async function loader({ params }: Route.LoaderArgs) {
  const row = await db.query.link.findFirst({
    where: eq(link.id, params.linkId),
  });
  if (!row?.url) throw redirect("/");
  await db
    .update(link)
    .set({ clicks: sql`${link.clicks} + 1` })
    .where(eq(link.id, params.linkId));
  return redirect(row.url);
}
