// One-off: normaliza Lead.phone existentes pro formato `5511999991234`.
// Casos:
//  - "5511999991234"           → mantém (12+ dígitos, começa com 55)
//  - "+55 11 99999-1234"       → "5511999991234"
//  - "(11) 99999-1234"         → "5511999991234" (10–11 dígitos → prepend "55")
//  - "meta:abc123"             → mantém (sentinel da Lead Ads sem telefone)
//  - "manual-1234567890"       → mantém (sentinel)
//
// Colisão (dois leads que normalizam pro mesmo número): NÃO mescla — só
// loga pra revisão humana. Mesclar implica decidir quem fica e mover
// conversation/leadService/etc; melhor decisão manual.
//
// Uso: node scripts/normalize-lead-phones.mjs
//      node scripts/normalize-lead-phones.mjs --apply   (executa de verdade)
//
// Sem --apply roda em dry-run, listando o que seria feito.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");

function normalize(phone) {
  if (!phone) return "";
  // Mantém sentinels intactos (não-numéricos no começo).
  if (/^[a-z]+[:-]/i.test(phone)) return phone;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return phone;
  if (digits.length === 10 || digits.length === 11) return "55" + digits;
  return digits;
}

async function main() {
  const leads = await prisma.lead.findMany({
    select: { id: true, phone: true, name: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const changes = [];
  const byNormalized = new Map();

  for (const l of leads) {
    const norm = normalize(l.phone);
    if (norm !== l.phone) changes.push({ id: l.id, name: l.name, from: l.phone, to: norm });

    if (!byNormalized.has(norm)) byNormalized.set(norm, []);
    byNormalized.get(norm).push(l);
  }

  const collisions = [...byNormalized.entries()].filter(([, arr]) => arr.length > 1);

  console.log(`Leads total: ${leads.length}`);
  console.log(`Mudanças propostas: ${changes.length}`);
  console.log(`Colisões (mesmo número normalizado em N leads): ${collisions.length}`);

  if (collisions.length > 0) {
    console.log("\n=== COLISÕES (revisão manual recomendada) ===");
    for (const [norm, arr] of collisions) {
      console.log(`\n  → ${norm}`);
      for (const l of arr) {
        console.log(`     ${l.createdAt.toISOString()}  ${l.id}  ${l.name}  (${l.phone})`);
      }
    }
  }

  if (!APPLY) {
    console.log("\n(dry-run — passe --apply pra executar)");
    return;
  }

  // Aplica só os leads que NÃO estão em colisão.
  const collidingIds = new Set(collisions.flatMap(([, arr]) => arr.map((l) => l.id)));
  const safeChanges = changes.filter((c) => !collidingIds.has(c.id));

  console.log(`\nAplicando ${safeChanges.length} mudanças (${changes.length - safeChanges.length} puladas por colisão)...`);

  let applied = 0;
  for (const c of safeChanges) {
    try {
      await prisma.lead.update({ where: { id: c.id }, data: { phone: c.to } });
      applied++;
    } catch (err) {
      console.error(`Falha em ${c.id} (${c.from} → ${c.to}):`, err.message);
    }
  }
  console.log(`Pronto. ${applied}/${safeChanges.length} aplicadas.`);
}

main()
  .then(() => prisma.$disconnect().then(() => process.exit(0)))
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
