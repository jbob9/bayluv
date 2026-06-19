import { drizzle } from "drizzle-orm/libsql";
import { env } from "~/lib/env.server";
import * as schema from "./schemas/index.server";

const db = drizzle({
  connection: {
    url: env.DATABASE_URL,
    authToken: env.DATABASE_AUTH_TOKEN,
  },
  schema,
});

export { db, schema };
