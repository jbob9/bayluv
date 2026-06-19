import { Form } from "react-router";
import { LogOut } from "lucide-react";
import { PageHeader } from "~/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { useDashboardData } from "./layout";

export function meta() {
  return [{ title: "Settings · bayluv" }];
}

export default function Settings() {
  const { profile, user } = useDashboardData();
  return (
    <>
      <PageHeader title="Settings" subtitle="Manage your account." />

      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <Row label="Name" value={user.name} />
            <Row label="Username" value={`bayluv.com/${profile.username}`} />
            <Row
              label="Status"
              value={profile.isPublished ? "Published" : "Draft"}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Session</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <Form method="post" action="/logout">
              <Button type="submit" variant="outline">
                <LogOut className="h-4 w-4" /> Log out
              </Button>
            </Form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
      <span className="text-sm font-semibold text-muted">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}
