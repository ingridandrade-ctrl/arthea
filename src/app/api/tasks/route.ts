import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const assignedToId = searchParams.get("assignedToId");
  const completed = searchParams.get("completed");
  const priority = searchParams.get("priority");
  const leadId = searchParams.get("leadId");
  const dealId = searchParams.get("dealId");
  const overdue = searchParams.get("overdue");

  const where: any = {};

  if (assignedToId) {
    where.assignedToId = assignedToId;
  }
  if (completed !== null && completed !== undefined && completed !== "") {
    where.completed = completed === "true";
  }
  if (priority) {
    where.priority = priority;
  }
  if (leadId) {
    where.leadId = leadId;
  }
  if (dealId) {
    where.dealId = dealId;
  }
  if (overdue === "true") {
    where.completed = false;
    where.dueDate = { lt: new Date() };
  }

  const tasks = await prisma.task.findMany({
    where,
    take: 100,
    select: {
      id: true,
      title: true,
      description: true,
      dueDate: true,
      completed: true,
      completedAt: true,
      priority: true,
      createdAt: true,
      leadId: true,
      dealId: true,
      assignedToId: true,
      lead: { select: { id: true, name: true } },
      deal: { select: { id: true, title: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: [
      { completed: "asc" },
      { dueDate: "asc" },
      { createdAt: "desc" },
    ],
  });

  // Sort: overdue first (not completed, dueDate < now), then by dueDate asc
  const now = new Date();
  tasks.sort((a, b) => {
    const aOverdue = !a.completed && a.dueDate && new Date(a.dueDate) < now;
    const bOverdue = !b.completed && b.dueDate && new Date(b.dueDate) < now;
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;
    return 0;
  });

  return NextResponse.json(tasks);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await request.json();
  const { title, description, dueDate, priority, leadId, dealId, assignedToId } = body;

  if (!title) {
    return NextResponse.json({ error: "Título é obrigatório" }, { status: 400 });
  }

  const task = await prisma.task.create({
    data: {
      title,
      description,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      priority: priority || "medium",
      leadId: leadId || undefined,
      dealId: dealId || undefined,
      assignedToId: assignedToId || undefined,
      createdById: (session.user as any).id,
    },
    include: {
      lead: true,
      deal: true,
      assignedTo: true,
      createdBy: true,
    },
  });

  return NextResponse.json(task, { status: 201 });
}
