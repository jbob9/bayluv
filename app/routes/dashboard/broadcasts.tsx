import { Form, useNavigation } from "react-router";
import { and, desc, eq } from "drizzle-orm";
import { Megaphone, Send, Users } from "lucide-react";
import type { Route } from "./+types/broadcasts";
import { requireProfile } from "~/lib/session.server";
import { db } from "~/db/index.server";
import { support } from "~/db/schemas/payments";
import { order } from "~/db/schemas/shop";
import { membership } from "~/db/schemas/membership";
import { broadcast } from "~/db/schemas/broadcast";
import { sendEmail } from "~/lib/email.server";
import { useActionToast } from "~/lib/use-action-toast";
import { PageHeader } from "~/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Field } from "~/components/ui/label";

export function meta() {
  return [{ title: "Broadcasts · bayluv" }];
}

/** Distinct supporter emails across tips, orders, and active memberships. */
async function collectEmails(profileId: string): Promise<string[]> {
  const [tips, orders, members] = await Promise.all([
    db.query.support.findMany({
      where: and(eq(support.profileId, profileId), eq(support.status, "paid")),
      columns: { supporterEmail: true },
    }),
    db.query.order.findMany({
      where: and(eq(order.profileId, profileId), eq(order.status, "paid")),
      columns: { buyerEmail: true },
    }),
    db.query.membership.findMany({
      where: and(
        eq(membership.profileId, profileId),
        eq(membership.status, "active"),
      ),
      with: { supporter: { columns: { email: true } } },
    }),
  ]);
  const emails = new Set<string>();
  tips.forEach((t) => t.supporterEmail && emails.add(t.supporterEmail));
  orders.forEach((o) => o.buyerEmail && emails.add(o.buyerEmail));
  members.forEach((m) => m.supporter?.email && emails.add(m.supporter.email));
  return [...emails];
}

export async function loader({ request }: Route.LoaderArgs) {
  const { profile } = await requireProfile(request);
  const [emails, past] = await Promise.all([
    collectEmails(profile.id),
    db.query.broadcast.findMany({
      where: eq(broadcast.profileId, profile.id),
      orderBy: desc(broadcast.createdAt),
      limit: 20,
    }),
  ]);
  return { recipientCount: emails.length, past };
}

export async function action({ request }: Route.ActionArgs) {
  const { profile } = await requireProfile(request);
  const form = await request.formData();
  const subject = String(form.get("subject") ?? "").trim();
  const body = String(form.get("body") ?? "").trim();
  if (!subject || !body) return { error: "Subject and message are required." };

  const emails = await collectEmails(profile.id);
  if (emails.length === 0) {
    return { error: "You don't have any supporter emails yet." };
  }

  const html = `<div style="font-family:sans-serif;line-height:1.6">${body
    .split("\n")
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("")}<hr/><p style="color:#888;font-size:12px">Sent via bayluv by ${escapeHtml(
    profile.displayName,
  )}.</p></div>`;

  // Sequential send (fine for the stub / modest lists).
  for (const to of emails) {
    await sendEmail({ to, subject, html });
  }

  await db.insert(broadcast).values({
    profileId: profile.id,
    subject,
    body,
    recipientCount: emails.length,
  });

  return { ok: `Sent to ${emails.length} supporter${emails.length === 1 ? "" : "s"} 📣` };
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export default function Broadcasts({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { recipientCount, past } = loaderData;
  const nav = useNavigation();
  const busy = nav.state !== "idle";
  useActionToast(actionData);

  return (
    <>
      <PageHeader
        title="Broadcasts"
        subtitle="Email an update to everyone who supports you."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" /> New broadcast
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center gap-2 rounded-2xl bg-ink/3 px-4 py-3 text-sm font-medium text-ink-soft">
              <Users className="h-4 w-4" />
              Reaching{" "}
              <span className="font-bold text-ink">{recipientCount}</span>{" "}
              supporter{recipientCount === 1 ? "" : "s"}
            </div>
            <Form method="post" className="space-y-4">
              <Field label="Subject">
                <Input name="subject" placeholder="A new update for you" required />
              </Field>
              <Field label="Message">
                <Textarea
                  name="body"
                  className="min-h-40"
                  placeholder="Write your update…"
                  required
                />
              </Field>
              <Button type="submit" disabled={busy || recipientCount === 0}>
                <Send className="h-4 w-4" />
                {busy ? "Sending…" : "Send broadcast"}
              </Button>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sent</CardTitle>
          </CardHeader>
          <CardContent>
            {past.length === 0 ? (
              <p className="text-sm text-muted">No broadcasts yet.</p>
            ) : (
              <ul className="space-y-3">
                {past.map((b) => (
                  <li key={b.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
                    <p className="font-semibold text-ink">{b.subject}</p>
                    <p className="text-xs text-muted">
                      {new Date(b.createdAt).toLocaleDateString()} ·{" "}
                      {b.recipientCount} recipients
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
