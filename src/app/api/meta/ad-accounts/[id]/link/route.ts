import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  const userId = session.user?.id;
  if (!userId) return NextResponse.json({ error: "Sem sessao" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const clientProjectId: string | null = body.clientProjectId ?? null;

  const account = await prisma.metaAdAccount.findUnique({
    where: { id: params.id },
    include: { connection: true },
  });
  if (!account || account.connection.userId !== userId) {
    return NextResponse.json({ error: "Conta nao encontrada" }, { status: 404 });
  }

  if (clientProjectId) {
    const project = await prisma.clientProject.findUnique({ where: { id: clientProjectId } });
    if (!project) {
      return NextResponse.json({ error: "Projeto de cliente nao encontrado" }, { status: 404 });
    }
  }

  const updated = await prisma.metaAdAccount.update({
    where: { id: params.id },
    data: { clientProjectId },
    include: { clientProject: { select: { id: true, name: true } } },
  });

  return NextResponse.json(updated);
}
