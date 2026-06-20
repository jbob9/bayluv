import { Form, useNavigation } from "react-router";
import { and, asc, desc, eq } from "drizzle-orm";
import { FileText, Trash2, Plus, Globe, Lock, Crown } from "lucide-react";
import type { Route } from "./+types/posts";
import { requireProfile } from "~/lib/session.server";
import { db } from "~/db/index.server";
import { post as postTable } from "~/db/schemas/post";
import { tier as tierTable } from "~/db/schemas/membership";
import { useActionToast } from "~/lib/use-action-toast";
import { PageHeader } from "~/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Field } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";

export function meta() {
  return [{ title: "Posts · bayluv" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const { profile } = await requireProfile(request);
  const [posts, tiers] = await Promise.all([
    db.query.post.findMany({
      where: eq(postTable.profileId, profile.id),
      orderBy: desc(postTable.createdAt),
    }),
    db.query.tier.findMany({
      where: eq(tierTable.profileId, profile.id),
      orderBy: asc(tierTable.priceCents),
    }),
  ]);
  return { posts, tiers: tiers.map((t) => ({ id: t.id, name: t.name })) };
}

export async function action({ request }: Route.ActionArgs) {
  const { profile } = await requireProfile(request);
  const form = await request.formData();
  const intent = String(form.get("intent"));
  const owns = (id: string) =>
    db.query.post.findFirst({
      where: and(eq(postTable.id, id), eq(postTable.profileId, profile.id)),
    });
  const str = (k: string) => {
    const v = form.get(k);
    return v == null || v === "" ? null : String(v).trim();
  };

  if (intent === "addPost" || intent === "updatePost") {
    const visibility = (["public", "members", "tier"].includes(
      String(form.get("visibility")),
    )
      ? String(form.get("visibility"))
      : "public") as "public" | "members" | "tier";
    const values = {
      title: str("title") ?? "Untitled",
      body: str("body") ?? "",
      coverUrl: str("coverUrl"),
      visibility,
      minTierId: visibility === "tier" ? str("minTierId") : null,
    };
    if (intent === "addPost") {
      await db.insert(postTable).values({ profileId: profile.id, ...values });
      return { ok: "Post published" };
    }
    const id = String(form.get("id"));
    if (!(await owns(id))) return { error: "Not found" };
    await db.update(postTable).set(values).where(eq(postTable.id, id));
    return { ok: "Post saved" };
  }

  if (intent === "deletePost") {
    const id = String(form.get("id"));
    if (!(await owns(id))) return { error: "Not found" };
    await db.delete(postTable).where(eq(postTable.id, id));
    return { ok: "Deleted" };
  }

  return { error: "Unknown action" };
}

const visBadge = {
  public: { tone: "mint" as const, icon: Globe, label: "Public" },
  members: { tone: "grape" as const, icon: Lock, label: "Members" },
  tier: { tone: "sunny" as const, icon: Crown, label: "Tier" },
};

export default function Posts({ loaderData, actionData }: Route.ComponentProps) {
  const { posts, tiers } = loaderData;
  const nav = useNavigation();
  const busy = nav.state !== "idle";
  useActionToast(actionData);

  return (
    <>
      <PageHeader
        title="Posts"
        subtitle="Share updates — free or members-only."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        {/* Existing posts */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <Card className="border-2 border-dashed border-border bg-paper">
              <CardContent className="p-10 text-center text-ink-soft">
                <FileText className="mx-auto mb-3 h-8 w-8 text-muted" />
                No posts yet. Write your first one →
              </CardContent>
            </Card>
          ) : (
            posts.map((p) => {
              const v = visBadge[p.visibility];
              return (
                <Card key={p.id}>
                  <CardContent className="space-y-3 p-5">
                    <div className="flex items-center justify-between gap-2">
                      <Badge tone={v.tone}>
                        <v.icon className="h-3 w-3" /> {v.label}
                      </Badge>
                      <Form method="post">
                        <input type="hidden" name="intent" value="deletePost" />
                        <input type="hidden" name="id" value={p.id} />
                        <Button
                          type="submit"
                          variant="ghost"
                          size="sm"
                          disabled={busy}
                          className="text-muted hover:text-danger"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </Form>
                    </div>
                    <details>
                      <summary className="cursor-pointer font-bold text-ink">
                        {p.title}
                      </summary>
                      <PostForm post={p} tiers={tiers} busy={busy} />
                    </details>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* New post */}
        <Card className="lg:sticky lg:top-6 lg:self-start">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" /> New post
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PostForm tiers={tiers} busy={busy} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function PostForm({
  post,
  tiers,
  busy,
}: {
  post?: Route.ComponentProps["loaderData"]["posts"][number];
  tiers: { id: string; name: string }[];
  busy: boolean;
}) {
  const isEdit = Boolean(post);
  return (
    <Form method="post" className="mt-3 space-y-4">
      <input type="hidden" name="intent" value={isEdit ? "updatePost" : "addPost"} />
      {isEdit && <input type="hidden" name="id" value={post!.id} />}
      <Field label="Title">
        <Input name="title" defaultValue={post?.title ?? ""} required />
      </Field>
      <Field label="Body">
        <Textarea
          name="body"
          defaultValue={post?.body ?? ""}
          className="min-h-32"
          placeholder="Write your update…"
          required
        />
      </Field>
      <Field label="Cover image URL">
        <Input name="coverUrl" defaultValue={post?.coverUrl ?? ""} placeholder="https://…" />
      </Field>
      <Field label="Who can see this?">
        <select
          name="visibility"
          defaultValue={post?.visibility ?? "public"}
          className="h-12 w-full rounded-xl border-2 border-border bg-surface px-3 text-[15px] text-ink outline-none focus:border-primary"
        >
          <option value="public">Public — everyone</option>
          <option value="members">Members only</option>
          <option value="tier">Specific tier &amp; up</option>
        </select>
      </Field>
      {tiers.length > 0 && (
        <Field label="Minimum tier (for tier-locked posts)">
          <select
            name="minTierId"
            defaultValue={post?.minTierId ?? ""}
            className="h-12 w-full rounded-xl border-2 border-border bg-surface px-3 text-[15px] text-ink outline-none focus:border-primary"
          >
            <option value="">— select —</option>
            {tiers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </Field>
      )}
      <Button type="submit" disabled={busy}>
        {isEdit ? "Save post" : "Publish post"}
      </Button>
    </Form>
  );
}
