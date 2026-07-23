import { runMigrations } from "../src/db/run-migrations";

/**
 * Runs during Vercel's `vercel-build`, before `next build`. Applies pending
 * migrations to the database automatically — but only on PRODUCTION deploys.
 *
 * Preview deploys and local/CI builds skip it (VERCEL_ENV !== "production"),
 * so a not-yet-merged branch never mutates the production schema, and
 * `npm run build` locally/in CI stays offline.
 */
async function main() {
  const env = process.env.VERCEL_ENV;
  if (env !== "production") {
    console.log(`↷ skipping auto-migration (VERCEL_ENV=${env ?? "unset"})`);
    return;
  }
  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
    throw new Error(
      "Production build: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be available at build time to run migrations."
    );
  }
  await runMigrations();
  console.log("✓ production migrations applied");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
