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
  const leadServiceId = searchParams.get("leadServiceId");
  const overdue = searchParams.get("overdue");
  const includeFollowUps = searchParams.get("includeFollowUps") !== "false";

  const where: any = {};

  if (assignedToId) {
    if (assignedToId === "me") {
      where.assignedToId = (session.user as any).id;
    } else {
      where.assignedToId = assignedToId;
    }
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
  if (leadServiceId) {
    where.leadServiceId = leadServiceId;
  }
  if (overdue === "true") {
    where.completed = false;
    where.dueDate = { lt: new Date() };
  }

  const dueDateFrom = searchParams.get("dueDateFrom");
  const dueDateTo = searchParams.get("dueDateTo");
  if (dueDateFrom || dueDateTo) {
    where.dueDate = where.dueDate || {};
    if (dueDateFrom) where.dueDate.gte = new Date(dueDateFrom);
    if (dueDateTo) where.dueDate.lte = new Date(dueDateTo);
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
      leadServiceId: true,
      assignedToId: true,
      lead: { select: { id: true, name: true } },
      leadService: { select: { id: true, service: { select: { name: true, color: true } } } },
      assignedTo: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: [
      { completed: "asc" },
      { dueDate: "asc" },
      { createdAt: "desc" },
    ],
  });

  const normalizedTasks = tasks.map((t) => ({ ...t, kind: "task" as const }));

  if (!includeFollowUps) {
    return NextResponse.json(normalizedTasks);
  }

  // Follow-ups internos (lembretes pra equipe) entram aqui também.
  // Filtros equivalentes:
  //  - completed=false  ->  status=pending
  //  - completed=true   ->  status in (sent, skipped)
  //  - overdue=true     ->  status=pending AND scheduledAt < now
  const fuWhere: any = { channel: "internal" };
  if (completed === "true") fuWhere.status = { in: ["sent", "skipped"] };
  else if (completed === "false") fuWhere.status = "pending";
  if (leadId) fuWhere.leadService = { leadId };
  if (leadServiceId) fuWhere.leadServiceId = leadServiceId;
  if (overdue === "true") {
    fuWhere.status = "pending";
    fuWhere.scheduledAt = { lt: new Date() };
  }
  if (dueDateFrom || dueDateTo) {
    fuWhere.scheduledAt = fuWhere.scheduledAt || {};
    if (dueDateFrom) fuWhere.scheduledAt.gte = new Date(dueDateFrom);
    if (dueDateTo) fuWhere.scheduledAt.lte = new Date(dueDateTo);
  }

  const followUps = await prisma.followUp.findMany({
    where: fuWhere,
    take: 100,
    select: {
      id: true,
      order: true,
      messageTemplate: true,
      channel: true,
      status: true,
      scheduledAt: true,
      sentAt: true,
      createdAt: true,
      stage: { select: { id: true, name: true, color: true } },
      leadService: {
        select: {
          id: true,
          leadId: true,
          lead: { select: { id: true, name: true } },
          service: { select: { name: true, color: true } },
        },
      },
    },
    orderBy: [{ status: "asc" }, { scheduledAt: "asc" }],
  });

  const normalizedFollowUps = followUps.map((fu) => {
    const firstLine = fu.messageTemplate.split("\n").find((l) => l.trim().length > 0) || "Follow-up";
    const title = firstLine.length > 80 ? firstLine.slice(0, 77) + "..." : firstLine;
    return {
      kind: "followup" as const,
      id: fu.id,
      title,
      description: fu.messageTemplate,
      dueDate: fu.scheduledAt,
      completed: fu.status !== "pending",
      completedAt: fu.sentAt,
      priority: "medium",
      createdAt: fu.createdAt,
      leadId: fu.leadService.leadId,
      leadServiceId: fu.leadService.id,
      assignedToId: null,
      lead: fu.leadService.lead,
      leadService: { id: fu.leadService.id, service: fu.leadService.service },
      assignedTo: null,
      createdBy: null,
      // followup-specific
      followUpOrder: fu.order,
      followUpStatus: fu.status,
      stage: fu.stage,
    };
  });

  const all = [...normalizedTasks, ...normalizedFollowUps].sort((a, b) => {
    // Pendentes primeiro
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    // Depois por dueDate ascendente (nulls no fim)
    if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return NextResponse.json(all);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await request.json();
  const { title, description, dueDate, priority, leadId, leadServiceId, assignedToId } = body;

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
      leadServiceId: leadServiceId || undefined,
      assignedToId: assignedToId || undefined,
      createdById: (session.user as any).id,
    },
    include: {
      lead: true,
      leadService: { include: { service: true } },
      assignedTo: true,
      createdBy: true,
    },
  });

  return NextResponse.json(task, { status: 201 });
}
