import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    status,
    paidAt,
    paymentMethod,
    amount,
    dueDate,
    description,
    paymentLink,
    serviceId,
    serviceIds,
    installmentNumber,
    totalInstallments,
    invoiceIssued,
    invoiceNumber,
    invoiceIssuedAt,
  } = body;

  const data: any = {
    ...(status !== undefined && { status }),
    ...(paidAt !== undefined && { paidAt: paidAt ? new Date(paidAt) : null }),
    ...(paymentMethod !== undefined && { paymentMethod }),
    ...(amount !== undefined && { amount: Number(amount) }),
    ...(dueDate !== undefined && { dueDate: new Date(dueDate) }),
    ...(description !== undefined && { description }),
    ...(paymentLink !== undefined && { paymentLink }),
    ...(installmentNumber !== undefined && { installmentNumber }),
    ...(totalInstallments !== undefined && { totalInstallments }),
    ...(invoiceIssued !== undefined && { invoiceIssued: !!invoiceIssued }),
    ...(invoiceNumber !== undefined && { invoiceNumber }),
    ...(invoiceIssuedAt !== undefined && {
      invoiceIssuedAt: invoiceIssuedAt ? new Date(invoiceIssuedAt) : null,
    }),
  };

  if (Array.isArray(serviceIds)) {
    const cleaned = serviceIds.filter(Boolean);
    data.serviceIds = cleaned;
    data.serviceId = cleaned[0] || null;
  } else if (serviceId !== undefined) {
    data.serviceId = serviceId || null;
    data.serviceIds = serviceId ? [serviceId] : [];
  }

  if (invoiceIssued === true && invoiceIssuedAt === undefined) {
    data.invoiceIssuedAt = new Date();
  }
  if (invoiceIssued === false && invoiceIssuedAt === undefined) {
    data.invoiceIssuedAt = null;
  }

  const invoice = await prisma.invoice.update({
    where: { id: params.id },
    data,
    include: {
      contract: true,
      lead: true,
      service: { select: { id: true, name: true, color: true } },
    },
  });

  return NextResponse.json(invoice);
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

  await prisma.invoice.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
