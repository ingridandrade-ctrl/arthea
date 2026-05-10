import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireHousehold, HouseholdAuthError } from "@/lib/financas/session";
import { computeAccountBalances } from "@/lib/financas/balances";

export async function GET(req: Request) {
  try {
    const household = await requireHousehold();
    const { searchParams } = new URL(req.url);

    const monthParam = searchParams.get("month"); // formato YYYY-MM
    const now = new Date();
    let year: number;
    let month: number;
    if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
      const [y, m] = monthParam.split("-").map(Number);
      year = y;
      month = m - 1;
    } else {
      year = now.getFullYear();
      month = now.getMonth();
    }

    const start = new Date(year, month, 1, 0, 0, 0, 0);
    const end = new Date(year, month + 1, 1, 0, 0, 0, 0);

    const [accounts, balances, monthAgg, byCategory, byOwner, last6] = await Promise.all([
      prisma.finAccount.findMany({
        where: { householdId: household.id, archived: false },
        orderBy: { createdAt: "asc" },
      }),
      computeAccountBalances(household.id),
      prisma.finTransaction.groupBy({
        by: ["type"],
        where: { householdId: household.id, date: { gte: start, lt: end } },
        _sum: { amount: true },
      }),
      prisma.finTransaction.groupBy({
        by: ["categoryId", "type"],
        where: {
          householdId: household.id,
          date: { gte: start, lt: end },
          type: "EXPENSE",
        },
        _sum: { amount: true },
      }),
      prisma.finTransaction.groupBy({
        by: ["owner", "type"],
        where: { householdId: household.id, date: { gte: start, lt: end } },
        _sum: { amount: true },
      }),
      prisma.finTransaction.findMany({
        where: {
          householdId: household.id,
          date: {
            gte: new Date(year, month - 5, 1),
            lt: new Date(year, month + 1, 1),
          },
          type: { in: ["INCOME", "EXPENSE"] },
        },
        select: { type: true, amount: true, date: true },
      }),
    ]);

    const balanceMap = new Map(balances.map((b) => [b.accountId, b.balance]));

    const totalBalance = accounts.reduce(
      (acc, a) => acc + (balanceMap.get(a.id) ?? a.initialBalance),
      0
    );
    const totalIncome = monthAgg.find((m) => m.type === "INCOME")?._sum.amount ?? 0;
    const totalExpense = monthAgg.find((m) => m.type === "EXPENSE")?._sum.amount ?? 0;

    const categoryIds = byCategory.map((c) => c.categoryId).filter((id): id is string => !!id);
    const cats = categoryIds.length
      ? await prisma.finCategory.findMany({
          where: { id: { in: categoryIds }, householdId: household.id },
        })
      : [];
    const catMap = new Map(cats.map((c) => [c.id, c]));
    const expensesByCategory = byCategory
      .map((row) => {
        const cat = row.categoryId ? catMap.get(row.categoryId) : null;
        return {
          categoryId: row.categoryId,
          name: cat?.name || "Sem categoria",
          color: cat?.color || "#a3a3a3",
          icon: cat?.icon || null,
          amount: row._sum.amount ?? 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    const ownerSummary: Record<string, { income: number; expense: number }> = {
      PARTNER_A: { income: 0, expense: 0 },
      PARTNER_B: { income: 0, expense: 0 },
      COUPLE: { income: 0, expense: 0 },
    };
    for (const row of byOwner) {
      const o = row.owner;
      if (row.type === "INCOME") ownerSummary[o].income += row._sum.amount ?? 0;
      else if (row.type === "EXPENSE") ownerSummary[o].expense += row._sum.amount ?? 0;
    }

    const monthly: Record<string, { income: number; expense: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, month - i, 1);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthly[k] = { income: 0, expense: 0 };
    }
    for (const t of last6) {
      const d = new Date(t.date);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!monthly[k]) continue;
      if (t.type === "INCOME") monthly[k].income += t.amount;
      else if (t.type === "EXPENSE") monthly[k].expense += t.amount;
    }
    const monthlySeries = Object.entries(monthly).map(([k, v]) => ({ month: k, ...v }));

    return NextResponse.json({
      household: {
        id: household.id,
        partnerAName: household.partnerAName,
        partnerBName: household.partnerBName,
        currency: household.currency,
      },
      period: {
        year,
        month: month + 1,
        label: start.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
      },
      totals: {
        balance: totalBalance,
        income: totalIncome,
        expense: totalExpense,
        net: totalIncome - totalExpense,
      },
      accounts: accounts.map((a) => ({
        ...a,
        balance: balanceMap.get(a.id) ?? a.initialBalance,
      })),
      expensesByCategory,
      byOwner: ownerSummary,
      monthlySeries,
    });
  } catch (e) {
    if (e instanceof HouseholdAuthError) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    throw e;
  }
}
