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
  let touched = 0;

  for (const t of GMN_TEMPLATES) {
    const existing = await prisma.followUpTemplate.findUnique({ where: { code: t.code } });
    if (existing) {
      // NÃO sobrescreve conteúdo editável pela UI (name, messageTemplate,
      // channel, isAutomatic, delayHoursOverride). Só ajusta vínculos
      // estruturais que mudam com refactors (serviceId, stageOrder,
      // followUpOrder, condition) se estiverem fora do esperado.
      const drift: any = {};
      if (existing.serviceId !== gmn.id) drift.serviceId = gmn.id;
      if (existing.stageOrder !== t.stageOrder) drift.stageOrder = t.stageOrder;
      if (existing.followUpOrder !== t.followUpOrder) drift.followUpOrder = t.followUpOrder;
      const wantCond = JSON.stringify(t.condition || null);
      const haveCond = JSON.stringify(existing.condition ?? null);
      if (wantCond !== haveCond) drift.condition = t.condition || undefined;
      if (Object.keys(drift).length > 0) {
        await prisma.followUpTemplate.update({ where: { code: t.code }, data: drift });
        touched++;
      }
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

  return { created, touched, total: GMN_TEMPLATES.length };
}
