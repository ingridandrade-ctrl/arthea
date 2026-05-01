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
      lead: { select: { id: true, name: true, phone: true, email: true } },
      deal: { select: { id: true, title: true, value: true } },
      service: { select: { id: true, name: true, color: true } },
      invoices: { orderBy: { dueDate: "asc" } },
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
  if ((session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const body = await request.json();
  const { monthlyValue, durationMonths, paymentDay, status, notes, endDate } = body;

  const contract = await prisma.contract.update({
    where: { id: params.id },
    data: {
      ...(monthlyValue !== undefined && { monthlyValue }),
      ...(durationMonths !== undefined && { durationMonths }),
      ...(paymentDay !== undefined && { paymentDay }),
      ...(status !== undefined && { status }),
      ...(notes !== undefined && { notes }),
      ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
    },
    include: { lead: true, deal: true, service: true, invoices: true },
  });

  return NextResponse.json(contract);
}
