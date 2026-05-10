import { prisma } from "@/lib/prisma";

export type CoupleBalance = {
  // Saldo do ponto de vista de A: positivo = B deve A; negativo = A deve B
  netBalance: number;
  whoOwes: "PARTNER_A" | "PARTNER_B" | null;
  amount: number;
  details: {
    aPaidForCouple: number;
    bPaidForCouple: number;
    aPaidForB: number;
    bPaidForA: number;
    settlementsAtoB: number;
    settlementsBtoA: number;
  };
};

export async function computeCoupleBalance(
  householdId: string,
  from?: Date,
  to?: Date
): Promise<CoupleBalance> {
  const txWhere: any = { householdId, type: "EXPENSE" };
  if (from || to) {
    txWhere.date = {};
    if (from) txWhere.date.gte = from;
    if (to) txWhere.date.lte = to;
  }

  const transactions = await prisma.finTransaction.findMany({
    where: txWhere,
    select: { amount: true, owner: true, paidByOwner: true, splitRatio: true },
  });

  const details = {
    aPaidForCouple: 0,
    bPaidForCouple: 0,
    aPaidForB: 0,
    bPaidForA: 0,
    settlementsAtoB: 0,
    settlementsBtoA: 0,
  };

  let balance = 0;
  for (const tx of transactions) {
    const paidBy = tx.paidByOwner;
    if (paidBy !== "PARTNER_A" && paidBy !== "PARTNER_B") continue;

    if (tx.owner === "COUPLE") {
      const r = typeof tx.splitRatio === "number" ? tx.splitRatio : 0.5;
      if (paidBy === "PARTNER_A") {
        const credit = (1 - r) * tx.amount;
        balance += credit;
        details.aPaidForCouple += credit;
      } else {
        const credit = r * tx.amount;
        balance -= credit;
        details.bPaidForCouple += credit;
      }
    } else if (tx.owner === "PARTNER_A" && paidBy === "PARTNER_B") {
      balance -= tx.amount;
      details.bPaidForA += tx.amount;
    } else if (tx.owner === "PARTNER_B" && paidBy === "PARTNER_A") {
      balance += tx.amount;
      details.aPaidForB += tx.amount;
    }
  }

  const settlementWhere: any = { householdId };
  if (from || to) {
    settlementWhere.date = {};
    if (from) settlementWhere.date.gte = from;
    if (to) settlementWhere.date.lte = to;
  }
  const settlements = await prisma.finSettlement.findMany({
    where: settlementWhere,
    select: { amount: true, fromOwner: true, toOwner: true },
  });
  for (const s of settlements) {
    if (s.fromOwner === "PARTNER_A" && s.toOwner === "PARTNER_B") {
      balance += s.amount;
      details.settlementsAtoB += s.amount;
    } else if (s.fromOwner === "PARTNER_B" && s.toOwner === "PARTNER_A") {
      balance -= s.amount;
      details.settlementsBtoA += s.amount;
    }
  }

  const amount = Math.abs(balance);
  const whoOwes =
    Math.abs(balance) < 0.005 ? null : balance > 0 ? "PARTNER_B" : "PARTNER_A";

  return { netBalance: balance, whoOwes, amount, details };
}
