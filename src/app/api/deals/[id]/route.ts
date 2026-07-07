import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runEventAutomations } from "@/lib/automations/engine";
import {
  scheduleFollowUpsForLeadService,
  cancelPendingFollowUps,
} from "@/lib/followups/engine";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await request.json();
  const { value, stageId, closedAt, customData } = body;

  const current = await prisma.leadService.findUnique({
    where: { id: params.id },
    select: { stageId: true, leadId: true, serviceId: true },
  });

  const leadService = await prisma.leadService.update({
    where: { id: params.id },
    data: {
      ...(value !== undefined && { value }),
      ...(stageId !== undefined && { stageId }),
      ...(closedAt !== undefined && { closedAt }),
      ...(customData !== undefined && { customData }),
    },
    include: {
      lead: { include: { services: { include: { service: true } } } },
      service: true,
      stage: true,
    },
  });

  if (current && stageId && current.stageId !== stageId) {
    if (current.stageId) {
      await cancelPendingFollowUps(params.id, current.stageId);
    }

    await scheduleFollowUpsForLeadService(params.id, stageId);

    // Novo: dispara fluxos de automação cujo gatilho é "entrar no estágio"
    const { triggerFlows, resolveWaitStageChanges } = await import("@/lib/flows/engine");
    await triggerFlows({
      type: "STAGE_ENTER",
      leadId: leadService.leadId,
      leadServiceId: params.id,
      stageId,
    });
    // Resolve qualquer step wait_stage_change pendente que esperava esse stage
    await resolveWaitStageChanges(params.id, stageId);

    runEventAutomations("STAGE_CHANGE", {
      leadServiceId: params.id,
      leadId: leadService.leadId,
      fromStageId: current.stageId || undefined,
      toStageId: stageId,
    }).catch(console.error);

    const newStage = await prisma.pipelineStage.findUnique({ where: { id: stageId } });
    const allStages = await prisma.pipelineStage.findMany({
      where: { pipelineId: newStage?.pipelineId || "" },
      orderBy: { order: "desc" },
      take: 1,
    });
    const isLastStage = allStages[0]?.id === stageId;

    const stageName = (newStage?.name || "").toLowerCase();
    if (stageName.includes("ganho")) {
      await prisma.lead.update({
        where: { id: leadService.leadId },
        data: { status: "CLIENTE" },
      });
    } else if (stageName.includes("perdido")) {
      const lead = await prisma.lead.findUnique({
        where: { id: leadService.leadId },
        select: { status: true },
      });
      if (lead?.status !== "CLIENTE") {
        await prisma.lead.update({
          where: { id: leadService.leadId },
          data: { status: "PERDIDO" },
        });
      }
    }

    if (isLastStage) {
      const existingContract = await prisma.contract.findUnique({ where: { leadServiceId: params.id } });
      if (!existingContract) {
        const contractCount = await prisma.contract.count();
        const year = new Date().getFullYear();
        const contractNumber = `CTR-${year}-${String(contractCount + 1).padStart(3, "0")}`;
        const durationMonths = 12;

        const contract = await prisma.contract.create({
          data: {
            number: contractNumber,
            leadServiceId: params.id,
            leadId: leadService.leadId,
            serviceId: leadService.serviceId,
            monthlyValue: leadService.value ?? 0,
            durationMonths,
            startDate: new Date(),
            paymentDay: 10,
          },
        });

        const invoiceCount = await prisma.invoice.count();
        const invoiceData = Array.from({ length: durationMonths }, (_, i) => {
          const due = new Date();
          due.setMonth(due.getMonth() + i);
          due.setDate(10);
          return {
            number: `INV-${year}-${String(invoiceCount + i + 1).padStart(3, "0")}`,
            contractId: contract.id,
            leadId: leadService.leadId,
            amount: leadService.value ?? 0,
            dueDate: due,
            description: `Parcela ${i + 1}/${durationMonths}`,
          };
        });

        await prisma.invoice.createMany({ data: invoiceData });
      }
    }
  }

  return NextResponse.json(leadService);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  await prisma.followUp.deleteMany({ where: { leadServiceId: params.id } });
  await prisma.leadService.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
