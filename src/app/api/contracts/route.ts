import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if ((session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const where: any = {};
  if (status) where.status = status;

  const contracts = await prisma.contract.findMany({
    where,
    include: {
      lead: { select: { id: true, name: true, phone: true } },
      deal: { select: { id: true, title: true } },
      service: { select: { id: true, name: true, color: true } },
      _count: { select: { invoices: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(contracts);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if ((session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const body = await request.json();
  const { dealId, leadId, serviceId, monthlyValue, setupValue, durationMonths, startDate, paymentDay, notes } = body;

  const count = await prisma.contract.count();
  const year = new Date().getFullYear();
  const number = `CTR-${year}-${String(count + 1).padStart(3, "0")}`;

  const contract = await prisma.contract.create({
    data: {
      number,
      dealId,
      leadId,
      serviceId,
      monthlyValue: monthlyValue || 0,
      setupValue,
      durationMonths: durationMonths || 12,
      startDate: startDate ? new Date(startDate) : new Date(),
      paymentDay: paymentDay || 10,
      notes,
    },
    include: { lead: true, deal: true, service: true },
  });

  // Generate all invoices upfront
  const invCount = await prisma.invoice.count();
  const invoiceData = Array.from({ length: contract.durationMonths }, (_, i) => {
    const due = new Date(contract.startDate);
    due.setMonth(due.getMonth() + i);
    due.setDate(contract.paymentDay);
    return {
      number: `INV-${year}-${String(invCount + i + 1).padStart(3, "0")}`,
      contractId: contract.id,
      leadId: contract.leadId,
      amount: contract.monthlyValue,
      dueDate: due,
      description: `Parcela ${i + 1}/${contract.durationMonths}`,
    };
  });

  await prisma.invoice.createMany({ data: invoiceData });

  return NextResponse.json(contract, { status: 201 });
}
