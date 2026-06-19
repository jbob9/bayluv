import { useState } from "react";
import { Link, redirect, useNavigate } from "react-router";
import type { Route } from "./+types/signup";
import { getOptionalUser } from "~/lib/session.server";
import { env } from "~/lib/env.server";
import { authClient } from "~/lib/auth-client";
import { AuthLayout } from "~/components/auth/auth-layout";
import { SocialButtons, OrDivider } from "~/components/auth/social-buttons";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Field } from "~/components/ui/label";
import { useToast } from "~/components/ui/toast";

export function meta() {
  return [{ title: "Create your page · bayluv" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getOptionalUser(request);
  if (user) throw redirect("/dashboard");
  const providers: string[] = [];
  if (env.GOOGLE_CLIENT_ID) providers.push("google");
  if (env.GITHUB_CLIENT_ID) providers.push("github");
  return { providers };
}

export default function Signup({ loaderData }: Route.ComponentProps) {
  const { providers } = loaderData;
  const navigate = useNavigate();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await authClient.signUp.email({ name, email, password });
    setLoading(false);
    if (error) return toast({ tone: "error", title: error.message ?? "Sign up failed" });
    // New users go to onboarding to claim their username.
    navigate("/onboarding");
  }

  return (
    <AuthLayout
      title="Start your page"
      subtitle="It's free and takes less than a minute."
    >
      <SocialButtons providers={providers} callbackURL="/onboarding" />
      {providers.length > 0 && <OrDivider />}

      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Name">
          <Input
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Peter Webby"
          />
        </Field>
        <Field label="Email">
          <Input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </Field>
        <Field label="Password" hint="At least 8 characters">
          <Input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </Field>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating…" : "Create my page"}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-ink-soft">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
