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

  const body = await request.json();
  const { title, description, dueDate, priority, completed, assignedToId } = body;

  // Handle completedAt based on completed status change
  const data: any = {};
  if (title !== undefined) data.title = title;
  if (description !== undefined) data.description = description;
  if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
  if (priority !== undefined) data.priority = priority;
  if (assignedToId !== undefined) data.assignedToId = assignedToId || null;

  if (completed !== undefined) {
    data.completed = completed;
    if (completed === true) {
      data.completedAt = new Date();
    } else {
      data.completedAt = null;
    }
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
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  await prisma.task.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
