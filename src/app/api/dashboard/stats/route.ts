import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const serviceSlug = searchParams.get("service");

  const serviceFilter: any = {};
  if (serviceSlug && serviceSlug !== "all") {
    serviceFilter.service = { slug: serviceSlug };
  }

  const [totalLeads, totalDeals, closedDeals, recentLeads, services] =
    await Promise.all([
      prisma.lead.count({ where: serviceFilter }),
      prisma.deal.count({ where: serviceFilter }),
      prisma.deal.findMany({
        where: {
          ...serviceFilter,
          stage: { name: "Fechado Ganho" },
        },
        select: { value: true },
      }),
      prisma.lead.findMany({
        where: serviceFilter,
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { service: true },
      }),
      prisma.service.findMany({
        include: {
          _count: { select: { leads: true, deals: true } },
        },
      }),
    ]);

  const totalRevenue = closedDeals.reduce((sum, d) => sum + (d.value || 0), 0);
  const conversionRate =
    totalLeads > 0 ? (closedDeals.length / totalLeads) * 100 : 0;

  const leadsByService = services.map((s) => ({
    service: s.name,
    count: s._count.leads,
    color: s.color,
  }));

  // Get deals by stage
  const stages = await prisma.pipelineStage.findMany({
    include: { _count: { select: { deals: true } } },
    orderBy: { order: "asc" },
    distinct: ["name"],
  });

  const dealsByStage = stages.map((s) => ({
    stage: s.name,
    count: s._count.deals,
    color: s.color,
  }));

  return NextResponse.json({
    totalLeads,
    totalDeals,
    totalRevenue,
    conversionRate: Math.round(conversionRate * 10) / 10,
    leadsByService,
    dealsByStage,
    recentLeads,
  });
}
