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

  const response = NextResponse.json(pipeline);
  response.headers.set('Cache-Control', 's-maxage=10, stale-while-revalidate=60');
  return response;
}
