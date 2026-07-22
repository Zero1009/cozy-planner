import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { eq } from "drizzle-orm";
import { mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { users } from "../src/db/schema";
import { hashPassword } from "../src/lib/auth";

export const E2E_DB_PATH = resolve(".e2e/cozy-e2e.db");
export const E2E_DB_URL = `file:${E2E_DB_PATH}`;
export const E2E_AUTH_SECRET = "test-auth-secret";
export const E2E_USERNAME = "trk";
export const E2E_PASSWORD = "AdminPass-2026";

async function main() {
  await mkdir(dirname(E2E_DB_PATH), { recursive: true });
  await rm(E2E_DB_PATH, { force: true });

  const client = createClient({ url: E2E_DB_URL });
  const db = drizzle(client);
  await migrate(db, { migrationsFolder: "./drizzle" });

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.username, E2E_USERNAME)).limit(1);
  if (!existing) {
    await db.insert(users).values({
      username: E2E_USERNAME,
      displayName: "TRK E2E",
      passwordHash: await hashPassword(E2E_PASSWORD),
      isAdmin: true,
      mustUpdateProfile: false,
    });
  }

  client.close();
  console.log(`✓ E2E database ready at ${E2E_DB_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
