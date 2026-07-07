import { prisma } from "@/lib/prisma";
import { ADMIN_TEMPLATES } from "./admin-templates";

/**
 * Cria templates de notificação interna no banco se ainda não existirem.
 * Idempotente: usa upsert pelo `code` (unique).
 * Não sobrescreve mensagem/nome editáveis pela UI.
 */
export async function ensureAdminTemplates() {
  let created = 0;
  let touched = 0;

  for (const t of ADMIN_TEMPLATES) {
    const existing = await prisma.followUpTemplate.findUnique({
      where: { code: t.code },
    });
    if (existing) {
      // Só ajusta vínculos estruturais que mudam com refactors.
      const drift: any = {};
      if (existing.serviceId !== null) drift.serviceId = null;
      if (!existing.metaName) drift.metaName = t.metaName;
      if (!existing.metaCategory) drift.metaCategory = t.metaCategory;
      if (Object.keys(drift).length > 0) {
        await prisma.followUpTemplate.update({
          where: { code: t.code },
          data: drift,
        });
        touched++;
      }
    } else {
      await prisma.followUpTemplate.create({
        data: {
          code: t.code,
          name: t.name,
          serviceId: null,
          stageOrder: 0,
          followUpOrder: 0,
          channel: t.channel,
          messageTemplate: t.messageTemplate,
          isAutomatic: false, // admin não é fluxo automático
          metaName: t.metaName,
          metaCategory: t.metaCategory,
        },
      });
      created++;
    }
  }

  return { created, touched, total: ADMIN_TEMPLATES.length };
}
