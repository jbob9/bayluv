import {
  type RouteConfig,
  index,
  route,
  layout,
  prefix,
} from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),

  // Auth
  route("login", "routes/login.tsx"),
  route("signup", "routes/signup.tsx"),
  route("logout", "routes/logout.tsx"),

  // Post-signup onboarding (claim username)
  route("onboarding", "routes/onboarding.tsx"),

  // Creator dashboard (auth-guarded)
  ...prefix("dashboard", [
    layout("routes/dashboard/layout.tsx", [
      index("routes/dashboard/index.tsx"),
      route("page", "routes/dashboard/page.tsx"),
      route("posts", "routes/dashboard/posts.tsx"),
      route("tiers", "routes/dashboard/tiers.tsx"),
      route("products", "routes/dashboard/products.tsx"),
      route("supporters", "routes/dashboard/supporters.tsx"),
      route("broadcasts", "routes/dashboard/broadcasts.tsx"),
      route("analytics", "routes/dashboard/analytics.tsx"),
      route("payouts", "routes/dashboard/payouts.tsx"),
      route("settings", "routes/dashboard/settings.tsx"),
    ]),
  ]),

  // API
  route("api/auth/*", "routes/api.auth.$.tsx"),
  route("api/checkout/tip", "routes/api.checkout.tip.tsx"),
  route("api/checkout/subscription", "routes/api.checkout.subscription.tsx"),
  route("api/checkout/product", "routes/api.checkout.product.tsx"),
  route("api/webhooks/stripe", "routes/api.webhooks.stripe.tsx"),

  // Admin (affiliate catalog) — guarded by requireAdmin
  ...prefix("admin", [
    layout("routes/admin/layout.tsx", [
      index("routes/admin/index.tsx"),
      route("affiliate-products", "routes/admin/affiliate-products.tsx"),
    ]),
  ]),

  // Supporter account (manage memberships)
  route("account", "routes/account.tsx"),

  // Affiliate outbound redirect (injects the creator's tag + counts clicks)
  route("a/:selectionId", "routes/a.$selectionId.tsx"),

  // Post-purchase download / access page
  route("d/:orderId", "routes/d.$orderId.tsx"),

  // Link-in-bio click tracker (increments then redirects)
  route("l/:linkId", "routes/l.$linkId.tsx"),

  // Dev
  route("dev/styleguide", "routes/dev.styleguide.tsx"),

  // Public creator page — keep LAST so static routes take precedence
  route(":username", "routes/$username.tsx"),
] satisfies RouteConfig;
