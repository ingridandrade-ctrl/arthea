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

    const updated = await prisma.finRecurringRule.update({ where: { id: params.id }, data });
    return NextResponse.json(updated);
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
