import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runEventAutomations } from "@/lib/automations/engine";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await request.json();
  const { title, value, stageId, assignedToId, closedAt } = body;

  // Check if stage is changing for automation triggers
  const currentDeal = await prisma.deal.findUnique({
    where: { id: params.id },
    select: { stageId: true, leadId: true },
  });

  const deal = await prisma.deal.update({
    where: { id: params.id },
    data: { title, value, stageId, assignedToId, closedAt },
    include: { lead: true, service: true, stage: true, assignedTo: true },
  });

  // Trigger STAGE_CHANGE automations if stage changed
  if (currentDeal && stageId && currentDeal.stageId !== stageId) {
    runEventAutomations("STAGE_CHANGE", {
      dealId: params.id,
      leadId: deal.leadId,
      fromStageId: currentDeal.stageId,
      toStageId: stageId,
      serviceId: deal.serviceId,
    }).catch(console.error);
  }

  return NextResponse.json(deal);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  await prisma.deal.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
