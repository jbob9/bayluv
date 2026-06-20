import { relations, sql } from "drizzle-orm";
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { profile } from "./profile";

const now = sql`(cast(unixepoch('subsecond') * 1000 as integer))`;

/** A record of an email broadcast a creator sent to their supporters. */
export const broadcast = sqliteTable(
  "broadcast",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    profileId: text("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    subject: text("subject").notNull(),
    body: text("body").notNull(),
    recipientCount: integer("recipient_count").default(0).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(now)
      .notNull(),
  },
  (t) => [index("broadcast_profileId_idx").on(t.profileId)],
);

export const broadcastRelations = relations(broadcast, ({ one }) => ({
  profile: one(profile, {
    fields: [broadcast.profileId],
    references: [profile.id],
  }),
}));
