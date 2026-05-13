import { prisma } from "@/lib/prisma";

function clampDay(year: number, month: number, day: number): Date {
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const d = Math.min(Math.max(day, 1), lastDay);
  return new Date(Date.UTC(year, month, d, 12, 0, 0, 0));
}

export function invoicePeriodForDate(
  date: Date,
  closingDay: number
): { year: number; month: number } {
  const d = new Date(date);
  const day = d.getUTCDate();
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth();
  if (day < closingDay) {
    return { year, month };
  }
  const nextMonth = month + 1;
  const nextYear = nextMonth > 11 ? year + 1 : year;
  return { year: nextYear, month: nextMonth % 12 };
}

export function computeInvoiceDates(
  year: number,
  month: number,
  closingDay: number,
  dueDay: number
): { closingDate: Date; dueDate: Date } {
  const prevMonth = month - 1;
  const prevYear = prevMonth < 0 ? year - 1 : year;
  const closingDate = clampDay(prevYear, (prevMonth + 12) % 12, closingDay);
  let dueDate = clampDay(year, month, dueDay);
  if (dueDate <= closingDate) {
    const nxMonth = month + 1;
    const nxYear = nxMonth > 11 ? year + 1 : year;
    dueDate = clampDay(nxYear, nxMonth % 12, dueDay);
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
