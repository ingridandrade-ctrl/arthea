import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const serviceSlug = searchParams.get("service");
  const stageId = searchParams.get("stage");
  const dateFrom = searchParams.get("from");
  const dateTo = searchParams.get("to");

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

  const [totalLeads, totalLeadServices, closedLeadServices, recentLeads, services, lsCountsByService] =
    await Promise.all([
      prisma.lead.count({ where: leadWhere }),
      prisma.leadService.count({ where: lsWhere }),
      prisma.leadService.findMany({
        where: {
          ...lsWhere,
          OR: [
            { stage: { name: { contains: "Ganho" } } },
            { lead: { status: "CLIENTE" } },
          ],
        },
        select: { value: true, serviceId: true },
      }),
      prisma.lead.findMany({
        where: leadWhere,
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { services: { include: { service: true, stage: true } } },
      }),
      prisma.service.findMany({ select: { id: true, name: true, color: true, slug: true } }),
      prisma.leadService.groupBy({
        by: ["serviceId"],
        where: lsWhere,
        _count: { _all: true },
      }),
    ]);

  const countByServiceId = new Map(lsCountsByService.map((r) => [r.serviceId, r._count._all]));

  const totalRevenue = closedLeadServices.reduce((sum, d) => sum + (d.value || 0), 0);
  const conversionRate =
    totalLeads > 0 ? (closedLeadServices.length / totalLeads) * 100 : 0;

  const revenueByServiceId = new Map<string, number>();
  for (const ls of closedLeadServices) {
    revenueByServiceId.set(ls.serviceId, (revenueByServiceId.get(ls.serviceId) || 0) + (ls.value || 0));
  }

  const leadsByService = services
    .filter((s) => !serviceSlug || serviceSlug === "all" || s.slug === serviceSlug)
    .map((s) => ({
      service: s.name,
      count: countByServiceId.get(s.id) || 0,
      color: s.color,
    }));

  const revenueByService = services
    .filter((s) => !serviceSlug || serviceSlug === "all" || s.slug === serviceSlug)
    .map((s) => ({
      service: s.name,
      value: revenueByServiceId.get(s.id) || 0,
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
    totalLeadServices,
    totalRevenue,
    conversionRate: Math.round(conversionRate * 10) / 10,
    leadsByService,
    revenueByService,
    dealsByStage,
    recentLeads,
    pendingFollowUpsToday,
    staleLeadsCount,
  });
  response.headers.set('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
  return response;
}
