import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
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
            include: {
              lead: {
                include: { services: { include: { service: true } } },
              },
              service: true,
              assignedTo: true,
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
