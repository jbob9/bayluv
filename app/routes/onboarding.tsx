import { Form, redirect, useNavigation } from "react-router";
import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Route } from "./+types/onboarding";
import { requireUser } from "~/lib/session.server";
import { db } from "~/db/index.server";
import { profile } from "~/db/schemas/profile";
import { slugify } from "~/lib/utils";
import { Logo } from "~/components/brand/logo";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Field } from "~/components/ui/label";

export function meta() {
  return [{ title: "Claim your link · bayluv" }];
}

/** Route paths that can't be used as usernames (they'd shadow real routes). */
const RESERVED = new Set([
  "login", "signup", "logout", "onboarding", "dashboard", "api", "dev",
  "admin", "settings", "about", "pricing", "explore", "home", "help",
  "terms", "privacy", "support", "www", "app", "bayluv",
]);

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireUser(request);
  const existing = await db.query.profile.findFirst({
    where: eq(profile.userId, user.id),
  });
  if (existing) throw redirect("/dashboard");
  return {
    suggested: slugify(user.name || user.email.split("@")[0] || "creator"),
    displayName: user.name || "",
  };
}

const schema = z.object({
  username: z
    .string()
    .min(3, "At least 3 characters")
    .max(30)
    .regex(/^[a-z0-9_-]+$/, "Only letters, numbers, - and _"),
  displayName: z.string().min(1, "Required").max(60),
});

export async function action({ request }: Route.ActionArgs) {
  const user = await requireUser(request);
  const form = Object.fromEntries(await request.formData());
  const parsed = schema.safeParse({
    username: slugify(String(form.username ?? "")),
    displayName: String(form.displayName ?? "").trim(),
  });
  if (!parsed.success) {
    return { error: z.flattenError(parsed.error).fieldErrors };
  }
  const { username, displayName } = parsed.data;

  if (RESERVED.has(username)) {
    return { error: { username: ["That username is reserved"] } };
  }

  const taken = await db.query.profile.findFirst({
    where: eq(profile.username, username),
  });
  if (taken) {
    return { error: { username: ["That username is already taken"] } };
  }

  await db.insert(profile).values({ userId: user.id, username, displayName });
  throw redirect("/dashboard");
}

export default function Onboarding({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const nav = useNavigation();
  const busy = nav.state !== "idle";
  const errors = actionData?.error;

  return (
    <main className="flex min-h-screen flex-col px-6 py-8">
      <Logo />
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <h1 className="text-3xl font-extrabold text-ink">Claim your link</h1>
        <p className="mt-1 text-ink-soft">
          This is the address fans will use to support you.
        </p>

        <Form method="post" className="mt-8 space-y-5">
          <Field
            label="Your bayluv URL"
            htmlFor="username"
            error={errors?.username?.[0]}
          >
            <div className="flex items-center overflow-hidden rounded-xl border-2 border-border bg-surface focus-within:border-primary">
              <span className="pl-4 text-muted">bayluv.com/</span>
              <input
                id="username"
                name="username"
                defaultValue={loaderData.suggested}
                required
                className="h-12 flex-1 bg-transparent pr-4 text-[15px] text-ink outline-none"
                placeholder="yourname"
              />
            </div>
          </Field>

          <Field
            label="Display name"
            htmlFor="displayName"
            error={errors?.displayName?.[0]}
          >
            <Input
              id="displayName"
              name="displayName"
              defaultValue={loaderData.displayName}
              required
              placeholder="Peter Webby"
            />
          </Field>

          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? "Creating your page…" : "Create my page"}
          </Button>
        </Form>
      </div>
    </main>
  );
}
