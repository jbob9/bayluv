import { useState } from "react";
import { Link, redirect, useNavigate, useSearchParams } from "react-router";
import type { Route } from "./+types/login";
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
  return [{ title: "Log in · bayluv" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getOptionalUser(request);
  if (user) throw redirect("/dashboard");
  const providers: string[] = [];
  if (env.GOOGLE_CLIENT_ID) providers.push("google");
  if (env.GITHUB_CLIENT_ID) providers.push("github");
  return { providers };
}

export default function Login({ loaderData }: Route.ComponentProps) {
  const { providers } = loaderData;
  const navigate = useNavigate();
  const { toast } = useToast();
  const [params] = useSearchParams();
  const redirectTo = params.get("redirect") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [magic, setMagic] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    if (magic) {
      const { error } = await authClient.signIn.magicLink({
        email,
        callbackURL: redirectTo,
      });
      setLoading(false);
      if (error) return toast({ tone: "error", title: error.message ?? "Could not send link" });
      return toast({
        tone: "success",
        title: "Check your inbox",
        description: "We sent you a magic sign-in link.",
      });
    }

    const { error } = await authClient.signIn.email({ email, password });
    setLoading(false);
    if (error) return toast({ tone: "error", title: error.message ?? "Login failed" });
    navigate(redirectTo);
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to your bayluv page.">
      <SocialButtons providers={providers} callbackURL={redirectTo} />
      {providers.length > 0 && <OrDivider />}

      <form onSubmit={onSubmit} className="space-y-4">
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

        {!magic && (
          <Field label="Password">
            <Input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </Field>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Please wait…" : magic ? "Email me a link" : "Log in"}
        </Button>

        <button
          type="button"
          onClick={() => setMagic((m) => !m)}
          className="w-full text-center text-sm font-semibold text-primary hover:underline"
        >
          {magic ? "Use password instead" : "Email me a magic link instead"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-ink-soft">
        New to bayluv?{" "}
        <Link to="/signup" className="font-semibold text-primary hover:underline">
          Create your page
        </Link>
      </p>
    </AuthLayout>
  );
}
