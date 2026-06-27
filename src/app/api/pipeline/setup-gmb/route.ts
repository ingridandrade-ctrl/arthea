import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const GMB_STAGES = [
  { name: "Novo lead", order: 0, color: "#6366f1" },
  { name: "Análise gerada", order: 1, color: "#3b82f6" },
  { name: "Em contato", order: 2, color: "#0ea5e9" },
  { name: "Em negociação", order: 3, color: "#f97316" },
  { name: "Ganho", order: 4, color: "#22c55e" },
  { name: "Perdido", order: 5, color: "#ef4444" },
];

export async function POST() {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const gmb = await prisma.service.findUnique({ where: { slug: "google-meu-negocio" } });
  if (!gmb) {
    return NextResponse.json(
      { error: "Serviço 'google-meu-negocio' não existe. Crie em /sistema/servicos primeiro." },
      { status: 404 },
    );
  }

  const existing = await prisma.pipeline.findUnique({ where: { serviceId: gmb.id } });
  if (existing) {
    return NextResponse.json({ ok: true, action: "already_exists", pipelineId: existing.id });
  }

  const pipeline = await prisma.pipeline.create({
    data: {
      name: "Pipeline GMB",
      serviceId: gmb.id,
      stages: { create: GMB_STAGES },
    },
    include: { stages: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json({
    ok: true,
    action: "created",
    pipelineId: pipeline.id,
    stages: pipeline.stages.map((s) => ({ id: s.id, name: s.name, order: s.order })),
  });
}
