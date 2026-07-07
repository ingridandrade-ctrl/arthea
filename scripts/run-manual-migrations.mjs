// Aplica migrations em prisma/migrations-manual/*.sql em ordem alfabética.
// Usa a tabela _arthea_migrations pra registrar quais já rodaram. Cada
// migration roda no máximo uma vez por banco.
//
// Por que via Prisma Client (e não db execute)?
// - db execute não retorna linhas, então não dá pra ler a tabela de
//   controle pra decidir se aplica.
// - Algumas migrations têm CREATE TYPE que não roda dentro de DO blocks.

import { PrismaClient } from "@prisma/client";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const DIR = "prisma/migrations-manual";
const prisma = new PrismaClient();

async function main() {
  const existed = await prisma.$queryRawUnsafe(
    `SELECT to_regclass('"_arthea_migrations"')::text AS reg`,
  );
  const tableAlreadyExisted = existed[0]?.reg !== null && existed[0]?.reg !== undefined;

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "_arthea_migrations" (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  const files = readdirSync(DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  // Primeira execução: marca tudo que existe agora como já aplicado, sem
  // rodar. Assume que o banco está em sincronia (as migrations antigas
  // foram rodadas manualmente no passado).
  if (!tableAlreadyExisted) {
    for (const f of files) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "_arthea_migrations" (name) VALUES ($1) ON CONFLICT DO NOTHING`,
        f,
      );
    }
    console.log(`[migrations] bootstrap — ${files.length} arquivos existentes marcados como aplicados (não executados)`);
    return;
  }

  const applied = await prisma.$queryRawUnsafe(
    `SELECT name FROM "_arthea_migrations"`,
  );
  const appliedSet = new Set(applied.map((r) => r.name));

  let ran = 0;
  let skipped = 0;

  for (const f of files) {
    if (appliedSet.has(f)) {
      console.log(`[migrations] skip ${f} (already applied)`);
      skipped++;
      continue;
    }
    const path = join(DIR, f);
    const sql = readFileSync(path, "utf8");
    console.log(`[migrations] applying ${f}...`);
    try {
      await prisma.$executeRawUnsafe(sql);
      await prisma.$executeRawUnsafe(
        `INSERT INTO "_arthea_migrations" (name) VALUES ($1)`,
        f,
      );
      ran++;
    } catch (err) {
      console.error(`[migrations] failed on ${f}:`, err.message);
      throw err;
    }
  }

  console.log(`[migrations] done — ${ran} applied, ${skipped} skipped`);
}

main()
  .then(() => prisma.$disconnect().then(() => process.exit(0)))
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
