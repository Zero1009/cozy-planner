import { rm } from "node:fs/promises";
import { resolve } from "node:path";

async function main() {
  const dir = resolve(".e2e");
  await rm(dir, { recursive: true, force: true });
  console.log(`✓ removed E2E artifacts at ${dir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
