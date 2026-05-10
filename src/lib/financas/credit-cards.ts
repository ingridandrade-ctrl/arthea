import { prisma } from "@/lib/prisma";

function clampDay(year: number, month: number, day: number): Date {
  const lastDay = new Date(year, month + 1, 0).getDate();
  const d = Math.min(Math.max(day, 1), lastDay);
  return new Date(year, month, d, 0, 0, 0, 0);
}

export function invoicePeriodForDate(
  date: Date,
  closingDay: number
): { year: number; month: number } {
  const d = new Date(date);
  if (d.getDate() < closingDay) {
    return { year: d.getFullYear(), month: d.getMonth() };
  }
  const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  return { year: next.getFullYear(), month: next.getMonth() };
}

export function computeInvoiceDates(
  year: number,
  month: number,
  closingDay: number,
  dueDay: number
): { closingDate: Date; dueDate: Date } {
  const prev = new Date(year, month - 1, 1);
  const closingDate = clampDay(prev.getFullYear(), prev.getMonth(), closingDay);
  let dueDate = clampDay(year, month, dueDay);
  if (dueDate <= closingDate) {
    const nx = new Date(year, month + 1, 1);
    dueDate = clampDay(nx.getFullYear(), nx.getMonth(), dueDay);
  }
  return { closingDate, dueDate };
}

export async function ensureInvoice(
  householdId: string,
  card: { id: string; closingDay: number | null; dueDay: number | null },
  date: Date
) {
  if (!card.closingDay || !card.dueDay) return null;
  const { year, month } = invoicePeriodForDate(date, card.closingDay);
  const existing = await prisma.finCreditCardInvoice.findUnique({
    where: { accountId_year_month: { accountId: card.id, year, month } },
  });
  if (existing) return existing;
  const { closingDate, dueDate } = computeInvoiceDates(year, month, card.closingDay, card.dueDay);
  return prisma.finCreditCardInvoice.create({
    data: {
      householdId,
      accountId: card.id,
      year,
      month,
      closingDate,
      dueDate,
      status: "OPEN",
    },
  });
}
