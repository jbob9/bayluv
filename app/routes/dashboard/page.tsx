import { Form, useNavigation } from "react-router";
import { and, eq } from "drizzle-orm";
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  GripVertical,
  ExternalLink,
} from "lucide-react";
import type { Route } from "./+types/page";
import { requireProfile } from "~/lib/session.server";
import { getOwnProfile } from "~/lib/profile.server";
import { db } from "~/db/index.server";
import { profile as profileTable, link, socialLink } from "~/db/schemas/profile";
import { THEME_COLORS } from "~/lib/theme";
import { SOCIAL_PLATFORMS, socialIcon } from "~/components/profile/socials";
import { cn } from "~/lib/utils";
import { PageHeader } from "~/components/dashboard/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Button, ButtonLink } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Field } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";

export function meta() {
  return [{ title: "My Page · bayluv" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const { user } = await requireProfile(request);
  const profile = await getOwnProfile(user.id);
  return { profile: profile! };
}

export async function action({ request }: Route.ActionArgs) {
  const { profile } = await requireProfile(request);
  const form = await request.formData();
  const intent = String(form.get("intent"));
  const str = (k: string) => {
    const v = form.get(k);
    return v == null || v === "" ? null : String(v).trim();
  };

  // Ensures a link/social belongs to this creator before mutating.
  const ownsLink = (id: string) =>
    db.query.link.findFirst({
      where: and(eq(link.id, id), eq(link.profileId, profile.id)),
    });

  switch (intent) {
    case "saveProfile": {
      const goalDollars = Number(form.get("goalAmount"));
      await db
        .update(profileTable)
        .set({
          displayName: str("displayName") ?? profile.displayName,
          tagline: str("tagline"),
          bio: str("bio"),
          category: str("category"),
          avatarUrl: str("avatarUrl"),
          coverUrl: str("coverUrl"),
          themeColor: str("themeColor") ?? "primary",
          goalAmountCents: goalDollars > 0 ? Math.round(goalDollars * 100) : null,
          goalLabel: str("goalLabel"),
        })
        .where(eq(profileTable.id, profile.id));
      return { ok: "Profile saved" };
    }

    case "togglePublish": {
      await db
        .update(profileTable)
        .set({ isPublished: !profile.isPublished })
        .where(eq(profileTable.id, profile.id));
      return { ok: profile.isPublished ? "Unpublished" : "Published 🎉" };
    }

    case "addLink": {
      const max = await db.query.link.findMany({
        where: eq(link.profileId, profile.id),
        columns: { sortOrder: true },
      });
      const next = max.reduce((m, l) => Math.max(m, l.sortOrder), -1) + 1;
      await db.insert(link).values({
        profileId: profile.id,
        type: (str("type") as "link" | "header") ?? "link",
        title: str("title") ?? "Untitled",
        url: str("url"),
        sortOrder: next,
      });
      return { ok: "Link added" };
    }

    case "updateLink": {
      const id = String(form.get("id"));
      if (!(await ownsLink(id))) return { error: "Not found" };
      await db
        .update(link)
        .set({ title: str("title") ?? "Untitled", url: str("url") })
        .where(eq(link.id, id));
      return { ok: "Saved" };
    }

    case "toggleLink": {
      const id = String(form.get("id"));
      const row = await ownsLink(id);
      if (!row) return { error: "Not found" };
      await db
        .update(link)
        .set({ isActive: !row.isActive })
        .where(eq(link.id, id));
      return { ok: "Updated" };
    }

    case "deleteLink": {
      const id = String(form.get("id"));
      if (!(await ownsLink(id))) return { error: "Not found" };
      await db.delete(link).where(eq(link.id, id));
      return { ok: "Deleted" };
    }

    case "moveLink": {
      const id = String(form.get("id"));
      const dir = String(form.get("dir"));
      const all = await db.query.link.findMany({
        where: eq(link.profileId, profile.id),
        orderBy: (l, { asc }) => asc(l.sortOrder),
      });
      const i = all.findIndex((l) => l.id === id);
      const j = dir === "up" ? i - 1 : i + 1;
      if (i < 0 || j < 0 || j >= all.length) return { error: "Cannot move" };
      await db
        .update(link)
        .set({ sortOrder: all[j].sortOrder })
        .where(eq(link.id, all[i].id));
      await db
        .update(link)
        .set({ sortOrder: all[i].sortOrder })
        .where(eq(link.id, all[j].id));
      return { ok: "Reordered" };
    }

    case "addSocial": {
      await db.insert(socialLink).values({
        profileId: profile.id,
        platform: str("platform") ?? "website",
        url: str("url") ?? "#",
      });
      return { ok: "Social added" };
    }

    case "deleteSocial": {
      const id = String(form.get("id"));
      await db
        .delete(socialLink)
        .where(and(eq(socialLink.id, id), eq(socialLink.profileId, profile.id)));
      return { ok: "Removed" };
    }

    default:
      return { error: "Unknown action" };
  }
}

export default function EditPage({ loaderData }: Route.ComponentProps) {
  const { profile } = loaderData;
  const nav = useNavigation();
  const saving = nav.state !== "idle";

  return (
    <>
      <PageHeader
        title="My Page"
        subtitle="Customize your public profile."
        action={
          <div className="flex items-center gap-2">
            <ButtonLink to={`/${profile.username}`} target="_blank" variant="outline">
              <ExternalLink className="h-4 w-4" /> Preview
            </ButtonLink>
            <Form method="post">
              <input type="hidden" name="intent" value="togglePublish" />
              <Button type="submit" variant={profile.isPublished ? "ghost" : "primary"}>
                {profile.isPublished ? (
                  <>
                    <EyeOff className="h-4 w-4" /> Unpublish
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" /> Publish
                  </>
                )}
              </Button>
            </Form>
          </div>
        }
      />

      {!profile.isPublished && (
        <div className="mb-6 flex items-center gap-2 rounded-2xl bg-sunny-soft px-4 py-3 text-sm font-medium text-[#946100]">
          <EyeOff className="h-4 w-4" /> Your page is a draft — publish it to go live.
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Profile details */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <Form method="post" className="space-y-4">
              <input type="hidden" name="intent" value="saveProfile" />
              <Field label="Display name">
                <Input name="displayName" defaultValue={profile.displayName} required />
              </Field>
              <Field label="Tagline" hint="A short one-liner under your name">
                <Input
                  name="tagline"
                  defaultValue={profile.tagline ?? ""}
                  placeholder="Content | Creative | Community"
                />
              </Field>
              <Field label="Bio">
                <Textarea
                  name="bio"
                  defaultValue={profile.bio ?? ""}
                  placeholder="Tell supporters about yourself…"
                />
              </Field>
              <Field label="Category">
                <Input
                  name="category"
                  defaultValue={profile.category ?? ""}
                  placeholder="Gaming, Art, Music…"
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Avatar URL">
                  <Input
                    name="avatarUrl"
                    defaultValue={profile.avatarUrl ?? ""}
                    placeholder="https://…"
                  />
                </Field>
                <Field label="Cover URL">
                  <Input
                    name="coverUrl"
                    defaultValue={profile.coverUrl ?? ""}
                    placeholder="https://…"
                  />
                </Field>
              </div>

              <Field label="Accent color">
                <div className="flex flex-wrap gap-2">
                  {THEME_COLORS.map((c) => (
                    <label key={c.id} className="cursor-pointer">
                      <input
                        type="radio"
                        name="themeColor"
                        value={c.id}
                        defaultChecked={(profile.themeColor ?? "primary") === c.id}
                        className="peer sr-only"
                      />
                      <span
                        className="grid h-10 w-10 place-items-center rounded-full ring-2 ring-transparent transition peer-checked:ring-ink"
                        style={{ background: c.swatch }}
                        title={c.label}
                      />
                    </label>
                  ))}
                </div>
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Monthly goal ($)" hint="Leave blank to hide">
                  <Input
                    name="goalAmount"
                    type="number"
                    min={0}
                    defaultValue={
                      profile.goalAmountCents
                        ? profile.goalAmountCents / 100
                        : ""
                    }
                  />
                </Field>
                <Field label="Goal label">
                  <Input
                    name="goalLabel"
                    defaultValue={profile.goalLabel ?? ""}
                    placeholder="Help me hit my goal!"
                  />
                </Field>
              </div>

              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save profile"}
              </Button>
            </Form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Socials */}
          <Card>
            <CardHeader>
              <CardTitle>Social links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {profile.socialLinks.map((s) => {
                const Icon = socialIcon(s.platform);
                return (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 rounded-xl border border-border p-3"
                  >
                    <Icon className="h-5 w-5 text-ink-soft" />
                    <span className="w-20 text-sm font-semibold capitalize text-ink">
                      {s.platform}
                    </span>
                    <span className="flex-1 truncate text-sm text-muted">
                      {s.url}
                    </span>
                    <Form method="post">
                      <input type="hidden" name="intent" value="deleteSocial" />
                      <input type="hidden" name="id" value={s.id} />
                      <button
                        type="submit"
                        aria-label="Remove"
                        className="text-muted hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </Form>
                  </div>
                );
              })}

              <Form method="post" className="flex items-end gap-2">
                <input type="hidden" name="intent" value="addSocial" />
                <Field label="Platform" className="w-32">
                  <select
                    name="platform"
                    className="h-12 w-full rounded-xl border-2 border-border bg-surface px-3 text-sm capitalize text-ink outline-none focus:border-primary"
                  >
                    {SOCIAL_PLATFORMS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="URL" className="flex-1">
                  <Input name="url" placeholder="https://…" required />
                </Field>
                <Button type="submit" variant="soft" size="icon">
                  <Plus className="h-5 w-5" />
                </Button>
              </Form>
            </CardContent>
          </Card>

          {/* Link blocks */}
          <Card>
            <CardHeader>
              <CardTitle>Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {profile.links.length === 0 && (
                <p className="text-sm text-muted">No links yet — add your first below.</p>
              )}

              {profile.links.map((l, i) => (
                <div
                  key={l.id}
                  className={cn(
                    "rounded-2xl border border-border p-3",
                    !l.isActive && "opacity-60",
                  )}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted" />
                    {l.type === "header" ? (
                      <Badge tone="grape">Header</Badge>
                    ) : (
                      <Badge tone="sky">Link</Badge>
                    )}
                    {!l.isActive && <Badge tone="neutral">Hidden</Badge>}
                    <span className="ml-auto flex items-center gap-1">
                      <MoveBtn id={l.id} dir="up" disabled={i === 0} />
                      <MoveBtn id={l.id} dir="down" disabled={i === profile.links.length - 1} />
                      <IntentIcon intent="toggleLink" id={l.id} label="Toggle visibility">
                        {l.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </IntentIcon>
                      <IntentIcon intent="deleteLink" id={l.id} label="Delete" danger>
                        <Trash2 className="h-4 w-4" />
                      </IntentIcon>
                    </span>
                  </div>
                  <Form method="post" className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="intent" value="updateLink" />
                    <input type="hidden" name="id" value={l.id} />
                    <Input
                      name="title"
                      defaultValue={l.title}
                      className="h-10 flex-1"
                      placeholder="Title"
                    />
                    {l.type !== "header" && (
                      <Input
                        name="url"
                        defaultValue={l.url ?? ""}
                        className="h-10 flex-1"
                        placeholder="https://…"
                      />
                    )}
                    <Button type="submit" size="sm" variant="outline">
                      Save
                    </Button>
                  </Form>
                </div>
              ))}

              <div className="grid gap-2 sm:grid-cols-2">
                <Form method="post">
                  <input type="hidden" name="intent" value="addLink" />
                  <input type="hidden" name="type" value="link" />
                  <input type="hidden" name="title" value="New link" />
                  <Button type="submit" variant="soft" className="w-full">
                    <Plus className="h-4 w-4" /> Add link
                  </Button>
                </Form>
                <Form method="post">
                  <input type="hidden" name="intent" value="addLink" />
                  <input type="hidden" name="type" value="header" />
                  <input type="hidden" name="title" value="Section" />
                  <Button type="submit" variant="outline" className="w-full">
                    <Plus className="h-4 w-4" /> Add header
                  </Button>
                </Form>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function MoveBtn({
  id,
  dir,
  disabled,
}: {
  id: string;
  dir: "up" | "down";
  disabled: boolean;
}) {
  return (
    <Form method="post">
      <input type="hidden" name="intent" value="moveLink" />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="dir" value={dir} />
      <button
        type="submit"
        disabled={disabled}
        aria-label={`Move ${dir}`}
        className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-ink/5 hover:text-ink disabled:opacity-30"
      >
        {dir === "up" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
      </button>
    </Form>
  );
}

function IntentIcon({
  intent,
  id,
  label,
  danger,
  children,
}: {
  intent: string;
  id: string;
  label: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Form method="post">
      <input type="hidden" name="intent" value={intent} />
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        aria-label={label}
        className={cn(
          "grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-ink/5",
          danger ? "hover:text-danger" : "hover:text-ink",
        )}
      >
        {children}
      </button>
    </Form>
  );
}
