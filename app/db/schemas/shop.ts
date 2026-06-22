import { relations, sql } from "drizzle-orm";
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { user } from "./auth";
import { profile } from "./profile";

const now = sql`(cast(unixepoch('subsecond') * 1000 as integer))`;

/** A sellable item: digital download, 1-1 call, or commission. */
export const product = sqliteTable(
  "product",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    profileId: text("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    /** Top-level kind. Physical products collect a shipping address at checkout. */
    kind: text("kind", { enum: ["digital", "physical"] })
      .default("digital")
      .notNull(),
    /** Digital sub-type (ignored for physical products). */
    type: text("type", { enum: ["digital", "call", "commission"] })
      .default("digital")
      .notNull(),
    priceCents: integer("price_cents").notNull(),
    currency: text("currency").default("usd").notNull(),
    imageUrl: text("image_url"),
    /** For digital downloads: a file URL (R2/external). Delivered after purchase. */
    fileUrl: text("file_url"),
    /** For calls/commissions: a link (Calendly, form, etc.) shown after purchase. */
    externalUrl: text("external_url"),
    salesCount: integer("sales_count").default(0).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(now)
      .notNull(),
  },
  (t) => [index("product_profileId_idx").on(t.profileId)],
);

/** A purchase of a product. Buyers may be guests (email only). */
export const order = sqliteTable(
  "order",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    productId: text("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    profileId: text("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    buyerUserId: text("buyer_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    buyerEmail: text("buyer_email"),
    /** Captured for physical orders so the creator can fulfill/ship. */
    shippingName: text("shipping_name"),
    shippingAddress: text("shipping_address", { mode: "json" }).$type<{
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    }>(),
    amountCents: integer("amount_cents").notNull(),
    feeCents: integer("fee_cents").default(0).notNull(),
    currency: text("currency").default("usd").notNull(),
    status: text("status", { enum: ["pending", "paid", "failed"] })
      .default("pending")
      .notNull(),
    /** Random token granting download/access after purchase. */
    accessToken: text("access_token").notNull(),
    stripeCheckoutSessionId: text("stripe_checkout_session_id").unique(),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(now)
      .notNull(),
  },
  (t) => [
    index("order_productId_idx").on(t.productId),
    index("order_profileId_idx").on(t.profileId),
    index("order_token_idx").on(t.accessToken),
  ],
);

export const productRelations = relations(product, ({ one, many }) => ({
  profile: one(profile, {
    fields: [product.profileId],
    references: [profile.id],
  }),
  orders: many(order),
}));

export const orderRelations = relations(order, ({ one }) => ({
  product: one(product, {
    fields: [order.productId],
    references: [product.id],
  }),
  profile: one(profile, {
    fields: [order.profileId],
    references: [profile.id],
  }),
  buyer: one(user, { fields: [order.buyerUserId], references: [user.id] }),
}));
