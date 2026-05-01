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
  const contractId = searchParams.get("contractId");

  const where: any = {};
  if (status) where.status = status;
  if (contractId) where.contractId = contractId;

  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      contract: { select: { id: true, number: true } },
      lead: { select: { id: true, name: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  return NextResponse.json(invoices);
}
