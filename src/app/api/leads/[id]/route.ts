import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession({ req: request as any, ...authOptions } as any) ?? await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const lead = await prisma.lead.findUnique({
    where: { id: params.id },
    include: {
      services: { include: { service: true } },
      deals: {
        include: {
          stage: true,
          service: true,
          assignedTo: true,
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
  const session = await getServerSession({ req: request as any, ...authOptions } as any) ?? await getServerSession(authOptions);
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
  const session = await getServerSession({ req: request as any, ...authOptions } as any) ?? await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  await prisma.lead.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
