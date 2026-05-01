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
  if ((session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const body = await request.json();
  const { status, paidAt, paymentMethod, amount } = body;

  const invoice = await prisma.invoice.update({
    where: { id: params.id },
    data: {
      ...(status !== undefined && { status }),
      ...(paidAt !== undefined && { paidAt: paidAt ? new Date(paidAt) : null }),
      ...(paymentMethod !== undefined && { paymentMethod }),
      ...(amount !== undefined && { amount }),
    },
    include: { contract: true, lead: true },
  });

  return NextResponse.json(invoice);
}
