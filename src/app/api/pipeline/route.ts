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

  const lsWhere: any = {};
  let pipelineWhere: any = { serviceId: null };

  if (serviceSlug && serviceSlug !== "all") {
    lsWhere.service = { slug: serviceSlug };
    const pipelineId = await ensurePipelineForService(serviceSlug);
    if (pipelineId) pipelineWhere = { id: pipelineId };
  }

  const pipeline = await prisma.pipeline.findFirst({
    where: pipelineWhere,
    include: {
      stages: {
        orderBy: { order: "asc" },
        include: {
          leadServices: {
            where: lsWhere,
            take: 20,
            select: {
              id: true,
              value: true,
              stageId: true,
              createdAt: true,
              lead: {
                select: {
                  id: true,
                  name: true,
                  source: true,
                  createdAt: true,
                  services: { select: { service: { select: { id: true, name: true, color: true } } } },
                },
              },
              service: { select: { id: true, name: true, color: true } },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  if (!pipeline) {
    return NextResponse.json([]);
  }

  // Anexa contagem de fluxos por lead (rodando + completados), pra mostrar
  // badge no card do pipeline. Faz uma query única agrupando por leadId
  // pra evitar N+1 (cada lead ia disparar uma consulta separada).
  const allLeadIds = pipeline.stages
    .flatMap((s) => s.leadServices.map((ls) => ls.lead.id));
  const flowCounts =
    allLeadIds.length > 0
      ? await prisma.flowExecution.groupBy({
          by: ["leadId", "status"],
          where: { leadId: { in: allLeadIds } },
          _count: { _all: true },
        })
      : [];
  const countsByLead = new Map<string, { running: number; total: number }>();
  for (const c of flowCounts) {
    const cur = countsByLead.get(c.leadId) || { running: 0, total: 0 };
    cur.total += c._count._all;
    if (c.status === "running") cur.running += c._count._all;
    countsByLead.set(c.leadId, cur);
  }
  const enriched = {
    ...pipeline,
    stages: pipeline.stages.map((s) => ({
      ...s,
      leadServices: s.leadServices.map((ls) => ({
        ...ls,
        flowCounts: countsByLead.get(ls.lead.id) || { running: 0, total: 0 },
      })),
    })),
  };

  const response = NextResponse.json(enriched);
  response.headers.set('Cache-Control', 's-maxage=10, stale-while-revalidate=60');
  return response;
}
