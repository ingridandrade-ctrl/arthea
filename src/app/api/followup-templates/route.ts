import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensurePipelineForService } from "@/lib/pipeline/bootstrap";

export async function GET() {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  // Garante que pipelines/templates de serviços com config estejam plugados
  await ensurePipelineForService("google-meu-negocio");

  const templates = await prisma.followUpTemplate.findMany({
    orderBy: [{ serviceId: "asc" }, { stageOrder: "asc" }, { followUpOrder: "asc" }],
  });

  const serviceIds = Array.from(
    new Set(templates.map((t) => t.serviceId).filter(Boolean) as string[])
  );

  const [services, pipelines] = await Promise.all([
    prisma.service.findMany({
      where: { id: { in: serviceIds } },
      select: { id: true, name: true, slug: true, color: true },
    }),
    prisma.pipeline.findMany({
      include: { stages: { select: { name: true, order: true, color: true } } },
    }),
  ]);

  const serviceById = new Map(services.map((s) => [s.id, s]));
  const stagesByService = new Map<string | null, { name: string; order: number; color: string }[]>();
  for (const p of pipelines) {
    stagesByService.set(p.serviceId, p.stages);
  }

  const enriched = templates.map((t) => {
    const service = t.serviceId ? serviceById.get(t.serviceId) : null;
    const stages = stagesByService.get(t.serviceId ?? null) || stagesByService.get(null) || [];
    const stage = stages.find((s) => s.order === t.stageOrder);
    return {
      ...t,
      service: service ? { id: service.id, name: service.name, slug: service.slug, color: service.color } : null,
      stageName: stage?.name ?? `Etapa ${t.stageOrder}`,
      stageColor: stage?.color ?? "#94a3b8",
    };
  });

  return NextResponse.json(enriched);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await request.json();
  const {
    name,
    serviceId,
    stageOrder,
    followUpOrder,
    channel,
    messageTemplate,
    isAutomatic,
    condition,
  } = body;

  if (!name || !messageTemplate) {
    return NextResponse.json({ error: "Nome e mensagem são obrigatórios" }, { status: 400 });
  }

  const template = await prisma.followUpTemplate.create({
    data: {
      name,
      serviceId: serviceId || undefined,
      stageOrder: stageOrder ?? 0,
      followUpOrder: followUpOrder ?? 1,
      channel: channel || "whatsapp",
      messageTemplate,
      isAutomatic: isAutomatic ?? false,
      ...(condition !== undefined && { condition: condition || undefined }),
    },
  });

  return NextResponse.json(template, { status: 201 });
}
