import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const serviceSlug = searchParams.get("service");

  const where: any = {};
  if (serviceSlug && serviceSlug !== "all") {
    where.service = { slug: serviceSlug };
  }

  const pipelines = await prisma.pipeline.findMany({
    where,
    include: {
      service: true,
      stages: {
        orderBy: { order: "asc" },
        include: {
          deals: {
            include: {
              lead: true,
              service: true,
              assignedTo: true,
            },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  return NextResponse.json(pipelines);
}
