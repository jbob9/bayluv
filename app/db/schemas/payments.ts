import { relations, sql } from "drizzle-orm";
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { user } from "./auth";
import { profile } from "./profile";

const now = sql`(cast(unixepoch('subsecond') * 1000 as integer))`;

/** A creator's Stripe Connect (Express) account + capability status. */
export const paymentAccount = sqliteTable(
  "payment_account",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    stripeAccountId: text("stripe_account_id").notNull().unique(),
    chargesEnabled: integer("charges_enabled", { mode: "boolean" })
      .default(false)
      .notNull(),
    payoutsEnabled: integer("payouts_enabled", { mode: "boolean" })
      .default(false)
      .notNull(),
    detailsSubmitted: integer("details_submitted", { mode: "boolean" })
      .default(false)
      .notNull(),
    country: text("country"),
    defaultCurrency: text("default_currency").default("usd"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(now)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(now)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [index("payment_account_userId_idx").on(t.userId)],
);

/** A one-time tip ("coffee") left on a creator's page. Guests allowed. */
export const support = sqliteTable(
  "support",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    profileId: text("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    supporterUserId: text("supporter_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    supporterName: text("supporter_name"),
    supporterEmail: text("supporter_email"),
    quantity: integer("quantity").default(1).notNull(),
    amountCents: integer("amount_cents").notNull(),
    feeCents: integer("fee_cents").default(0).notNull(),
    currency: text("currency").default("usd").notNull(),
    message: text("message"),
    isPublic: integer("is_public", { mode: "boolean" }).default(true).notNull(),
    isMonthly: integer("is_monthly", { mode: "boolean" })
      .default(false)
      .notNull(),
    status: text("status", { enum: ["pending", "paid", "failed"] })
      .default("pending")
      .notNull(),
    stripeCheckoutSessionId: text("stripe_checkout_session_id").unique(),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(now)
      .notNull(),
  },
  (t) => [
    index("support_profileId_idx").on(t.profileId),
    index("support_status_idx").on(t.status),
  ],
);

export const paymentAccountRelations = relations(paymentAccount, ({ one }) => ({
  user: one(user, {
    fields: [paymentAccount.userId],
    references: [user.id],
  }),
}));

export const supportRelations = relations(support, ({ one }) => ({
  profile: one(profile, {
    fields: [support.profileId],
    references: [profile.id],
  }),
  supporter: one(user, {
    fields: [support.supporterUserId],
    references: [user.id],
  }),
}));
