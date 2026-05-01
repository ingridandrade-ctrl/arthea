import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if ((session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    mrrResult,
    monthRevenue,
    yearRevenue,
    activeContracts,
    overdueInvoices,
    pendingInvoices,
    paidThisMonth,
    canceledRecent,
    revenueByService,
  ] = await Promise.all([
    prisma.contract.aggregate({
      where: { status: "ACTIVE", recurrence: "MONTHLY" },
      _sum: { monthlyValue: true },
    }),
    prisma.invoice.aggregate({
      where: { status: "PAID", paidAt: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.invoice.aggregate({
      where: { status: "PAID", paidAt: { gte: startOfYear } },
      _sum: { amount: true },
    }),
    prisma.contract.count({ where: { status: "ACTIVE" } }),
    prisma.invoice.count({
      where: { status: { in: ["PENDING", "OVERDUE"] }, dueDate: { lt: now } },
    }),
    prisma.invoice.count({
      where: { status: "PENDING", dueDate: { gte: now } },
    }),
    prisma.invoice.count({
      where: { status: "PAID", paidAt: { gte: startOfMonth } },
    }),
    prisma.contract.count({
      where: { status: "CANCELED", updatedAt: { gte: thirtyDaysAgo } },
    }),
    prisma.contract.groupBy({
      by: ["serviceId"],
      where: { status: "ACTIVE" },
      _sum: { monthlyValue: true },
      _count: true,
    }),
  ]);

  // Resolve service names
  const serviceIds = revenueByService.map((r) => r.serviceId).filter(Boolean) as string[];
  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds } },
    select: { id: true, name: true, color: true },
  });

  const revenueByServiceNamed = revenueByService.map((r) => {
    const svc = services.find((s) => s.id === r.serviceId);
    return {
      service: svc?.name || "Sem serviço",
      color: svc?.color || "#6366f1",
      revenue: r._sum.monthlyValue || 0,
      count: r._count,
    };
  });

  const mrr = mrrResult._sum.monthlyValue || 0;
  const avgTicket = activeContracts > 0 ? mrr / activeContracts : 0;
  const churnRate = activeContracts > 0
    ? ((canceledRecent / (activeContracts + canceledRecent)) * 100).toFixed(1)
    : "0";

  return NextResponse.json({
    mrr,
    monthRevenue: monthRevenue._sum.amount || 0,
    yearRevenue: yearRevenue._sum.amount || 0,
    avgTicket,
    activeContracts,
    overdueInvoices,
    pendingInvoices,
    paidThisMonth,
    churnRate,
    revenueByService: revenueByServiceNamed,
    projection3Months: mrr * 3,
  });
}
