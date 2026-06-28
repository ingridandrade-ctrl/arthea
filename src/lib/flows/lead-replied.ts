import { prisma } from "@/lib/prisma";

// Quando um lead manda mensagem (resposta espontânea, não vinda do bot):
//  1. Cancela todos os fluxos em execução pra esse lead (FlowExecution e
//     seus FlowStepExecutions pendentes).
//  2. Auto-move estágio: se algum dos serviços do lead está em "Em contato",
//     vai pra "Em negociação" (próximo estágio do pipeline).
//  3. Cria notificação interna pra Ingrid com o último conteúdo.
//
// Idempotente: se o lead respondeu duas vezes em sequência, a 2ª chamada
// não acha mais execuções rodando — só anota a notificação se nova.
export async function onLeadReplied(opts: {
  leadId: string;
  lastMessage?: string;
}) {
  const lead = await prisma.lead.findUnique({
    where: { id: opts.leadId },
    include: {
      services: {
        include: { service: { select: { id: true, name: true } }, stage: { select: { id: true, name: true, order: true, pipelineId: true } } },
      },
    },
  });
  if (!lead) return { stopped: 0, moved: 0 };

  // 1. Para fluxos rodando
  const runningExecutions = await prisma.flowExecution.findMany({
    where: { leadId: opts.leadId, status: "running" },
    select: { id: true, flowId: true, flow: { select: { name: true } } },
  });

  let stopped = 0;
  for (const exec of runningExecutions) {
    await prisma.flowStepExecution.updateMany({
      where: { executionId: exec.id, status: "pending" },
      data: { status: "skipped", executedAt: new Date(), result: { reason: "lead_replied" } },
    });
    await prisma.flowExecution.update({
      where: { id: exec.id },
      data: { status: "stopped", completedAt: new Date() },
    });
    stopped++;
  }

  // 2. Auto-move estágio: "Em contato" → próximo
  let moved = 0;
  for (const ls of lead.services) {
    if (!ls.stage) continue;
    const isEmContato = ls.stage.name.toLowerCase().includes("em contato");
    if (!isEmContato) continue;

    const next = await prisma.pipelineStage.findFirst({
      where: { pipelineId: ls.stage.pipelineId, order: { gt: ls.stage.order } },
      orderBy: { order: "asc" },
    });
    if (!next) continue;
    // Não move pra Ganho/Perdido automaticamente
    if (/ganho|perdido/i.test(next.name)) continue;

    await prisma.leadService.update({ where: { id: ls.id }, data: { stageId: next.id } });

    // Triggera fluxos do novo estágio + resolve waits pendentes
    const { triggerFlows, resolveWaitStageChanges } = await import("./engine");
    await triggerFlows({
      type: "STAGE_ENTER",
      leadId: lead.id,
      leadServiceId: ls.id,
      stageId: next.id,
    });
    await resolveWaitStageChanges(ls.id, next.id);
    moved++;
  }

  // 3. Notificação pra equipe (todos os usuários ADMIN + MANAGER)
  // Dedupe: se já notificamos sobre esse lead nos últimos 5 minutos, não
  // notifica de novo. Cobre o caso de webhook + check_response do cron
  // chamarem onLeadReplied em sequência pra mesma resposta.
  if (stopped > 0 || moved > 0) {
    const recent = await prisma.notification.findFirst({
      where: {
        type: "lead_replied",
        createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
        // Filtra via JSON (data->>leadId). Em Postgres com Prisma, usar `path`.
        data: { path: ["leadId"], equals: lead.id },
      },
      select: { id: true },
    });
    if (!recent) {
      const recipients = await prisma.user.findMany({
        where: { role: { in: ["ADMIN", "MANAGER"] } },
        select: { id: true },
      });
      const stageName = lead.services[0]?.stage?.name || "—";
      const serviceName = lead.services[0]?.service?.name || "—";
      const preview = opts.lastMessage ? opts.lastMessage.slice(0, 80) : "(mensagem)";
      const title = `${lead.name} respondeu`;
      const body = `${lead.company ? lead.company + " · " : ""}${serviceName} · ${stageName}\n"${preview}"`;
      for (const u of recipients) {
        await prisma.notification.create({
          data: {
            userId: u.id,
            type: "lead_replied",
            title,
            body,
            data: { leadId: lead.id, stoppedFlows: stopped, movedServices: moved },
          },
        });
      }
    }
  }

  return { stopped, moved };
}
