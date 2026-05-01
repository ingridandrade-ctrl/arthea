import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1);
  const defaultTo = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const from = fromParam ? new Date(fromParam) : defaultFrom;
  const to = toParam ? new Date(toParam) : defaultTo;

  const [
    incomePaid,
    incomePending,
    incomeOverdue,
    expensesAgg,
    expensesByCategory,
    paidInvoices,
    expenses,
    activeContracts,
    mrrAgg,
    invoicesByService,
  ] = await Promise.all([
    prisma.invoice.aggregate({
      where: { status: "PAID", paidAt: { gte: from, lte: to } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.invoice.aggregate({
      where: { status: "PENDING", dueDate: { gte: from, lte: to } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.invoice.aggregate({
      where: {
        status: { in: ["PENDING", "OVERDUE"] },
        dueDate: { lt: now },
      },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.expense.aggregate({
      where: { date: { gte: from, lte: to } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.expense.groupBy({
      by: ["category"],
      where: { date: { gte: from, lte: to } },
      _sum: { amount: true },
    }),
    prisma.invoice.findMany({
      where: { status: "PAID", paidAt: { gte: from, lte: to } },
      select: { id: true, paidAt: true, amount: true },
      orderBy: { paidAt: "asc" },
    }),
    prisma.expense.findMany({
      where: { date: { gte: from, lte: to } },
      select: { id: true, date: true, amount: true, category: true },
      orderBy: { date: "asc" },
    }),
    prisma.contract.count({ where: { status: "ACTIVE" } }),
    prisma.contract.aggregate({
      where: { status: "ACTIVE", recurrence: "MONTHLY" },
      _sum: { monthlyValue: true },
    }),
    prisma.invoice.groupBy({
      by: ["serviceId"],
      where: { status: "PAID", paidAt: { gte: from, lte: to } },
      _sum: { amount: true },
    }),
  ]);

  const serviceIds = invoicesByService.map((r) => r.serviceId).filter(Boolean) as string[];
  const services = serviceIds.length
    ? await prisma.service.findMany({
        where: { id: { in: serviceIds } },
        select: { id: true, name: true, color: true },
      })
    : [];

  const revenueByService = invoicesByService.map((r) => {
    const svc = services.find((s) => s.id === r.serviceId);
    return {
      serviceId: r.serviceId,
      service: svc?.name || "Sem serviço",
      color: svc?.color || "#6366f1",
      revenue: r._sum.amount || 0,
    };
  });

  // Daily series
  const dailyMap = new Map<string, { date: string; income: number; expense: number }>();
  for (const inv of paidInvoices) {
    if (!inv.paidAt) continue;
    const k = inv.paidAt.toISOString().slice(0, 10);
    const cur = dailyMap.get(k) || { date: k, income: 0, expense: 0 };
    cur.income += inv.amount;
    dailyMap.set(k, cur);
  }
  for (const exp of expenses) {
    const k = exp.date.toISOString().slice(0, 10);
    const cur = dailyMap.get(k) || { date: k, income: 0, expense: 0 };
    cur.expense += exp.amount;
    dailyMap.set(k, cur);
  }
  const series = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  const totalIncome = incomePaid._sum.amount || 0;
  const totalExpense = expensesAgg._sum.amount || 0;
  const mrr = mrrAgg._sum.monthlyValue || 0;
  const avgTicket = activeContracts > 0 ? mrr / activeContracts : 0;

  return NextResponse.json({
    range: { from: from.toISOString(), to: to.toISOString() },
    totals: {
      income: totalIncome,
      expense: totalExpense,
      profit: totalIncome - totalExpense,
      pending: incomePending._sum.amount || 0,
      overdue: incomeOverdue._sum.amount || 0,
      mrr,
      avgTicket,
      activeContracts,
      paidCount: incomePaid._count,
      pendingCount: incomePending._count,
      overdueCount: incomeOverdue._count,
      expenseCount: expensesAgg._count,
      projection3Months: mrr * 3,
    },
    expensesByCategory: expensesByCategory.map((e) => ({
      category: e.category,
      total: e._sum.amount || 0,
    })),
    revenueByService,
    series,
  });
}
