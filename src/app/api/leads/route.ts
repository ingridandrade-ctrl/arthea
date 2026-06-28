import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const serviceSlug = searchParams.get("service");
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const dateFrom = searchParams.get("from");
  const dateTo = searchParams.get("to");

  const where: any = {};

  if (serviceSlug && serviceSlug !== "all") {
    where.services = {
      some: { service: { slug: serviceSlug } },
    };
  }
  if (status) {
    where.status = status;
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
      { email: { contains: search, mode: "insensitive" } },
      { company: { contains: search, mode: "insensitive" } },
    ];
  }
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      where.createdAt.lte = to;
    }
  }

  const leads = await prisma.lead.findMany({
    where,
    take: 50,
    include: {
      services: { include: { service: true, stage: true } },
      _count: { select: { conversations: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(leads);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await request.json();
  const { name, phone, email, company, source, status, serviceIds, serviceCustomData, serviceStages, notes } = body;

  if (!name || !phone) {
    return NextResponse.json({ error: "Nome e telefone são obrigatórios" }, { status: 400 });
  }

  const existing = await prisma.lead.findUnique({ where: { phone } });
  if (existing) {
    return NextResponse.json({ error: "Já existe um lead com este telefone" }, { status: 409 });
  }

  const lead = await prisma.lead.create({
    data: {
      name,
      phone,
      email,
      company,
      source: source || "PROSPECCAO",
      status: status || "ATIVO",
      notes,
    },
  });

  if (serviceIds && Array.isArray(serviceIds)) {
    const { scheduleFollowUpsForLeadService } = await import("@/lib/followups/engine");
    const { triggerFlows } = await import("@/lib/flows/engine");
    for (const serviceId of serviceIds) {
      const customData = serviceCustomData?.[serviceId] || undefined;
      const stageId = serviceStages?.[serviceId] || undefined;
      const ls = await prisma.leadService.create({
        data: { leadId: lead.id, serviceId, customData, stageId },
      });
      if (stageId) {
        await scheduleFollowUpsForLeadService(ls.id, stageId);
        await triggerFlows({
          type: "STAGE_ENTER",
          leadId: lead.id,
          leadServiceId: ls.id,
          stageId,
        });
      }
    }
  }

  const result = await prisma.lead.findUnique({
    where: { id: lead.id },
    include: { services: { include: { service: true } } },
  });

  return NextResponse.json(result, { status: 201 });
}
