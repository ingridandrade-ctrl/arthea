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

  const ids = Array.from(new Set([
    ...(contract.serviceIds || []),
    ...(contract.invoices.flatMap((i: any) => i.serviceIds || [])),
  ].filter(Boolean)));
  const services = ids.length
    ? await prisma.service.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true, color: true },
      })
    : [];
  const svcMap = new Map(services.map((s) => [s.id, s]));

  return NextResponse.json({
    ...contract,
    services: (contract.serviceIds || []).map((id) => svcMap.get(id)).filter(Boolean),
    invoices: contract.invoices.map((i: any) => ({
      ...i,
      services: (i.serviceIds || []).map((id: string) => svcMap.get(id)).filter(Boolean),
    })),
  });
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
    serviceIds,
    clientType,
    niche,
    tags,
    paymentLink,
  } = body;

  const data: any = {
    ...(monthlyValue !== undefined && { monthlyValue: Number(monthlyValue) }),
    ...(durationMonths !== undefined && { durationMonths: Number(durationMonths) }),
    ...(paymentDay !== undefined && { paymentDay: Number(paymentDay) }),
    ...(status !== undefined && { status }),
    ...(notes !== undefined && { notes }),
    ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
    ...(startDate !== undefined && { startDate: new Date(startDate) }),
    ...(setupValue !== undefined && { setupValue: setupValue === null ? null : Number(setupValue) }),
    ...(clientType !== undefined && { clientType }),
    ...(niche !== undefined && { niche }),
    ...(tags !== undefined && { tags: Array.isArray(tags) ? tags : [] }),
    ...(paymentLink !== undefined && { paymentLink }),
  };

  if (Array.isArray(serviceIds)) {
    const cleaned = serviceIds.filter(Boolean);
    data.serviceIds = cleaned;
    data.serviceId = cleaned[0] || null;
  } else if (serviceId !== undefined) {
    data.serviceId = serviceId || null;
    data.serviceIds = serviceId ? [serviceId] : [];
  }

  const contract = await prisma.contract.update({
    where: { id: params.id },
    data,
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
