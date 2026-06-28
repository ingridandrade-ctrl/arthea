import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensurePipelineForService } from "@/lib/pipeline/bootstrap";

export async function GET(request: NextRequest) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  // Garante que migração de templates GMN -> fluxos rodou
  await ensurePipelineForService("google-meu-negocio");

  const { searchParams } = new URL(request.url);
  const serviceSlug = searchParams.get("service");

  const where: any = {};
  if (serviceSlug && serviceSlug !== "all") {
    const svc = await prisma.service.findUnique({ where: { slug: serviceSlug }, select: { id: true } });
    if (svc) where.serviceId = svc.id;
  }

  const flows = await prisma.automationFlow.findMany({
    where,
    include: {
      service: { select: { id: true, name: true, slug: true, color: true } },
      triggerStage: { select: { id: true, name: true, color: true, order: true } },
      steps: { orderBy: { order: "asc" } },
      _count: { select: { executions: true } },
    },
    orderBy: [{ serviceId: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(flows);
}

export async function POST(request: NextRequest) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await request.json();
  const { name, description, serviceId, triggerType, triggerStageId, triggerCondition, isActive } = body;

  if (!name) return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
  if (!triggerType) return NextResponse.json({ error: "Tipo de gatilho é obrigatório" }, { status: 400 });

  const flow = await prisma.automationFlow.create({
    data: {
      name,
      description,
      serviceId: serviceId || null,
      triggerType,
      triggerStageId: triggerStageId || null,
      triggerCondition: triggerCondition || undefined,
      isActive: isActive !== false,
    },
  });

  return NextResponse.json(flow, { status: 201 });
}
