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

  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "MANAGER") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, color, order } = body;

    const data: any = {};
    if (name !== undefined) data.name = name.trim();
    if (color !== undefined) data.color = color;
    if (order !== undefined) data.order = order;

    const stage = await prisma.pipelineStage.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json(stage);
  } catch (err: any) {
    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Fase não encontrada" }, { status: 404 });
    }
    return NextResponse.json({ error: "Erro ao atualizar fase" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "MANAGER") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  try {
    const stage = await prisma.pipelineStage.findUnique({
      where: { id: params.id },
      include: { _count: { select: { deals: true } } },
    });

    if (!stage) {
      return NextResponse.json({ error: "Fase não encontrada" }, { status: 404 });
    }

    if (stage._count.deals > 0) {
      return NextResponse.json(
        { error: `Não é possível excluir: existem ${stage._count.deals} deal(s) nesta fase. Mova os deals antes de excluir.` },
        { status: 400 }
      );
    }

    await prisma.pipelineStage.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Fase não encontrada" }, { status: 404 });
    }
    return NextResponse.json({ error: "Erro ao excluir fase" }, { status: 500 });
  }
}
