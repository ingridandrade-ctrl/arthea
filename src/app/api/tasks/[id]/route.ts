import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const { title, description, dueDate, priority, completed, assignedToId, leadId, dealId } = body;

    const data: any = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
    if (priority !== undefined) data.priority = priority;
    if (assignedToId !== undefined) data.assignedToId = assignedToId || null;
    if (leadId !== undefined) data.leadId = leadId || null;
    if (dealId !== undefined) data.dealId = dealId || null;

    if (completed !== undefined) {
      data.completed = completed;
      data.completedAt = completed ? new Date() : null;
    }

    const task = await prisma.task.update({
      where: { id: params.id },
      data,
      include: {
        lead: true,
        deal: true,
        assignedTo: true,
        createdBy: true,
      },
    });

    return NextResponse.json(task);
  } catch (err: any) {
    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Tarefa não encontrada" }, { status: 404 });
    }
    return NextResponse.json({ error: "Erro ao atualizar tarefa" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    await prisma.task.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Tarefa não encontrada" }, { status: 404 });
    }
    return NextResponse.json({ error: "Erro ao excluir tarefa" }, { status: 500 });
  }
}
