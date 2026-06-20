import { relations, sql } from "drizzle-orm";
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { profile } from "./profile";
import { tier } from "./membership";

const now = sql`(cast(unixepoch('subsecond') * 1000 as integer))`;

/**
 * A post / update. Visibility:
 *  - "public": anyone
 *  - "members": any active member of this creator
 *  - "tier": members of `tierId` (or higher price, treated as access threshold)
 */
export const post = sqliteTable(
  "post",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    profileId: text("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body").notNull(),
    coverUrl: text("cover_url"),
    visibility: text("visibility", { enum: ["public", "members", "tier"] })
      .default("public")
      .notNull(),
    minTierId: text("min_tier_id").references(() => tier.id, {
      onDelete: "set null",
    }),
    isPublished: integer("is_published", { mode: "boolean" })
      .default(true)
      .notNull(),
    likes: integer("likes").default(0).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(now)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(now)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [index("post_profileId_idx").on(t.profileId)],
);

export const postRelations = relations(post, ({ one }) => ({
  profile: one(profile, {
    fields: [post.profileId],
    references: [profile.id],
  }),
  minTier: one(tier, { fields: [post.minTierId], references: [tier.id] }),
}));
