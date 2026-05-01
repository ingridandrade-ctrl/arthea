import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runEventAutomations } from "@/lib/automations/engine";
import {
  scheduleFollowUpsForDeal,
  cancelPendingFollowUps,
} from "@/lib/followups/engine";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await request.json();
  const { title, value, stageId, assignedToId, closedAt, diagnosticNotes } = body;

  // Check if stage is changing
  const currentDeal = await prisma.deal.findUnique({
    where: { id: params.id },
    select: { stageId: true, leadId: true, serviceId: true },
  });

  const deal = await prisma.deal.update({
    where: { id: params.id },
    data: {
      ...(title !== undefined && { title }),
      ...(value !== undefined && { value }),
      ...(stageId !== undefined && { stageId }),
      ...(assignedToId !== undefined && { assignedToId }),
      ...(closedAt !== undefined && { closedAt }),
      ...(diagnosticNotes !== undefined && { diagnosticNotes }),
    },
    include: {
      lead: { include: { services: { include: { service: true } } } },
      service: true,
      stage: true,
      assignedTo: true,
    },
  });

  // If stage changed: cancel old follow-ups, schedule new ones, trigger automations
  if (currentDeal && stageId && currentDeal.stageId !== stageId) {
    // Cancel pending follow-ups from previous stage
    await cancelPendingFollowUps(params.id, currentDeal.stageId);

    // Schedule new follow-ups for the new stage
    await scheduleFollowUpsForDeal(params.id, stageId);

    // Trigger STAGE_CHANGE automations
    runEventAutomations("STAGE_CHANGE", {
      dealId: params.id,
      leadId: deal.leadId,
      fromStageId: currentDeal.stageId,
      toStageId: stageId,
    }).catch(console.error);

    // Auto-create contract when deal moves to "Fechado" (last stage)
    const newStage = await prisma.pipelineStage.findUnique({ where: { id: stageId } });
    const allStages = await prisma.pipelineStage.findMany({
      where: { pipelineId: newStage?.pipelineId || "" },
      orderBy: { order: "desc" },
      take: 1,
    });
    const isLastStage = allStages[0]?.id === stageId;

    if (isLastStage) {
      const existingContract = await prisma.contract.findUnique({ where: { dealId: params.id } });
      if (!existingContract) {
        const contractCount = await prisma.contract.count();
        const year = new Date().getFullYear();
        const contractNumber = `CTR-${year}-${String(contractCount + 1).padStart(3, "0")}`;
        const durationMonths = 12;

        const contract = await prisma.contract.create({
          data: {
            number: contractNumber,
            dealId: params.id,
            leadId: deal.leadId,
            serviceId: deal.serviceId,
            monthlyValue: deal.value ?? 0,
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
            leadId: deal.leadId,
            amount: deal.value ?? 0,
            dueDate: due,
            description: `Parcela ${i + 1}/${durationMonths}`,
          };
        });

        await prisma.invoice.createMany({ data: invoiceData });
      }
    }
  }

  return NextResponse.json(deal);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  await prisma.deal.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
