import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const serviceSlug = searchParams.get("service");

  const where: any = {};
  if (serviceSlug && serviceSlug !== "all") {
    where.service = { slug: serviceSlug };
  }

  const leadServices = await prisma.leadService.findMany({
    where,
    include: {
      lead: {
        include: { services: { include: { service: true } } },
      },
      service: true,
      stage: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(leadServices);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await request.json();
  const { leadId, serviceId, stageId, value } = body;

  if (!leadId || !serviceId || !stageId) {
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
  }

  const leadService = await prisma.leadService.upsert({
    where: { leadId_serviceId: { leadId, serviceId } },
    update: { stageId, value },
    create: { leadId, serviceId, stageId, value },
    include: {
      lead: { include: { services: { include: { service: true } } } },
      service: true,
      stage: true,
    },
  });

  const { scheduleFollowUpsForLeadService } = await import("@/lib/followups/engine");
  await scheduleFollowUpsForLeadService(leadService.id, stageId);

  return NextResponse.json(leadService, { status: 201 });
}
