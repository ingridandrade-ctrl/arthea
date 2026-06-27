import { prisma } from "@/lib/prisma";
import { GMB_TEMPLATES } from "./gmb-templates";

// Cria os templates GMB no banco se ainda não existirem.
// Idempotente: usa upsert pelo `code` (unique).
export async function ensureGmbTemplates() {
  const gmb = await prisma.service.findUnique({
    where: { slug: "google-meu-negocio" },
    select: { id: true },
  });
  if (!gmb) return { created: 0, skipped: 0, reason: "service_not_found" };

  let created = 0;
  let updated = 0;

  for (const t of GMB_TEMPLATES) {
    const existing = await prisma.followUpTemplate.findUnique({ where: { code: t.code } });
    if (existing) {
      await prisma.followUpTemplate.update({
        where: { code: t.code },
        data: {
          name: t.name,
          serviceId: gmb.id,
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
          serviceId: gmb.id,
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

  return { created, updated, total: GMB_TEMPLATES.length };
}
