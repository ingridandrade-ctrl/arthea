import { prisma } from "@/lib/prisma";
import { GMN_TEMPLATES } from "./gmn-templates";

// Cria os templates GMN (Google Meu Negócio) no banco se ainda não existirem.
// Idempotente: usa upsert pelo `code` (unique).
export async function ensureGmnTemplates() {
  const gmn = await prisma.service.findUnique({
    where: { slug: "google-meu-negocio" },
    select: { id: true },
  });
  if (!gmn) return { created: 0, skipped: 0, reason: "service_not_found" };

  // Migration: renomeia codes legados GMB_* -> GMN_* (caso já tenham sido
  // criados antes da troca de nomenclatura).
  const legacyCodes = await prisma.followUpTemplate.findMany({
    where: { code: { startsWith: "GMB_" } },
    select: { id: true, code: true },
  });
  for (const t of legacyCodes) {
    if (!t.code) continue;
    const newCode = t.code.replace(/^GMB_/, "GMN_");
    const collision = await prisma.followUpTemplate.findUnique({ where: { code: newCode } });
    if (collision) {
      await prisma.followUpTemplate.delete({ where: { id: t.id } });
    } else {
      await prisma.followUpTemplate.update({ where: { id: t.id }, data: { code: newCode } });
    }
  }

  let created = 0;
  let updated = 0;

  for (const t of GMN_TEMPLATES) {
    const existing = await prisma.followUpTemplate.findUnique({ where: { code: t.code } });
    if (existing) {
      await prisma.followUpTemplate.update({
        where: { code: t.code },
        data: {
          name: t.name,
          serviceId: gmn.id,
          stageOrder: t.stageOrder,
          followUpOrder: t.followUpOrder,
          channel: t.channel,
          messageTemplate: t.messageTemplate,
          isAutomatic: t.isAutomatic,
          delayHoursOverride: t.delayHoursOverride,
          condition: t.condition || undefined,
        },
      });
      updated++;
    } else {
      await prisma.followUpTemplate.create({
        data: {
          code: t.code,
          name: t.name,
          serviceId: gmn.id,
          stageOrder: t.stageOrder,
          followUpOrder: t.followUpOrder,
          channel: t.channel,
          messageTemplate: t.messageTemplate,
          isAutomatic: t.isAutomatic,
          delayHoursOverride: t.delayHoursOverride,
          condition: t.condition || undefined,
        },
      });
      created++;
    }
  }

  return { created, updated, total: GMN_TEMPLATES.length };
}
