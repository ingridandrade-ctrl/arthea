import { prisma } from "@/lib/prisma";
import { ensureInvoice } from "./credit-cards";

type RecurringRule = {
  id: string;
  householdId: string;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amount: number;
  description: string;
  notes: string | null;
  owner: "PARTNER_A" | "PARTNER_B" | "COUPLE";
  accountId: string;
  toAccountId: string | null;
  categoryId: string | null;
  frequency: "WEEKLY" | "MONTHLY" | "YEARLY";
  dayOfMonth: number | null;
  dayOfWeek: number | null;
  monthOfYear: number | null;
  startDate: Date;
  endDate: Date | null;
  lastGeneratedAt: Date | null;
  active: boolean;
};

function dayOnly(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function clampDay(year: number, month: number, day: number): Date {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(Math.max(day, 1), lastDay), 0, 0, 0, 0);
}

export function nextOccurrencesUntil(rule: RecurringRule, until: Date): Date[] {
  if (!rule.active) return [];
  const limit = rule.endDate && rule.endDate < until ? rule.endDate : until;
  const start = rule.lastGeneratedAt
    ? new Date(rule.lastGeneratedAt.getTime() + 1)
    : rule.startDate;

  const occurrences: Date[] = [];

  if (rule.frequency === "MONTHLY") {
    const day = rule.dayOfMonth ?? rule.startDate.getDate();
    let cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    if (cursor < new Date(rule.startDate.getFullYear(), rule.startDate.getMonth(), 1)) {
      cursor = new Date(rule.startDate.getFullYear(), rule.startDate.getMonth(), 1);
    }
    while (cursor <= limit) {
      const candidate = clampDay(cursor.getFullYear(), cursor.getMonth(), day);
      if (candidate >= rule.startDate && candidate >= start && candidate <= limit) {
        occurrences.push(candidate);
      }
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    }
  } else if (rule.frequency === "WEEKLY") {
    const dow = rule.dayOfWeek ?? rule.startDate.getDay();
    let cursor = dayOnly(start);
    while (cursor <= limit) {
      if (cursor.getDay() === dow && cursor >= rule.startDate) {
        occurrences.push(new Date(cursor));
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  } else if (rule.frequency === "YEARLY") {
    const month = (rule.monthOfYear ?? rule.startDate.getMonth() + 1) - 1;
    const day = rule.dayOfMonth ?? rule.startDate.getDate();
    let year = start.getFullYear();
    while (true) {
      const candidate = clampDay(year, month, day);
      if (candidate > limit) break;
      if (candidate >= rule.startDate && candidate >= start) {
        occurrences.push(candidate);
      }
      year += 1;
    }
  }

  return occurrences;
}

export async function runRecurringForHousehold(householdId: string, until: Date = new Date()) {
  const rules = await prisma.finRecurringRule.findMany({
    where: { householdId, active: true },
    include: {
      account: { select: { id: true, type: true, closingDay: true, dueDay: true } },
    },
  });

  let created = 0;
  for (const rule of rules) {
    const occs = nextOccurrencesUntil(rule as any, until);
    if (occs.length === 0) continue;

    for (const date of occs) {
      let invoiceId: string | null = null;
      if (rule.type === "EXPENSE" && rule.account.type === "CREDIT_CARD") {
        const inv = await ensureInvoice(householdId, rule.account, date);
        invoiceId = inv?.id ?? null;
      }
      await prisma.finTransaction.create({
        data: {
          householdId,
          type: rule.type,
          amount: rule.amount,
          date,
          description: rule.description,
          notes: rule.notes,
          owner: rule.owner,
          accountId: rule.accountId,
          toAccountId: rule.type === "TRANSFER" ? rule.toAccountId : null,
          categoryId: rule.type === "TRANSFER" ? null : rule.categoryId,
          recurringId: rule.id,
          invoiceId,
        },
      });
      created += 1;
    }

    const last = occs[occs.length - 1];
    await prisma.finRecurringRule.update({
      where: { id: rule.id },
      data: { lastGeneratedAt: last },
    });
  }

  return { created };
}
