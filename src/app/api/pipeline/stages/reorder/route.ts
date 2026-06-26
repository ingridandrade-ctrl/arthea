import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "MANAGER") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = await request.json();
  const { stageIds } = body;

  if (!Array.isArray(stageIds) || stageIds.length === 0) {
    return NextResponse.json({ error: "Lista de IDs é obrigatória" }, { status: 400 });
  }

  await prisma.$transaction(
    stageIds.map((id: string, index: number) =>
      prisma.pipelineStage.update({
        where: { id },
        data: { order: index },
      })
    )
  );

  return NextResponse.json({ success: true });
}
