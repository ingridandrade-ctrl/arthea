import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireHousehold, HouseholdAuthError } from "@/lib/financas/session";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const household = await requireHousehold();
    const existing = await prisma.finRecurringRule.findFirst({
      where: { id: params.id, householdId: household.id },
    });
    if (!existing) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

    const body = await req.json();
    const data: any = {};
    if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
    if (typeof body.amount === "number" && body.amount > 0) data.amount = body.amount;
    if (typeof body.description === "string" && body.description.trim()) data.description = body.description.trim();
    if (typeof body.notes === "string" || body.notes === null) data.notes = body.notes;
    if (["PARTNER_A", "PARTNER_B", "COUPLE"].includes(body.owner)) data.owner = body.owner;
    if (typeof body.dayOfMonth === "number" || body.dayOfMonth === null) data.dayOfMonth = body.dayOfMonth;
    if (typeof body.dayOfWeek === "number" || body.dayOfWeek === null) data.dayOfWeek = body.dayOfWeek;
    if (typeof body.monthOfYear === "number" || body.monthOfYear === null) data.monthOfYear = body.monthOfYear;
    if (typeof body.active === "boolean") data.active = body.active;
    if (body.endDate !== undefined) data.endDate = body.endDate ? new Date(body.endDate) : null;

    if (body.categoryId === null || typeof body.categoryId === "string") {
      if (body.categoryId) {
        const cat = await prisma.finCategory.findFirst({
          where: { id: body.categoryId, householdId: household.id },
        });
        if (!cat) return NextResponse.json({ error: "Categoria inválida" }, { status: 400 });
      }
      data.categoryId = body.categoryId || null;
    }
    if (typeof body.accountId === "string") {
      const acc = await prisma.finAccount.findFirst({
        where: { id: body.accountId, householdId: household.id },
      });
      if (!acc) return NextResponse.json({ error: "Conta inválida" }, { status: 400 });
      data.accountId = body.accountId;
    }

    const applyToExisting = body.applyToExisting === true;

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.finRecurringRule.update({
        where: { id: params.id },
        data,
      });

      let updatedTxs = 0;
      if (applyToExisting) {
        const txData: any = {};
        if (data.amount !== undefined) txData.amount = data.amount;
        if (data.description !== undefined) txData.description = data.description;
        if (data.owner !== undefined) txData.owner = data.owner;
        if (data.categoryId !== undefined) txData.categoryId = data.categoryId;
        if (data.accountId !== undefined) txData.accountId = data.accountId;
        if (data.notes !== undefined) txData.notes = data.notes;

        if (Object.keys(txData).length > 0) {
          const res = await tx.finTransaction.updateMany({
            where: { householdId: household.id, recurringId: params.id },
            data: txData,
          });
          updatedTxs = res.count;
        }
      }

      return { rule: updated, updatedTransactions: updatedTxs };
    });

    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof HouseholdAuthError) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    throw e;
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const household = await requireHousehold();
    const existing = await prisma.finRecurringRule.findFirst({
      where: { id: params.id, householdId: household.id },
    });
    if (!existing) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

    const inUse = await prisma.finTransaction.count({ where: { recurringId: params.id } });
    if (inUse > 0) {
      await prisma.finRecurringRule.update({ where: { id: params.id }, data: { active: false } });
      return NextResponse.json({ ok: true, deactivated: true });
    }
    await prisma.finRecurringRule.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof HouseholdAuthError) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    throw e;
  }
}
