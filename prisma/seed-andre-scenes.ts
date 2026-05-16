import { PrismaClient } from "@prisma/client";
import { SEED_SCENES } from "./seed-scenes-data";

const prisma = new PrismaClient();
const ANDRE_EMAIL = "andre@psi.andreborges.com.br";

async function main() {
  const andre = await prisma.user.findUnique({ where: { email: ANDRE_EMAIL } });
  if (!andre) {
    console.error(`× Usuário do André não encontrado (${ANDRE_EMAIL}). Rode seed-andre.ts antes.`);
    process.exit(1);
  }

  // Liga o módulo pro André
  if (!andre.scenesEnabled) {
    await prisma.user.update({
      where: { id: andre.id },
      data: { scenesEnabled: true },
    });
    console.log("✓ Módulo Acervo ativado pra André.");
  } else {
    console.log("• Módulo Acervo já estava ativado.");
  }

  // Cria cenas só se ainda não houver nenhuma (idempotente, não duplica)
  const existing = await prisma.scene.count({ where: { clientId: andre.id } });
  if (existing > 0) {
    console.log(`• ${existing} cenas já existem no acervo do André. Pulando seed.`);
    console.log("  (Pra resetar, apague as cenas no admin antes de rodar de novo.)");
    return;
  }

  for (const s of SEED_SCENES) {
    await prisma.scene.create({
      data: {
        clientId: andre.id,
        theme: s.theme,
        order: s.order,
        characters: s.characters,
        type: s.type,
        work: s.work,
        context: s.context,
        sceneAndQuote: s.sceneAndQuote,
        platform: s.platform || null,
        videoLink: s.videoLink || null,
        hook: s.hook || null,
        clinicalAngle: s.clinicalAngle,
      },
    });
  }
  console.log(`✓ ${SEED_SCENES.length} cenas criadas no acervo do André.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
