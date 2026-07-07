import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeLeadPhone } from "@/lib/phone";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const lead = await prisma.lead.findUnique({
    where: { id: params.id },
    include: {
      services: {
        include: {
          service: true,
          stage: true,
          followUps: { orderBy: { order: "asc" } },
        },
        orderBy: { createdAt: "desc" },
      },
      conversations: {
        include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
        orderBy: { lastMessageAt: "desc" },
      },
      activities: {
        include: { user: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      tasks: {
        include: { assignedTo: true },
        orderBy: [{ completed: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
      },
    },
  });

  if (!lead) {
    return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
  }

  // Carrega fluxos de automação que tocaram esse lead (todas as execuções,
  // não só as ativas, pra dar audit trail). Junta a info do fluxo (nome) +
  // estatísticas de passos (qtd executada / pendente / total) + próximo passo.
  const flowExecutions = await prisma.flowExecution.findMany({
    where: { leadId: params.id },
    orderBy: { startedAt: "desc" },
    include: {
      flow: { select: { id: true, name: true, description: true, serviceId: true } },
      steps: {
        orderBy: { order: "asc" },
        include: {
          step: {
            select: { actionType: true, actionConfig: true, delayHours: true },
          },
        },
      },
    },
  });

  const flowExecutionsEnriched = flowExecutions.map((exec) => {
    const total = exec.steps.length;
    const executed = exec.steps.filter((s) => s.status === "executed").length;
    const skipped = exec.steps.filter((s) => s.status === "skipped").length;
    const pending = exec.steps.filter((s) => s.status === "pending").length;
    const nextStep = exec.steps.find((s) => s.status === "pending");
    const lastExecutedStep = [...exec.steps].reverse().find((s) => s.status === "executed");
    return {
      ...exec,
      _counts: { total, executed, skipped, pending },
      nextStep: nextStep
        ? {
            order: nextStep.order,
            scheduledAt: nextStep.scheduledAt,
            actionType: nextStep.step?.actionType,
          }
        : null,
      lastExecutedStep: lastExecutedStep
        ? {
            order: lastExecutedStep.order,
            executedAt: lastExecutedStep.executedAt,
            actionType: lastExecutedStep.step?.actionType,
          }
        : null,
    };
  });

  return NextResponse.json({ ...lead, flowExecutions: flowExecutionsEnriched });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await request.json();
  const { name, phone, email, company, source, status, notes, serviceIds, services } = body;

  await prisma.lead.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(phone !== undefined && { phone: normalizeLeadPhone(phone) }),
      ...(email !== undefined && { email }),
      ...(company !== undefined && { company }),
      ...(source !== undefined && { source }),
      ...(status !== undefined && { status }),
      ...(notes !== undefined && { notes }),
    },
  });

  // Reconciliação rica: services = Array<{ serviceId, stageId?, value?, customData? }>
  // Preserva customData/stageId/value existentes; só recria os que mudam.
  if (services && Array.isArray(services)) {
    const existing = await prisma.leadService.findMany({
      where: { leadId: params.id },
      select: { id: true, serviceId: true },
    });
    const existingByService = new Map(existing.map((ls) => [ls.serviceId, ls.id]));
    const keptServiceIds = new Set<string>();

    for (const item of services) {
      if (!item?.serviceId) continue;
      keptServiceIds.add(item.serviceId);
      const existingId = existingByService.get(item.serviceId);
      const data: any = {};
      if (item.stageId !== undefined) data.stageId = item.stageId || null;
      if (item.value !== undefined) data.value = item.value !== null && item.value !== "" ? Number(item.value) : null;
      if (item.customData !== undefined) data.customData = item.customData || undefined;
      if (existingId) {
        if (Object.keys(data).length > 0) {
          await prisma.leadService.update({ where: { id: existingId }, data });
        }
      } else {
        await prisma.leadService.create({
          data: { leadId: params.id, serviceId: item.serviceId, ...data },
        });
      }
    }

    // Remove serviços que sumiram
    const toRemove = existing.filter((ls) => !keptServiceIds.has(ls.serviceId));
    for (const ls of toRemove) {
      await prisma.followUp.deleteMany({ where: { leadServiceId: ls.id } });
      await prisma.leadService.delete({ where: { id: ls.id } });
    }
  } else if (serviceIds && Array.isArray(serviceIds)) {
    // Legacy: apenas IDs (sem detalhes). Adiciona faltantes, remove sumidos. Não toca em campos.
    const existing = await prisma.leadService.findMany({
      where: { leadId: params.id },
      select: { id: true, serviceId: true },
    });
    const existingIds = new Set(existing.map((ls) => ls.serviceId));
    const want = new Set<string>(serviceIds);

    for (const serviceId of serviceIds) {
      if (!existingIds.has(serviceId)) {
        await prisma.leadService.create({ data: { leadId: params.id, serviceId } });
      }
    }
    for (const ls of existing) {
      if (!want.has(ls.serviceId)) {
        await prisma.followUp.deleteMany({ where: { leadServiceId: ls.id } });
        await prisma.leadService.delete({ where: { id: ls.id } });
      }
    }
  }

  const result = await prisma.lead.findUnique({
    where: { id: params.id },
    include: { services: { include: { service: true, stage: true } } },
  });

  return NextResponse.json(result);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    await prisma.$transaction(async (tx) => {
      await tx.invoice.deleteMany({ where: { leadId: params.id } });
      await tx.contract.deleteMany({ where: { leadId: params.id } });
      const leadServices = await tx.leadService.findMany({ where: { leadId: params.id }, select: { id: true } });
      const lsIds = leadServices.map((ls) => ls.id);
      if (lsIds.length > 0) {
        await tx.followUp.deleteMany({ where: { leadServiceId: { in: lsIds } } });
      }
      // Delete conversations and their messages
      const convs = await tx.conversation.findMany({ where: { leadId: params.id }, select: { id: true } });
      const convIds = convs.map((c) => c.id);
      if (convIds.length > 0) {
        await tx.message.deleteMany({ where: { conversationId: { in: convIds } } });
      }
      await tx.conversation.deleteMany({ where: { leadId: params.id } });
      // Delete other related records
      await tx.task.deleteMany({ where: { leadId: params.id } });
      await tx.activity.deleteMany({ where: { leadId: params.id } });
      await tx.automationLog.deleteMany({ where: { leadId: params.id } });
      await tx.leadService.deleteMany({ where: { leadId: params.id } });
      // Finally delete the lead
      await tx.lead.delete({ where: { id: params.id } });
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
    }
    console.error("Error deleting lead:", err);
    return NextResponse.json({ error: "Erro ao excluir lead. Tente novamente." }, { status: 500 });
  }
}
