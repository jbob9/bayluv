import { useEffect, useState } from "react";
import {
  Form,
  NavLink,
  Outlet,
  useRouteLoaderData,
} from "react-router";
import {
  LayoutDashboard,
  SquarePen,
  Crown,
  ShoppingBag,
  Heart,
  Wallet,
  Settings,
  ExternalLink,
  Menu,
  X,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import type { Route } from "./+types/layout";
import { requireProfile } from "~/lib/session.server";
import { Logo } from "~/components/brand/logo";
import { Avatar } from "~/components/ui/avatar";
import { cn } from "~/lib/utils";

export async function loader({ request }: Route.LoaderArgs) {
  const { user, profile } = await requireProfile(request);
  return {
    user: { name: user.name, image: user.image },
    profile: {
      username: profile.username,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      isPublished: profile.isPublished,
    },
  };
}

const nav = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/dashboard/page", label: "My Page", icon: SquarePen },
  { to: "/dashboard/tiers", label: "Memberships", icon: Crown },
  { to: "/dashboard/products", label: "Shop", icon: ShoppingBag },
  { to: "/dashboard/supporters", label: "Supporters", icon: Heart },
  { to: "/dashboard/payouts", label: "Payouts", icon: Wallet },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

const STORAGE_KEY = "bayluv:sidebar-collapsed";

export default function DashboardLayout({ loaderData }: Route.ComponentProps) {
  const { profile, user } = loaderData;
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Restore + persist the collapsed preference (client-only to avoid SSR mismatch).
  useEffect(() => {
    setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);
  const toggleCollapsed = () =>
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });

  // `mini` = icon-only rail (desktop collapsed). Mobile drawer is always full.
  const renderSidebar = (mini: boolean) => (
    <div className="flex h-full flex-col gap-2">
      <div
        className={cn(
          "flex items-center px-3 py-4",
          mini ? "justify-center" : "justify-between",
        )}
      >
        <Logo compact={mini} />
        {!mini && (
          <button
            onClick={toggleCollapsed}
            aria-label="Collapse sidebar"
            className="hidden h-8 w-8 place-items-center rounded-lg text-muted hover:bg-ink/5 hover:text-ink lg:grid"
          >
            <PanelLeftClose className="h-5 w-5" />
          </button>
        )}
      </div>

      {mini && (
        <button
          onClick={toggleCollapsed}
          aria-label="Expand sidebar"
          className="mx-auto grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-ink/5 hover:text-ink"
        >
          <PanelLeftOpen className="h-5 w-5" />
        </button>
      )}

      <nav className="flex-1 space-y-1 px-3">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setOpen(false)}
            title={mini ? label : undefined}
            className={({ isActive }) =>
              cn(
                "flex items-center rounded-xl text-[15px] font-semibold transition-colors",
                mini ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5",
                isActive
                  ? "bg-primary-100 text-primary-700"
                  : "text-ink-soft hover:bg-ink/5 hover:text-ink",
              )
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            {!mini && label}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-1 border-t border-border p-3">
        <a
          href={`/${profile.username}`}
          target="_blank"
          rel="noreferrer"
          title={mini ? "View my page" : undefined}
          className={cn(
            "flex items-center rounded-xl text-[15px] font-semibold text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink",
            mini ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5",
          )}
        >
          <ExternalLink className="h-5 w-5 shrink-0" />
          {!mini && "View my page"}
        </a>
        <div
          className={cn(
            "flex items-center rounded-xl",
            mini ? "flex-col gap-2 py-2" : "gap-3 px-3 py-2.5",
          )}
        >
          <Avatar
            src={profile.avatarUrl ?? user.image}
            name={profile.displayName}
            size="sm"
          />
          {!mini && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">
                {profile.displayName}
              </p>
              <p className="truncate text-xs text-muted">
                bayluv.com/{profile.username}
              </p>
            </div>
          )}
          <Form method="post" action="/logout">
            <button
              type="submit"
              aria-label="Log out"
              className="grid h-9 w-9 place-items-center rounded-lg text-muted transition-colors hover:bg-ink/5 hover:text-danger"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </Form>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={cn(
        "min-h-screen lg:grid",
        collapsed ? "lg:grid-cols-[4.75rem_1fr]" : "lg:grid-cols-[16rem_1fr]",
      )}
    >
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen border-r border-border bg-paper lg:block">
        {renderSidebar(collapsed)}
      </aside>

      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-border bg-paper px-4 py-3 lg:hidden">
        <Logo />
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="grid h-10 w-10 place-items-center rounded-xl hover:bg-ink/5"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 bg-paper shadow-card">
            <button
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-4 grid h-9 w-9 place-items-center rounded-lg hover:bg-ink/5"
            >
              <X className="h-5 w-5" />
            </button>
            {renderSidebar(false)}
          </div>
        </div>
      )}

      <main className="min-w-0 px-5 py-8 sm:px-8">
        <Outlet />
      </main>
    </div>
  );
}

/** Helper for child routes to read the dashboard profile. */
export function useDashboardData() {
  return useRouteLoaderData<typeof loader>("routes/dashboard/layout")!;
}
