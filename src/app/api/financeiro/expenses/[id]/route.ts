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
  const { description, amount, category, date, recurring, notes, tags } = body;

  const expense = await prisma.expense.update({
    where: { id: params.id },
    data: {
      ...(description !== undefined && { description }),
      ...(amount !== undefined && { amount: Number(amount) }),
      ...(category !== undefined && { category }),
      ...(date !== undefined && { date: new Date(date) }),
      ...(recurring !== undefined && { recurring: !!recurring }),
      ...(notes !== undefined && { notes }),
      ...(tags !== undefined && { tags: Array.isArray(tags) ? tags : [] }),
    },
  });

  return NextResponse.json(expense);
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

  await prisma.expense.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
