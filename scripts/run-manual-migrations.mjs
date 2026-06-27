// Aplica todos os .sql em prisma/migrations-manual/ em ordem alfabética,
// um por um, via `npx prisma db execute`. As migrations devem ser
// idempotentes (no-op se já aplicadas).
import { execSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const DIR = "prisma/migrations-manual";

const files = readdirSync(DIR)
  .filter((f) => f.endsWith(".sql"))
  .sort();

for (const f of files) {
  const path = join(DIR, f);
  console.log(`[migrations] applying ${path}...`);
  try {
    execSync(
      `npx prisma db execute --file ${path} --schema prisma/schema.prisma`,
      { stdio: "inherit" },
    );
  } catch (err) {
    console.error(`[migrations] failed on ${path}`);
    process.exit(1);
  }
}

console.log(`[migrations] done (${files.length} files)`);
