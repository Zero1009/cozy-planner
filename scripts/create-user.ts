import { eq } from "drizzle-orm";
import { db, schema } from "../src/db/client";
import { hashPassword } from "../src/lib/auth";

function usage(): never {
  console.error(
    "Usage: npm run user:create -- <username> <password> [display name] [--admin]\n" +
      "Example: npm run user:create -- trk 'strong-password' 'TRK' --admin"
  );
  process.exit(1);
}

async function main() {
  const args = process.argv.slice(2);
  const adminIndex = args.indexOf("--admin");
  const isAdmin = adminIndex !== -1;
  if (isAdmin) args.splice(adminIndex, 1);

  const [rawUsername, password, displayNameArg] = args;
  if (!rawUsername || !password) usage();

  const username = rawUsername.trim().toLowerCase();
  const displayName = displayNameArg?.trim() || username;
  if (!username) usage();

  const [existing] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.username, username))
    .limit(1);

  if (existing) {
    throw new Error(`User "${username}" already exists`);
  }

  await db.insert(schema.users).values({
    username,
    displayName,
    passwordHash: await hashPassword(password),
    isAdmin,
    mustUpdateProfile: !isAdmin,
  });

  console.log(`✓ created user ${username}${isAdmin ? " (admin)" : ""}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
