import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const source = await prisma.automationFlow.findUnique({
    where: { id: params.id },
    include: { steps: { orderBy: { order: "asc" } } },
  });
  if (!source) return NextResponse.json({ error: "Fluxo não encontrado" }, { status: 404 });

  const copy = await prisma.automationFlow.create({
    data: {
      name: `${source.name} (cópia)`,
      description: source.description,
      serviceId: source.serviceId,
      triggerType: source.triggerType,
      triggerStageId: source.triggerStageId,
      triggerCondition: (source.triggerCondition as any) || undefined,
      isActive: false,
      steps: {
        create: source.steps.map((s) => ({
          order: s.order,
          delayHours: s.delayHours,
          actionType: s.actionType,
          actionConfig: (s.actionConfig as any) || {},
          condition: (s.condition as any) || undefined,
          isActive: s.isActive,
        })),
      },
    },
  });

  return NextResponse.json(copy, { status: 201 });
}
