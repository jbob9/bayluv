import { useEffect, useRef } from "react";
import { useToast } from "~/components/ui/toast";

type ActionResult = { ok?: string; error?: string } | undefined | null;

/**
 * Surfaces a toast whenever a route action returns `{ ok }` or `{ error }`.
 * Pass the route's `actionData`; fires once per distinct result.
 */
export function useActionToast(actionData: ActionResult) {
  const { toast } = useToast();
  const last = useRef<ActionResult>(null);

  useEffect(() => {
    if (!actionData || actionData === last.current) return;
    last.current = actionData;
    if (actionData.ok) toast({ tone: "success", title: actionData.ok });
    else if (actionData.error) toast({ tone: "error", title: actionData.error });
  }, [actionData, toast]);
}
