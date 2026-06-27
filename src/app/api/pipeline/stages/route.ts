import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensurePipelineForService } from "@/lib/pipeline/bootstrap";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const serviceSlug = searchParams.get("service");

  let pipelineWhere: any = { serviceId: null };
  if (serviceSlug && serviceSlug !== "all") {
    const pipelineId = await ensurePipelineForService(serviceSlug);
    if (pipelineId) pipelineWhere = { id: pipelineId };
  }

  const pipeline = await prisma.pipeline.findFirst({
    where: pipelineWhere,
    include: {
      stages: {
        orderBy: { order: "asc" },
        include: {
          _count: { select: { leadServices: true } },
        },
      },
    },
  });

  if (!pipeline) {
    return NextResponse.json({ pipeline: null, stages: [] });
  }

  return NextResponse.json({
    pipeline: { id: pipeline.id, name: pipeline.name },
    stages: pipeline.stages.map((s) => ({
      id: s.id,
      name: s.name,
      order: s.order,
      color: s.color,
      leadServiceCount: s._count.leadServices,
    })),
  });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "MANAGER") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = await request.json();
  const { name, color } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
  }

  let pipeline = await prisma.pipeline.findFirst();
  if (!pipeline) {
    pipeline = await prisma.pipeline.create({ data: { name: "Pipeline Comercial" } });
  }

  const maxOrder = await prisma.pipelineStage.aggregate({
    where: { pipelineId: pipeline.id },
    _max: { order: true },
  });

  const stage = await prisma.pipelineStage.create({
    data: {
      name: name.trim(),
      color: color || "#6366f1",
      order: (maxOrder._max.order ?? -1) + 1,
      pipelineId: pipeline.id,
    },
  });

  return NextResponse.json(stage, { status: 201 });
}
