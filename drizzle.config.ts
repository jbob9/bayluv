import type { Config } from "drizzle-kit";

export default {
  schema: "./app/db/schema/index.server",
  out: "./app/db/migrations",
  dialect: "turso",
  verbose: true,
  strict: true,
  dbCredentials: {
    url: process.env.DATABASE_URL || "",
    // authToken: process.env.DATABASE_AUTH_TOKEN! || "",
  },
} satisfies Config;
