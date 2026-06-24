import { Form } from "react-router";
import { and, asc, desc, eq } from "drizzle-orm";
import { FileText, Trash2, Plus, Globe, Lock, Crown, Pencil } from "lucide-react";
import type { Route } from "./+types/posts";
import { requireProfile } from "~/lib/session.server";
import { db } from "~/db/index.server";
import { post as postTable } from "~/db/schemas/post";
import { tier as tierTable } from "~/db/schemas/membership";
import { useActionToast } from "~/lib/use-action-toast";
import { PageHeader } from "~/components/dashboard/page-header";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { FormDialog } from "~/components/ui/form-dialog";
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
  useActionToast(actionData);

  return (
    <>
      <PageHeader
        title="Posts"
        subtitle="Share updates — free or members-only."
        action={
          <FormDialog
            title="New post"
            submitLabel="Publish post"
            trigger={{ label: "New post", icon: Plus }}
          >
            <PostFields tiers={tiers} intent="addPost" />
          </FormDialog>
        }
      />

      {posts.length === 0 ? (
        <Card className="border-2 border-dashed border-border bg-paper">
          <CardContent className="p-12 text-center text-ink-soft">
            <FileText className="mx-auto mb-3 h-8 w-8 text-muted" />
            No posts yet — write your first one.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => {
            const v = visBadge[p.visibility];
            return (
              <Card key={p.id} className="flex items-center gap-4 p-4">
                {p.coverUrl ? (
                  <img
                    src={p.coverUrl}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-14 w-14 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-ink/5 text-muted">
                    <FileText className="h-6 w-6" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-ink">{p.title}</p>
                  <p className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                    <Badge tone={v.tone}>
                      <v.icon className="h-3 w-3" /> {v.label}
                    </Badge>
                    {new Date(p.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <FormDialog
                    title="Edit post"
                    submitLabel="Save post"
                    trigger={{
                      label: "Edit",
                      icon: Pencil,
                      variant: "outline",
                      size: "sm",
                    }}
                  >
                    <PostFields post={p} tiers={tiers} intent="updatePost" />
                  </FormDialog>
                  <Form method="post">
                    <input type="hidden" name="intent" value="deletePost" />
                    <input type="hidden" name="id" value={p.id} />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="icon"
                      aria-label="Delete post"
                      className="text-muted hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </Form>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

function PostFields({
  post,
  tiers,
  intent,
}: {
  post?: Route.ComponentProps["loaderData"]["posts"][number];
  tiers: { id: string; name: string }[];
  intent: "addPost" | "updatePost";
}) {
  return (
    <>
      <input type="hidden" name="intent" value={intent} />
      {post && <input type="hidden" name="id" value={post.id} />}
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
    </>
  );
}
