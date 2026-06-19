import { redirect } from "react-router";
import type { Route } from "./+types/logout";
import { auth } from "~/lib/auth.server";

// POST /logout — clears the session cookie and returns to home.
export async function action({ request }: Route.ActionArgs) {
  const res = await auth.api.signOut({
    headers: request.headers,
    asResponse: true,
  });
  return redirect("/", { headers: res.headers });
}

// Visiting /logout directly just goes home.
export async function loader() {
  return redirect("/");
}
