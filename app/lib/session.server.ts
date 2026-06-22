import { redirect } from "react-router";
import { auth } from "./auth.server";
import { db } from "~/db/index.server";
import { profile } from "~/db/schemas/profile";
import { eq } from "drizzle-orm";
import { adminEmails } from "./env.server";

/** Returns the better-auth session (user + session) or null. */
export async function getSession(request: Request) {
  return auth.api.getSession({ headers: request.headers });
}

/** Returns the signed-in user or null. */
export async function getOptionalUser(request: Request) {
  const session = await getSession(request);
  return session?.user ?? null;
}

/**
 * Requires a signed-in user; otherwise redirects to /login with a `redirect`
 * back to the originating URL.
 */
export async function requireUser(request: Request) {
  const user = await getOptionalUser(request);
  if (!user) {
    const url = new URL(request.url);
    throw redirect(`/login?redirect=${encodeURIComponent(url.pathname + url.search)}`);
  }
  return user;
}

/**
 * Requires a signed-in user AND a completed profile (claimed username).
 * Sends users who haven't onboarded to /onboarding. Returns { user, profile }.
 */
export async function requireProfile(request: Request) {
  const user = await requireUser(request);
  const row = await db.query.profile.findFirst({
    where: eq(profile.userId, user.id),
  });
  if (!row) throw redirect("/onboarding");
  return { user, profile: row };
}

/** Looks up the current user's profile without forcing onboarding. */
export async function getUserProfile(userId: string) {
  return db.query.profile.findFirst({ where: eq(profile.userId, userId) });
}

/** True if the user is an admin (by role column or the ADMIN_EMAILS allowlist). */
export function isAdminUser(user: {
  role?: string | null;
  email: string;
}): boolean {
  return user.role === "admin" || adminEmails.includes(user.email.toLowerCase());
}

/** Requires an authenticated admin; otherwise 403 (or redirect to login). */
export async function requireAdmin(request: Request) {
  const user = await requireUser(request);
  if (!isAdminUser(user as { role?: string | null; email: string })) {
    throw new Response("Forbidden", { status: 403 });
  }
  return user;
}
