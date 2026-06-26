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
  const lsWhere: any = {};

  if (serviceSlug && serviceSlug !== "all") {
    leadWhere.services = { some: { service: { slug: serviceSlug } } };
    lsWhere.service = { slug: serviceSlug };
  }

  if (stageId && stageId !== "all") {
    lsWhere.stageId = stageId;
  }

  if (dateFrom || dateTo) {
    const dateFilter: any = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom);
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      dateFilter.lte = to;
    }
    leadWhere.createdAt = dateFilter;
    lsWhere.createdAt = dateFilter;
  }

  const [totalLeads, closedLeadServices, recentLeads, services] =
    await Promise.all([
      prisma.lead.count({ where: leadWhere }),
      prisma.leadService.findMany({
        where: {
          ...lsWhere,
          stage: { name: "Fechado Ganho" },
        },
        select: { value: true },
      }),
      prisma.lead.findMany({
        where: leadWhere,
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { services: { include: { service: true, stage: true } } },
      }),
      prisma.service.findMany({
        include: {
          _count: { select: { leads: true } },
        },
      }),
    ]);

  const totalRevenue = closedLeadServices.reduce((sum, d) => sum + (d.value || 0), 0);
  const conversionRate =
    totalLeads > 0 ? (closedLeadServices.length / totalLeads) * 100 : 0;

  const leadsByService = services.map((s) => ({
    service: s.name,
    count: s._count.leads,
    color: s.color,
  }));

  const pipeline = await prisma.pipeline.findFirst({
    include: {
      stages: {
        orderBy: { order: "asc" },
        include: {
          _count: {
            select: { leadServices: true },
          },
        },
      },
    },
  });

  const dealsByStage = (pipeline?.stages || []).map((s) => ({
    stage: s.name,
    count: s._count.leadServices,
    color: s.color,
  }));

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
    prisma.leadService.count({
      where: {
        ...lsWhere,
        stage: { order: { lt: 5 } },
        updatedAt: { lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  const response = NextResponse.json({
    totalLeads,
    totalRevenue,
    conversionRate: Math.round(conversionRate * 10) / 10,
    leadsByService,
    dealsByStage,
    recentLeads,
    pendingFollowUpsToday,
    staleLeadsCount,
  });
  response.headers.set('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
  return response;
}
