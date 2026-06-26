import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  return NextResponse.json(lead);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await request.json();
  const { name, phone, email, company, status, notes, serviceIds } = body;

  const lead = await prisma.lead.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(phone !== undefined && { phone }),
      ...(email !== undefined && { email }),
      ...(company !== undefined && { company }),
      ...(status !== undefined && { status }),
      ...(notes !== undefined && { notes }),
    },
  });

  // Update service associations if provided
  if (serviceIds && Array.isArray(serviceIds)) {
    // Remove existing associations
    await prisma.leadService.deleteMany({ where: { leadId: params.id } });
    // Create new ones
    for (const serviceId of serviceIds) {
      await prisma.leadService.create({
        data: { leadId: params.id, serviceId },
      });
    }
  }

  const result = await prisma.lead.findUnique({
    where: { id: params.id },
    include: { services: { include: { service: true } } },
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
