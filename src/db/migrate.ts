import { runMigrations } from "./run-migrations";

/**
 * CLI entry: `npm run db:migrate` (after `npm run db:generate`).
 * Applies migrations to the target database. Idempotent.
 */
runMigrations()
  .then(() => {
    console.log("✓ migrations applied");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
