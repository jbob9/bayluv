import { eq, asc } from "drizzle-orm";
import { db } from "~/db/index.server";
import { profile, link, socialLink } from "~/db/schemas/profile";

/** Loads a published profile by username with its socials + active links. */
export async function getPublicProfile(username: string) {
  const row = await db.query.profile.findFirst({
    where: eq(profile.username, username.toLowerCase()),
    with: {
      socialLinks: { orderBy: asc(socialLink.sortOrder) },
      links: { orderBy: asc(link.sortOrder) },
    },
  });
  if (!row || !row.isPublished) return null;
  return { ...row, links: row.links.filter((l) => l.isActive) };
}

/** Loads the signed-in creator's own profile (any publish state) for editing. */
export async function getOwnProfile(userId: string) {
  return db.query.profile.findFirst({
    where: eq(profile.userId, userId),
    with: {
      socialLinks: { orderBy: asc(socialLink.sortOrder) },
      links: { orderBy: asc(link.sortOrder) },
    },
  });
}
