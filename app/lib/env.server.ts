import { z } from "zod";

/**
 * Server-side environment validation. Anything required to boot is `required`;
 * integrations we can stub in dev (Stripe / Resend / R2) are optional so the app
 * still runs locally before those keys exist.
 */
const schema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // Database (libSQL / Turso). Local dev can use `file:./local.db`.
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DATABASE_AUTH_TOKEN: z.string().optional(),

  // Auth
  BETTER_AUTH_SECRET: z.string().min(1, "BETTER_AUTH_SECRET is required"),
  BETTER_AUTH_URL: z.string().url().default("http://localhost:5173"),

  // Social login (optional — providers only register when both keys are present)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),

  // Stripe (optional in dev until configured)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  PLATFORM_FEE_PERCENT: z.coerce.number().min(0).max(100).default(5),

  // Email (optional — falls back to console logging in dev)
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("bayluv <onboarding@resend.dev>"),

  // Storage (optional — falls back to local disk in dev)
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  R2_PUBLIC_URL: z.string().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "❌ Invalid environment variables:",
    z.flattenError(parsed.error).fieldErrors,
  );
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;

export const isProd = env.NODE_ENV === "production";
export const hasStripe = Boolean(env.STRIPE_SECRET_KEY);
export const hasResend = Boolean(env.RESEND_API_KEY);
export const hasR2 = Boolean(
  env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY,
);
