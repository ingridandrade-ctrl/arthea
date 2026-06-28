import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { renderTemplate } from "@/lib/followups/engine";

// Dispara fluxos quando um evento acontece:
// - stage_enter: leadService entrou num estágio novo
// - lead_created: novo lead criado
export async function triggerFlows(opts: {
  type: "STAGE_ENTER" | "LEAD_CREATED";
  leadId: string;
  leadServiceId?: string;
  stageId?: string;
}) {
  // Carrega o lead + leadService (se houver) pra avaliar condições
  const [lead, leadService] = await Promise.all([
    prisma.lead.findUnique({
      where: { id: opts.leadId },
      select: { source: true, status: true },
    }),
    opts.leadServiceId
      ? prisma.leadService.findUnique({
          where: { id: opts.leadServiceId },
          select: { serviceId: true, customData: true },
        })
      : Promise.resolve(null),
  ]);
  if (!lead) return;

  // Busca fluxos que casam com o gatilho
  const where: any = { isActive: true, triggerType: opts.type };
  if (opts.type === "STAGE_ENTER" && opts.stageId) where.triggerStageId = opts.stageId;
  if (leadService?.serviceId) where.OR = [{ serviceId: leadService.serviceId }, { serviceId: null }];

  const flows = await prisma.automationFlow.findMany({
    where,
    include: { steps: { where: { isActive: true }, orderBy: { order: "asc" } } },
  });

  const ctx: Record<string, any> = {
    source: lead.source,
    status: lead.status,
    ...((leadService?.customData || {}) as Record<string, any>),
  };

  for (const flow of flows) {
    if (!matchesCondition(flow.triggerCondition as any, ctx)) continue;
    if (flow.steps.length === 0) continue;

    // Idempotência: não cria nova execução se já existe uma running deste flow pro mesmo leadService
    const existing = await prisma.flowExecution.findFirst({
      where: {
        flowId: flow.id,
        leadId: opts.leadId,
        leadServiceId: opts.leadServiceId ?? null,
        status: "running",
      },
    });
    if (existing) continue;

    const execution = await prisma.flowExecution.create({
      data: {
        flowId: flow.id,
        leadId: opts.leadId,
        leadServiceId: opts.leadServiceId ?? null,
        status: "running",
      },
    });

    // Agenda todos os passos. delayHours é cumulativo (relativo ao trigger).
    let totalDelayHours = 0;
    const now = new Date();
    for (const step of flow.steps) {
      totalDelayHours += step.delayHours;
      const scheduledAt = new Date(now.getTime() + totalDelayHours * 60 * 60 * 1000);
      await prisma.flowStepExecution.create({
        data: {
          executionId: execution.id,
          stepId: step.id,
          order: step.order,
          scheduledAt,
          status: "pending",
        },
      });
    }
  }
}

export async function processDueFlowSteps() {
  const now = new Date();
  const due = await prisma.flowStepExecution.findMany({
    where: { status: "pending", scheduledAt: { lte: now } },
    include: {
      step: true,
      execution: {
        include: {
          lead: { select: { id: true, name: true, phone: true, email: true, company: true, source: true, status: true } },
          flow: { select: { id: true, name: true } },
        },
      },
    },
    take: 50,
    orderBy: { scheduledAt: "asc" },
  });

  const results: { id: string; ok: boolean; action: string }[] = [];

  for (const item of due) {
    const lead = item.execution.lead;
    const leadServiceId = item.execution.leadServiceId;
    let leadService: any = null;
    if (leadServiceId) {
      leadService = await prisma.leadService.findUnique({
        where: { id: leadServiceId },
        select: { id: true, customData: true, stageId: true, service: { select: { name: true } } },
      });
    }

    const customData = (leadService?.customData || {}) as Record<string, any>;
    const ctx: Record<string, any> = { source: lead.source, status: lead.status, ...customData };

    // Avalia condição do passo (se existir)
    if (!matchesCondition(item.step.condition as any, ctx)) {
      await prisma.flowStepExecution.update({
        where: { id: item.id },
        data: { status: "skipped", executedAt: now },
      });
      results.push({ id: item.id, ok: true, action: "skipped" });
      continue;
    }

    const action = item.step.actionType;
    const config = (item.step.actionConfig || {}) as Record<string, any>;

    try {
      if (action === "send_whatsapp" || action === "internal_reminder") {
        // Resolve mensagem: prioriza templateId (sempre fresh do banco) sobre message inline
        let raw = (config.message as string) || "";
        if (config.templateId) {
          const tpl = await prisma.followUpTemplate.findUnique({
            where: { id: config.templateId as string },
            select: { messageTemplate: true, isActive: true },
          });
          if (tpl && tpl.isActive) raw = tpl.messageTemplate;
        }
        const message = renderTemplate(raw, {
          nome: lead.name,
          servico: leadService?.service?.name || "",
          empresa: lead.company || "",
          telefone: lead.phone,
          email: lead.email || "",
          ...customData,
        });

        if (action === "send_whatsapp") {
          await sendWhatsAppMessage(lead.phone, message);
          // Registra na conversa
          let conv = await prisma.conversation.findFirst({ where: { leadId: lead.id }, orderBy: { createdAt: "desc" } });
          if (!conv) {
            conv = await prisma.conversation.create({ data: { leadId: lead.id, isAiActive: true, lastMessageAt: new Date() } });
          }
          await prisma.message.create({ data: { conversationId: conv.id, content: message, sender: "AI" } });
        } else {
          // internal_reminder: cria como Task pra aparecer em /crm/tarefas
          await prisma.task.create({
            data: {
              title: (config.title as string) || `Passo do fluxo: ${item.execution.flow.name}`,
              description: message,
              priority: (config.priority as string) || "medium",
              leadId: lead.id,
              leadServiceId,
              dueDate: new Date(),
            },
          });
        }

        await prisma.flowStepExecution.update({
          where: { id: item.id },
          data: { status: "executed", executedAt: now },
        });
        results.push({ id: item.id, ok: true, action });
      } else if (action === "move_stage") {
        if (leadServiceId && config.stageId) {
          await prisma.leadService.update({ where: { id: leadServiceId }, data: { stageId: config.stageId } });
        }
        await prisma.flowStepExecution.update({
          where: { id: item.id },
          data: { status: "executed", executedAt: now },
        });
        results.push({ id: item.id, ok: true, action });
      } else if (action === "create_task") {
        await prisma.task.create({
          data: {
            title: (config.title as string) || "Tarefa do fluxo",
            description: (config.description as string) || null,
            priority: (config.priority as string) || "medium",
            leadId: lead.id,
            leadServiceId,
            dueDate: config.dueAtIso ? new Date(config.dueAtIso) : null,
          },
        });
        await prisma.flowStepExecution.update({
          where: { id: item.id },
          data: { status: "executed", executedAt: now },
        });
        results.push({ id: item.id, ok: true, action });
      } else {
        // Tipo desconhecido — skip
        await prisma.flowStepExecution.update({
          where: { id: item.id },
          data: { status: "skipped", executedAt: now, result: { reason: "unknown_action" } },
        });
        results.push({ id: item.id, ok: false, action: "unknown" });
      }
    } catch (err: any) {
      await prisma.flowStepExecution.update({
        where: { id: item.id },
        data: { status: "failed", executedAt: now, result: { error: String(err?.message || err) } },
      });
      results.push({ id: item.id, ok: false, action });
    }
  }

  // Marca executions concluídas quando todos os steps estão != pending
  const runningExecutions = due.map((d) => d.executionId);
  for (const execId of new Set(runningExecutions)) {
    const pending = await prisma.flowStepExecution.count({
      where: { executionId: execId, status: "pending" },
    });
    if (pending === 0) {
      await prisma.flowExecution.update({
        where: { id: execId },
        data: { status: "completed", completedAt: new Date() },
      });
    }
  }

  return results;
}

function matchesCondition(condition: Record<string, any> | null, ctx: Record<string, any>): boolean {
  if (!condition) return true;
  for (const [key, expected] of Object.entries(condition)) {
    if (ctx[key] !== expected) return false;
  }
  return true;
}
