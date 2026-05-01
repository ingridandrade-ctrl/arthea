import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const serviceSlug = searchParams.get("service");

  // Build deal filter for service tag filtering
  const dealWhere: any = {};
  if (serviceSlug && serviceSlug !== "all") {
    dealWhere.service = { slug: serviceSlug };
  }

  // Single pipeline — get the first (and only) pipeline
  const pipeline = await prisma.pipeline.findFirst({
    include: {
      stages: {
        orderBy: { order: "asc" },
        include: {
          deals: {
            where: dealWhere,
            take: 20,
            select: {
              id: true,
              title: true,
              value: true,
              stageId: true,
              createdAt: true,
              lead: {
                select: {
                  id: true,
                  name: true,
                  services: { select: { service: { select: { id: true, name: true, color: true } } } },
                },
              },
              service: { select: { id: true, name: true, color: true } },
              assignedTo: { select: { id: true, name: true } },
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

  return NextResponse.json(pipeline);
}
