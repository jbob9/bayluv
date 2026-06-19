import type { Route } from "./+types/api.auth.$";
import { auth } from "~/lib/auth.server";

// better-auth handles all /api/auth/* requests (sign-in, sign-up, callbacks, …)
export async function loader({ request }: Route.LoaderArgs) {
  return auth.handler(request);
}

export async function action({ request }: Route.ActionArgs) {
  return auth.handler(request);
}
