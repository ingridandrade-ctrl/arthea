import { prisma } from "@/lib/prisma";

// Migra os FollowUpTemplates existentes pra AutomationFlows.
// Cada (serviceId, stageOrder, condition) único vira um Flow.
// Os templates dentro do grupo viram FlowSteps ordenados por followUpOrder.
// Idempotente: usa um campo de "fonte" no nome pra detectar e atualizar.

const SOURCE_MARK = " [auto-migrado de templates]";

export async function migrateTemplatesToFlows() {
  const templates = await prisma.followUpTemplate.findMany({
    where: { isActive: true },
    orderBy: [{ stageOrder: "asc" }, { followUpOrder: "asc" }],
  });

  if (templates.length === 0) return { created: 0, updated: 0, total: 0 };

  // Busca pipelines pra resolver stageOrder → stageId
  const pipelines = await prisma.pipeline.findMany({
    include: { stages: { orderBy: { order: "asc" } } },
  });
  const stageByServiceAndOrder = new Map<string, string>();
  for (const p of pipelines) {
    const key = (sid: string | null, order: number) => `${sid ?? "null"}:${order}`;
    for (const s of p.stages) {
      stageByServiceAndOrder.set(key(p.serviceId, s.order), s.id);
    }
  }

  // Agrupa templates por (serviceId, stageOrder, condition)
  type Group = {
    serviceId: string | null;
    stageOrder: number;
    condition: any;
    templates: typeof templates;
  };
  const groups = new Map<string, Group>();
  for (const t of templates) {
    const condKey = JSON.stringify(t.condition || null);
    const key = `${t.serviceId ?? "null"}|${t.stageOrder}|${condKey}`;
    if (!groups.has(key)) {
      groups.set(key, {
        serviceId: t.serviceId,
        stageOrder: t.stageOrder,
        condition: t.condition,
        templates: [],
      });
    }
    groups.get(key)!.templates.push(t);
  }

  let created = 0;
  let updated = 0;

  for (const g of groups.values()) {
    const stageKey = `${g.serviceId ?? "null"}:${g.stageOrder}`;
    const stageId = stageByServiceAndOrder.get(stageKey);
    if (!stageId) continue;

    // Nome do fluxo
    const condLabel = describeCondition(g.condition);
    const stageName = await stageNameOf(stageId);
    const baseName = condLabel
      ? `${stageName} · ${condLabel}`
      : stageName;
    const name = `${baseName}${SOURCE_MARK}`;

    // Procura flow auto-migrado existente
    const existing = await prisma.automationFlow.findFirst({
      where: {
        serviceId: g.serviceId,
        triggerStageId: stageId,
        name: { contains: SOURCE_MARK },
      },
      include: { steps: true },
    });

    if (existing) {
      // Atualiza os steps SE não houver execuções rodando (pra não bagunçar fluxos ativos)
      const hasRunning = await prisma.flowExecution.count({
        where: { flowId: existing.id, status: "running" },
      });
      if (hasRunning > 0) continue;

      await prisma.flowStep.deleteMany({ where: { flowId: existing.id } });
      await createSteps(existing.id, g.templates);
      await prisma.automationFlow.update({
        where: { id: existing.id },
        data: {
          name,
          triggerCondition: g.condition || undefined,
        },
      });
      updated++;
    } else {
      const flow = await prisma.automationFlow.create({
        data: {
          name,
          description: "Fluxo gerado automaticamente a partir dos templates de follow-up.",
          serviceId: g.serviceId,
          isActive: true,
          triggerType: "STAGE_ENTER",
          triggerStageId: stageId,
          triggerCondition: g.condition || undefined,
        },
      });
      await createSteps(flow.id, g.templates);
      created++;
    }
  }

  return { created, updated, total: groups.size };
}

async function createSteps(flowId: string, templates: any[]) {
  let cumulative = 0;
  let order = 0;
  for (const t of templates.sort((a, b) => a.followUpOrder - b.followUpOrder)) {
    const delayFromPrevious = (t.delayHoursOverride ?? 0) - cumulative;
    const stepDelay = Math.max(0, delayFromPrevious);
    cumulative += stepDelay;
    order++;

    const isWhatsapp = t.channel === "whatsapp" && t.isAutomatic === true;
    await prisma.flowStep.create({
      data: {
        flowId,
        order,
        delayHours: stepDelay,
        actionType: isWhatsapp ? "send_whatsapp" : "internal_reminder",
        actionConfig: {
          templateId: t.id,
          templateName: t.name,
          message: t.messageTemplate, // fallback se template for excluído
          title: t.name,
        },
        isActive: t.isActive,
      },
    });
  }
}

async function stageNameOf(stageId: string): Promise<string> {
  const s = await prisma.pipelineStage.findUnique({ where: { id: stageId }, select: { name: true } });
  return s?.name || "Estágio";
}

function describeCondition(c: any): string {
  if (!c || typeof c !== "object") return "";
  if (c.source === "FORMS") return "Forms site";
  if (c.source === "PROSPECCAO") return "Prospecção";
  if (c.source === "INDICACAO") return "Indicação";
  return "Com condição";
}
