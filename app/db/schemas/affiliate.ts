import { relations, sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  index,
  unique,
} from "drizzle-orm/sqlite-core";
import { profile } from "./profile";

const now = sql`(cast(unixepoch('subsecond') * 1000 as integer))`;

/**
 * Global affiliate product catalog, curated by app admins (manually now, via
 * pluggable API import later). Creators feature these on their pages.
 */
export const affiliateProduct = sqliteTable(
  "affiliate_product",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: text("title").notNull(),
    description: text("description"),
    imageUrl: text("image_url"),
    priceCents: integer("price_cents"),
    currency: text("currency").default("usd").notNull(),
    category: text("category"),
    /** Affiliate network key, e.g. "amazon" (see NETWORKS in affiliate.server). */
    network: text("network").notNull(),
    /** Canonical product URL; the creator's tag is injected at click time. */
    productUrl: text("product_url").notNull(),
    /** Source-specific id (e.g. Amazon ASIN). */
    externalId: text("external_id"),
    isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(now)
      .notNull(),
  },
  (t) => [index("affiliate_product_network_idx").on(t.network)],
);

/** Which catalog products a creator has chosen to feature. */
export const creatorAffiliateProduct = sqliteTable(
  "creator_affiliate_product",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    profileId: text("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    affiliateProductId: text("affiliate_product_id")
      .notNull()
      .references(() => affiliateProduct.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").default(0).notNull(),
    clicks: integer("clicks").default(0).notNull(),
    isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(now)
      .notNull(),
  },
  (t) => [
    index("creator_affiliate_profileId_idx").on(t.profileId),
    unique("creator_affiliate_unique").on(t.profileId, t.affiliateProductId),
  ],
);

/** A creator's affiliate tag per network (so the creator earns the commission). */
export const creatorAffiliateAccount = sqliteTable(
  "creator_affiliate_account",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    profileId: text("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    network: text("network").notNull(),
    tag: text("tag").notNull(),
  },
  (t) => [unique("creator_affiliate_account_unique").on(t.profileId, t.network)],
);

export const affiliateProductRelations = relations(
  affiliateProduct,
  ({ many }) => ({ selections: many(creatorAffiliateProduct) }),
);

export const creatorAffiliateProductRelations = relations(
  creatorAffiliateProduct,
  ({ one }) => ({
    profile: one(profile, {
      fields: [creatorAffiliateProduct.profileId],
      references: [profile.id],
    }),
    product: one(affiliateProduct, {
      fields: [creatorAffiliateProduct.affiliateProductId],
      references: [affiliateProduct.id],
    }),
  }),
);

export const creatorAffiliateAccountRelations = relations(
  creatorAffiliateAccount,
  ({ one }) => ({
    profile: one(profile, {
      fields: [creatorAffiliateAccount.profileId],
      references: [profile.id],
    }),
  }),
);
