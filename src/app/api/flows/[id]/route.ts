import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const flow = await prisma.automationFlow.findUnique({
    where: { id: params.id },
    include: {
      service: { select: { id: true, name: true, slug: true, color: true } },
      triggerStage: { select: { id: true, name: true, color: true, order: true } },
      steps: { orderBy: { order: "asc" } },
      _count: { select: { executions: true } },
    },
  });
  if (!flow) return NextResponse.json({ error: "Fluxo não encontrado" }, { status: 404 });

  return NextResponse.json(flow);
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await request.json();
  const { name, description, serviceId, triggerType, triggerStageId, triggerCondition, isActive, steps } = body;

  const flow = await prisma.automationFlow.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(serviceId !== undefined && { serviceId: serviceId || null }),
      ...(triggerType !== undefined && { triggerType }),
      ...(triggerStageId !== undefined && { triggerStageId: triggerStageId || null }),
      ...(triggerCondition !== undefined && { triggerCondition: triggerCondition || undefined }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  // Reconciliação rica dos steps (se passados)
  if (Array.isArray(steps)) {
    const existing = await prisma.flowStep.findMany({ where: { flowId: params.id }, select: { id: true } });
    const existingIds = new Set(existing.map((s) => s.id));
    const keepIds = new Set<string>();

    for (let i = 0; i < steps.length; i++) {
      const s = steps[i];
      const stepData = {
        order: i + 1,
        delayHours: Number(s.delayHours ?? 0),
        actionType: s.actionType,
        actionConfig: s.actionConfig || {},
        condition: s.condition || undefined,
        isActive: s.isActive !== false,
      };
      if (s.id && existingIds.has(s.id)) {
        await prisma.flowStep.update({ where: { id: s.id }, data: stepData });
        keepIds.add(s.id);
      } else {
        const created = await prisma.flowStep.create({ data: { flowId: params.id, ...stepData } });
        keepIds.add(created.id);
      }
    }

    const toDelete = existing.filter((s) => !keepIds.has(s.id)).map((s) => s.id);
    if (toDelete.length > 0) {
      await prisma.flowStep.deleteMany({ where: { id: { in: toDelete } } });
    }
  }

  return NextResponse.json(flow);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  await prisma.automationFlow.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
