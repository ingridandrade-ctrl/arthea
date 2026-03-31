import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const serviceSlug = searchParams.get("service");

  const dealWhere: any = {};
  if (serviceSlug && serviceSlug !== "all") {
    dealWhere.service = { slug: serviceSlug };
  }

  // Revenue by month (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const closedDeals = await prisma.deal.findMany({
    where: {
      ...dealWhere,
      stage: { name: "Fechado Ganho" },
      closedAt: { gte: sixMonthsAgo },
    },
    select: { value: true, closedAt: true, createdAt: true },
  });

  const revenueByMonth: Record<string, number> = {};
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
    revenueByMonth[key] = 0;
    months.push({ key, label });
  }

  for (const deal of closedDeals) {
    const date = deal.closedAt || deal.createdAt;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (revenueByMonth[key] !== undefined) {
      revenueByMonth[key] += deal.value || 0;
    }
  }

  // Conversion by service
  const services = await prisma.service.findMany({
    include: {
      leads: { select: { id: true } },
      deals: {
        where: { stage: { name: "Fechado Ganho" } },
        select: { id: true },
      },
    },
  });

  const conversionByService = services.map((s) => ({
    service: s.name,
    rate: s.leads.length > 0
      ? Math.round((s.deals.length / s.leads.length) * 100 * 10) / 10
      : 0,
    color: s.color,
  }));

  // Leads by source
  const leadWhere: any = {};
  if (serviceSlug && serviceSlug !== "all") {
    leadWhere.services = { some: { service: { slug: serviceSlug } } };
  }

  const leadsBySourceRaw = await prisma.lead.groupBy({
    by: ["source"],
    where: leadWhere,
    _count: { id: true },
  });

  const sourceLabels: Record<string, string> = {
    WHATSAPP: "WhatsApp",
    WEBSITE: "Website",
    MANUAL: "Manual",
    REFERRAL: "Indicação",
    QUIZ: "Quiz",
  };

  const leadsBySource = leadsBySourceRaw.map((item) => ({
    source: sourceLabels[item.source] || item.source,
    count: item._count.id,
  }));

  // Pipeline velocity
  const allDeals = await prisma.deal.findMany({
    where: dealWhere,
    select: {
      stageId: true,
      stage: { select: { name: true, order: true, color: true } },
      createdAt: true,
      updatedAt: true,
    },
  });

  const stageGroups: Record<string, { name: string; totalDays: number; count: number; order: number }> = {};
  for (const deal of allDeals) {
    const key = deal.stage.name;
    const days = Math.max(1, Math.ceil((deal.updatedAt.getTime() - deal.createdAt.getTime()) / (1000 * 60 * 60 * 24)));
    if (!stageGroups[key]) {
      stageGroups[key] = { name: key, totalDays: 0, count: 0, order: deal.stage.order };
    }
    stageGroups[key].totalDays += days;
    stageGroups[key].count += 1;
  }

  const pipelineVelocity = Object.values(stageGroups)
    .sort((a, b) => a.order - b.order)
    .map((g) => ({
      stage: g.name,
      avgDays: Math.round(g.totalDays / g.count),
    }));

  // Top deals
  const topDeals = await prisma.deal.findMany({
    where: {
      ...dealWhere,
      value: { not: null },
    },
    orderBy: { value: "desc" },
    take: 5,
    include: {
      lead: { select: { name: true } },
      stage: { select: { name: true } },
    },
  });

  return NextResponse.json({
    revenueByMonth: months.map((m) => ({ month: m.label, revenue: revenueByMonth[m.key] })),
    conversionByService,
    leadsBySource,
    pipelineVelocity,
    topDeals: topDeals.map((d) => ({
      id: d.id,
      title: d.title,
      value: d.value || 0,
      stage: d.stage.name,
      leadName: d.lead.name,
    })),
  });
}
