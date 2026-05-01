import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const contract = await prisma.contract.findUnique({
    where: { id: params.id },
    include: {
      lead: { select: { id: true, name: true, phone: true, email: true, company: true } },
      deal: { select: { id: true, title: true, value: true } },
      service: { select: { id: true, name: true, color: true } },
      invoices: {
        orderBy: { dueDate: "asc" },
        include: { service: { select: { id: true, name: true, color: true } } },
      },
    },
  });

  if (!contract) return NextResponse.json({ error: "Contrato não encontrado" }, { status: 404 });
  return NextResponse.json(contract);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const body = await request.json();
  const {
    monthlyValue,
    durationMonths,
    paymentDay,
    status,
    notes,
    endDate,
    startDate,
    setupValue,
    serviceId,
    clientType,
    niche,
    tags,
    paymentLink,
  } = body;

  const contract = await prisma.contract.update({
    where: { id: params.id },
    data: {
      ...(monthlyValue !== undefined && { monthlyValue: Number(monthlyValue) }),
      ...(durationMonths !== undefined && { durationMonths: Number(durationMonths) }),
      ...(paymentDay !== undefined && { paymentDay: Number(paymentDay) }),
      ...(status !== undefined && { status }),
      ...(notes !== undefined && { notes }),
      ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
      ...(startDate !== undefined && { startDate: new Date(startDate) }),
      ...(setupValue !== undefined && { setupValue: setupValue === null ? null : Number(setupValue) }),
      ...(serviceId !== undefined && { serviceId: serviceId || null }),
      ...(clientType !== undefined && { clientType }),
      ...(niche !== undefined && { niche }),
      ...(tags !== undefined && { tags: Array.isArray(tags) ? tags : [] }),
      ...(paymentLink !== undefined && { paymentLink }),
    },
    include: { lead: true, deal: true, service: true, invoices: true },
  });

  return NextResponse.json(contract);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  await prisma.invoice.deleteMany({ where: { contractId: params.id } });
  await prisma.contract.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
