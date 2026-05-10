import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireHousehold, HouseholdAuthError } from "@/lib/financas/session";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const household = await requireHousehold();
    const inv = await prisma.finCreditCardInvoice.findFirst({
      where: { id: params.id, householdId: household.id },
      include: { transactions: { select: { amount: true } }, account: true },
    });
    if (!inv) return NextResponse.json({ error: "Não encontrada" }, { status: 404 });

    const body = await req.json();
    const action = body?.action;

    if (action === "pay") {
      const skipTransfer = body?.skipTransfer === true;
      const paidAt = body?.paidAt ? new Date(body.paidAt) : new Date();

      if (skipTransfer) {
        const updated = await prisma.finCreditCardInvoice.update({
          where: { id: inv.id },
          data: {
            paidAt,
            paymentAccountId: null,
            status: "PAID",
          },
        });
        return NextResponse.json({ invoice: updated });
      }

      const paymentAccountId = body?.paymentAccountId;
      if (typeof paymentAccountId !== "string") {
        return NextResponse.json({ error: "Conta de pagamento obrigatória" }, { status: 400 });
      }
      const paymentAccount = await prisma.finAccount.findFirst({
        where: { id: paymentAccountId, householdId: household.id },
      });
      if (!paymentAccount) {
        return NextResponse.json({ error: "Conta de pagamento inválida" }, { status: 400 });
      }
      const total = inv.transactions.reduce((s, t) => s + t.amount, 0);

      const result = await prisma.$transaction(async (tx) => {
        const transferTx = await tx.finTransaction.create({
          data: {
            householdId: household.id,
            type: "TRANSFER",
            amount: total,
            date: paidAt,
            description: `Pagamento fatura ${inv.account.name} ${String(inv.month).padStart(2, "0")}/${inv.year}`,
            owner: "COUPLE",
            accountId: paymentAccountId,
            toAccountId: inv.accountId,
          },
        });
        const updated = await tx.finCreditCardInvoice.update({
          where: { id: inv.id },
          data: {
            paidAt,
            paymentAccountId,
            status: "PAID",
          },
        });
        return { transferTx, invoice: updated };
      });
      return NextResponse.json(result);
    }

    if (action === "reopen") {
      const updated = await prisma.finCreditCardInvoice.update({
        where: { id: inv.id },
        data: { paidAt: null, paymentAccountId: null, status: "CLOSED" },
      });
      return NextResponse.json(updated);
    }

    if (action === "setAllDates") {
      const newDateStr = body?.date;
      if (typeof newDateStr !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(newDateStr)) {
        return NextResponse.json({ error: "Data inválida" }, { status: 400 });
      }
      const newDate = new Date(newDateStr);
      const res = await prisma.finTransaction.updateMany({
        where: { householdId: household.id, invoiceId: inv.id },
        data: { date: newDate },
      });
      return NextResponse.json({ updated: res.count });
    }

    const data: any = {};
    if (typeof body.notes === "string" || body.notes === null) data.notes = body.notes;
    const updated = await prisma.finCreditCardInvoice.update({
      where: { id: inv.id },
      data,
    });
    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof HouseholdAuthError) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    throw e;
  }
}
