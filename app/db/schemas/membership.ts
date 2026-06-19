import { relations, sql } from "drizzle-orm";
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { user } from "./auth";
import { profile } from "./profile";

const now = sql`(cast(unixepoch('subsecond') * 1000 as integer))`;

/** A recurring membership tier offered by a creator. */
export const tier = sqliteTable(
  "tier",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    profileId: text("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    priceCents: integer("price_cents").notNull(),
    interval: text("interval", { enum: ["month", "year"] })
      .default("month")
      .notNull(),
    currency: text("currency").default("usd").notNull(),
    benefits: text("benefits", { mode: "json" }).$type<string[]>().default([]),
    imageUrl: text("image_url"),
    accentColor: text("accent_color").default("primary").notNull(),
    stripeProductId: text("stripe_product_id"),
    stripePriceId: text("stripe_price_id"),
    sortOrder: integer("sort_order").default(0).notNull(),
    isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
    memberCount: integer("member_count").default(0).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(now)
      .notNull(),
  },
  (t) => [index("tier_profileId_idx").on(t.profileId)],
);

/** An active (or past) subscription of a supporter to a tier. */
export const membership = sqliteTable(
  "membership",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    profileId: text("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    tierId: text("tier_id").references(() => tier.id, { onDelete: "set null" }),
    supporterUserId: text("supporter_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    stripeSubscriptionId: text("stripe_subscription_id").notNull().unique(),
    stripeCustomerId: text("stripe_customer_id"),
    status: text("status", {
      enum: ["active", "trialing", "past_due", "canceled", "incomplete"],
    })
      .default("incomplete")
      .notNull(),
    currentPeriodEnd: integer("current_period_end", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(now)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(now)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index("membership_profileId_idx").on(t.profileId),
    index("membership_supporter_idx").on(t.supporterUserId),
  ],
);

export const tierRelations = relations(tier, ({ one, many }) => ({
  profile: one(profile, {
    fields: [tier.profileId],
    references: [profile.id],
  }),
  memberships: many(membership),
}));

export const membershipRelations = relations(membership, ({ one }) => ({
  profile: one(profile, {
    fields: [membership.profileId],
    references: [profile.id],
  }),
  tier: one(tier, { fields: [membership.tierId], references: [tier.id] }),
  supporter: one(user, {
    fields: [membership.supporterUserId],
    references: [user.id],
  }),
}));
