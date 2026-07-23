import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

/**
 * Applies generated migrations from ./drizzle to the configured database.
 * Idempotent — safe to run repeatedly. Side-effect free on import so it can be
 * reused by the CLI (`db:migrate`) and the Vercel build step.
 */
export async function runMigrations(): Promise<void> {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL ?? "file:local.db",
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  const db = drizzle(client);
  await migrate(db, { migrationsFolder: "./drizzle" });
  client.close();
}
