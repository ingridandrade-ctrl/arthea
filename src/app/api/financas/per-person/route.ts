import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireHousehold, HouseholdAuthError } from "@/lib/financas/session";

type CategoryAgg = {
  id: string | null;
  name: string;
  color: string;
  amount: number;
};

function emptyBucket() {
  return {
    total: 0,
    byCategory: new Map<string, CategoryAgg>(),
  };
}

function addToBucket(
  bucket: ReturnType<typeof emptyBucket>,
  amount: number,
  category: { id: string; name: string; color: string } | null
) {
  bucket.total += amount;
  const key = category?.id ?? "__none__";
  const existing = bucket.byCategory.get(key);
  if (existing) {
    existing.amount += amount;
  } else {
    bucket.byCategory.set(key, {
      id: category?.id ?? null,
      name: category?.name ?? "Sem categoria",
      color: category?.color ?? "#94a3b8",
      amount,
    });
  }
}

function bucketToJson(bucket: ReturnType<typeof emptyBucket>) {
  return {
    total: bucket.total,
    byCategory: Array.from(bucket.byCategory.values()).sort((a, b) => b.amount - a.amount),
  };
}

export async function GET(req: Request) {
  try {
    const household = await requireHousehold();
    const { searchParams } = new URL(req.url);
    const fromStr = searchParams.get("from");
    const toStr = searchParams.get("to");
    const cardGrouping = searchParams.get("cardGrouping") === "purchase_date"
      ? "purchase_date"
      : "fatura_month";

    const from = fromStr ? new Date(fromStr) : null;
    const to = toStr ? new Date(toStr) : null;

    const transactions = await prisma.finTransaction.findMany({
      where: { householdId: household.id, type: "EXPENSE" },
      select: {
        amount: true,
        owner: true,
        splitRatio: true,
        date: true,
        category: { select: { id: true, name: true, color: true } },
        account: { select: { type: true } },
        invoice: { select: { dueDate: true } },
      },
    });

    function effectiveDate(tx: typeof transactions[number]): Date {
      if (
        cardGrouping === "fatura_month" &&
        tx.account.type === "CREDIT_CARD" &&
        tx.invoice
      ) {
        return new Date(tx.invoice.dueDate);
      }
      return new Date(tx.date);
    }

    const inRange = transactions.filter((t) => {
      if (!from && !to) return true;
      const d = effectiveDate(t);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });

    const aOwn = emptyBucket();
    const bOwn = emptyBucket();
    const aCouple = emptyBucket();
    const bCouple = emptyBucket();

    for (const tx of inRange) {
      if (tx.owner === "PARTNER_A") {
        addToBucket(aOwn, tx.amount, tx.category);
      } else if (tx.owner === "PARTNER_B") {
        addToBucket(bOwn, tx.amount, tx.category);
      } else {
        const r = typeof tx.splitRatio === "number" ? tx.splitRatio : 0.5;
        addToBucket(aCouple, r * tx.amount, tx.category);
        addToBucket(bCouple, (1 - r) * tx.amount, tx.category);
      }
    }

    return NextResponse.json({
      partnerAName: household.partnerAName,
      partnerBName: household.partnerBName,
      partnerA: {
        own: bucketToJson(aOwn),
        couple: bucketToJson(aCouple),
        total: aOwn.total + aCouple.total,
      },
      partnerB: {
        own: bucketToJson(bOwn),
        couple: bucketToJson(bCouple),
        total: bOwn.total + bCouple.total,
      },
      filters: { cardGrouping },
    });
  } catch (e) {
    if (e instanceof HouseholdAuthError) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    throw e;
  }
}
