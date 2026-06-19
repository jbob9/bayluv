import type { Config } from "drizzle-kit";

export default {
  schema: "./app/db/schemas/index.server.ts",
  out: "./app/db/migrations",
  dialect: "turso",
  verbose: true,
  strict: true,
  dbCredentials: {
    url: process.env.DATABASE_URL || "file:./local.db",
    authToken: process.env.DATABASE_AUTH_TOKEN,
  },
} satisfies Config;
