import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

/**
 * Applies generated migrations from ./drizzle. Run with `npm run db:migrate`
 * after `npm run db:generate`. Safe to run repeatedly (idempotent).
 */
async function main() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL ?? "file:local.db",
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  const db = drizzle(client);
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("✓ migrations applied");
  client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
