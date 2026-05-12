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
  // Aceita `engagementId` (novo) ou `clientProjectId` (legacy) por enquanto.
  const engagementId: string | null = body.engagementId ?? body.clientProjectId ?? null;

  const account = await prisma.metaAdAccount.findUnique({
    where: { id: params.id },
    include: { connection: true },
  });
  if (!account || account.connection.userId !== userId) {
    return NextResponse.json({ error: "Conta nao encontrada" }, { status: 404 });
  }

  if (engagementId) {
    const engagement = await prisma.clientEngagement.findUnique({ where: { id: engagementId } });
    if (!engagement) {
      return NextResponse.json({ error: "Engagement nao encontrado" }, { status: 404 });
    }
  }

  const updated = await prisma.metaAdAccount.update({
    where: { id: params.id },
    data: { engagementId },
    include: { engagement: { select: { id: true, name: true } } },
  });

  return NextResponse.json(updated);
}
