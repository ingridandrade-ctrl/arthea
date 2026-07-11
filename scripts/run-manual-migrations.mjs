// Aplica migrations em prisma/migrations-manual/*.sql em ordem alfabética.
// Usa a tabela _arthea_migrations pra registrar quais já rodaram. Cada
// migration roda no máximo uma vez por banco.
//
// Usa o driver `pg` (protocolo simples) em vez do Prisma Client: o Prisma
// executa raw SQL via prepared statement, que NÃO aceita múltiplos comandos
// num arquivo ("cannot insert multiple commands into a prepared statement").
// O pg.query() roda o arquivo inteiro de uma vez, como o psql faria.

import pg from "pg";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const DIR = "prisma/migrations-manual";

// Baseline: migrations aplicadas MANUALMENTE (via Neon SQL Editor) antes do
// runner existir. São marcadas como aplicadas em qualquer banco, sempre —
// senão o runner tenta reexecutá-las e quebra em "already exists".
// Arquivos NOVOS (fora desta lista) rodam normalmente.
const BASELINE = [
  "2026-05-08_add_client_portal.sql",
  "2026-05-12_engagement_dossier_refactor.sql",
  "2026-05-12_engagement_internal_data.sql",
  "2026-05-13_deliverable_kind.sql",
  "2026-05-16_scenes_module.sql",
  "2026-06-12_google_ads_module.sql",
  "2026-06-15_client_links_and_service_template.sql",
  "2026-06-15_deliverable_section.sql",
  "2026-06-15_service_deliverable_templates.sql",
  "2026-06-27_lead_source_string.sql",
  "2026-06-27_lead_status_string.sql",
  "2026-07-06_business_type_and_insights.sql",
  "2026-07-07_dashboard_config_platforms.sql",
];

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("localhost")
    ? undefined
    : { rejectUnauthorized: false },
});

async function main() {
  await client.connect();

  const existed = await client.query(
    `SELECT to_regclass('"_arthea_migrations"')::text AS reg`,
  );
  const tableAlreadyExisted = existed.rows[0]?.reg !== null && existed.rows[0]?.reg !== undefined;

  await client.query(`
    CREATE TABLE IF NOT EXISTS "_arthea_migrations" (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Auto-cura: garante a baseline marcada neste banco, seja ele qual for.
  for (const f of BASELINE) {
    await client.query(
      `INSERT INTO "_arthea_migrations" (name) VALUES ($1) ON CONFLICT DO NOTHING`,
      [f],
    );
  }

  const files = readdirSync(DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  // Primeira execução: marca tudo que existe agora como já aplicado, sem
  // rodar. Assume que o banco está em sincronia (as migrations antigas
  // foram rodadas manualmente no passado).
  if (!tableAlreadyExisted) {
    for (const f of files) {
      await client.query(
        `INSERT INTO "_arthea_migrations" (name) VALUES ($1) ON CONFLICT DO NOTHING`,
        [f],
      );
    }
    console.log(`[migrations] bootstrap — ${files.length} arquivos existentes marcados como aplicados (não executados)`);
    return;
  }

  const applied = await client.query(`SELECT name FROM "_arthea_migrations"`);
  const appliedSet = new Set(applied.rows.map((r) => r.name));

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
      // Uma transação por arquivo: ou aplica inteiro, ou nada.
      await client.query("BEGIN");
      await client.query(sql);
      await client.query(
        `INSERT INTO "_arthea_migrations" (name) VALUES ($1)`,
        [f],
      );
      await client.query("COMMIT");
      ran++;
    } catch (err) {
      await client.query("ROLLBACK").catch(() => {});
      console.error(`[migrations] failed on ${f}:`, err.message);
      throw err;
    }
  }

  console.log(`[migrations] done — ${ran} applied, ${skipped} skipped`);
}

main()
  .then(() => client.end().then(() => process.exit(0)))
  .catch(async (err) => {
    console.error(err);
    await client.end().catch(() => {});
    process.exit(1);
  });
