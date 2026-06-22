import { NavLink, Outlet } from "react-router";
import { LayoutDashboard, PackageSearch, ArrowLeft } from "lucide-react";
import type { Route } from "./+types/layout";
import { requireAdmin } from "~/lib/session.server";
import { Logo } from "~/components/brand/logo";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  return null;
}

const nav = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/affiliate-products", label: "Affiliate catalog", icon: PackageSearch },
];

export default function AdminLayout() {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-border bg-ink lg:flex">
        <div className="flex items-center gap-2 px-4 py-4">
          <Logo className="text-white" />
          <Badge tone="sunny">Admin</Badge>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-semibold transition-colors",
                  isActive
                    ? "bg-white/15 text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white",
                )
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3">
          <a
            href="/dashboard"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" /> Back to dashboard
          </a>
        </div>
      </aside>

      {/* Mobile bar */}
      <div className="flex items-center justify-between border-b border-border bg-ink px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <Logo className="text-white" />
          <Badge tone="sunny">Admin</Badge>
        </div>
        <a href="/dashboard" className="text-sm font-semibold text-white/80">
          Dashboard
        </a>
      </div>

      <main className="min-w-0 px-5 py-8 sm:px-8">
        <Outlet />
      </main>
    </div>
  );
}
