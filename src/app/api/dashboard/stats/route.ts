import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const serviceSlug = searchParams.get("service");

  // Build filter for leads with service tag
  const leadWhere: any = {};
  const dealWhere: any = {};

  if (serviceSlug && serviceSlug !== "all") {
    leadWhere.services = { some: { service: { slug: serviceSlug } } };
    dealWhere.service = { slug: serviceSlug };
  }

  const [totalLeads, totalDeals, closedDeals, recentLeads, services] =
    await Promise.all([
      prisma.lead.count({ where: leadWhere }),
      prisma.deal.count({ where: dealWhere }),
      prisma.deal.findMany({
        where: {
          ...dealWhere,
          stage: { name: "Fechado Ganho" },
        },
        select: { value: true },
      }),
      prisma.lead.findMany({
        where: leadWhere,
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { services: { include: { service: true } } },
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

  // Get pipeline stages with deal counts
  const pipeline = await prisma.pipeline.findFirst({
    include: {
      stages: {
        orderBy: { order: "asc" },
        include: {
          _count: {
            select: { deals: true },
          },
        },
      },
    },
  });

  const dealsByStage = (pipeline?.stages || []).map((s) => ({
    stage: s.name,
    count: s._count.deals,
    color: s.color,
  }));

  // Follow-up stats
  const now = new Date();
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const [pendingFollowUpsToday, staleLeadsCount] = await Promise.all([
    prisma.followUp.count({
      where: {
        status: "pending",
        scheduledAt: { lte: todayEnd },
      },
    }),
    prisma.deal.count({
      where: {
        ...dealWhere,
        stage: { order: { lt: 5 } }, // Not closed
        updatedAt: { lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  return NextResponse.json({
    totalLeads,
    totalDeals,
    totalRevenue,
    conversionRate: Math.round(conversionRate * 10) / 10,
    leadsByService,
    dealsByStage,
    recentLeads,
    pendingFollowUpsToday,
    staleLeadsCount,
  });
}
