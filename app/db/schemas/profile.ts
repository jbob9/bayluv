import { relations, sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  index,
} from "drizzle-orm/sqlite-core";
import { user } from "./auth";

const now = sql`(cast(unixepoch('subsecond') * 1000 as integer))`;

/** A creator's public page. One per user, keyed by a unique URL slug. */
export const profile = sqliteTable(
  "profile",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    username: text("username").notNull().unique(),
    displayName: text("display_name").notNull(),
    tagline: text("tagline"),
    bio: text("bio"),
    avatarUrl: text("avatar_url"),
    coverUrl: text("cover_url"),
    category: text("category"),
    /** Accent color token name (e.g. "primary", "mint", "sky", "grape"). */
    themeColor: text("theme_color").default("primary").notNull(),
    goalAmountCents: integer("goal_amount_cents"),
    goalLabel: text("goal_label"),
    /** Cached count of distinct supporters for fast page rendering. */
    supporterCount: integer("supporter_count").default(0).notNull(),
    isPublished: integer("is_published", { mode: "boolean" })
      .default(false)
      .notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(now)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(now)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [index("profile_username_idx").on(t.username)],
);

/** Social platform icons shown on the profile (X, YouTube, TikTok, …). */
export const socialLink = sqliteTable(
  "social_link",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    profileId: text("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    platform: text("platform").notNull(),
    url: text("url").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
  },
  (t) => [index("social_link_profileId_idx").on(t.profileId)],
);

/** Link-in-bio blocks: links, section headers, and affiliate links. */
export const link = sqliteTable(
  "link",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    profileId: text("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    type: text("type", { enum: ["link", "header", "affiliate"] })
      .default("link")
      .notNull(),
    title: text("title").notNull(),
    url: text("url"),
    icon: text("icon"),
    thumbnailUrl: text("thumbnail_url"),
    sortOrder: integer("sort_order").default(0).notNull(),
    isActive: integer("is_active", { mode: "boolean" })
      .default(true)
      .notNull(),
    clicks: integer("clicks").default(0).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(now)
      .notNull(),
  },
  (t) => [index("link_profileId_idx").on(t.profileId)],
);

export const profileRelations = relations(profile, ({ one, many }) => ({
  user: one(user, { fields: [profile.userId], references: [user.id] }),
  socialLinks: many(socialLink),
  links: many(link),
}));

export const socialLinkRelations = relations(socialLink, ({ one }) => ({
  profile: one(profile, {
    fields: [socialLink.profileId],
    references: [profile.id],
  }),
}));

export const linkRelations = relations(link, ({ one }) => ({
  profile: one(profile, {
    fields: [link.profileId],
    references: [profile.id],
  }),
}));
