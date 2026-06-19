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
      route("tiers", "routes/dashboard/tiers.tsx"),
      route("products", "routes/dashboard/products.tsx"),
      route("supporters", "routes/dashboard/supporters.tsx"),
      route("payouts", "routes/dashboard/payouts.tsx"),
      route("settings", "routes/dashboard/settings.tsx"),
    ]),
  ]),

  // API
  route("api/auth/*", "routes/api.auth.$.tsx"),
  route("api/checkout/tip", "routes/api.checkout.tip.tsx"),
  route("api/webhooks/stripe", "routes/api.webhooks.stripe.tsx"),

  // Link-in-bio click tracker (increments then redirects)
  route("l/:linkId", "routes/l.$linkId.tsx"),

  // Dev
  route("dev/styleguide", "routes/dev.styleguide.tsx"),

  // Public creator page — keep LAST so static routes take precedence
  route(":username", "routes/$username.tsx"),
] satisfies RouteConfig;
