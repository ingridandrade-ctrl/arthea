import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const role = session.user?.role;
  const userId = session.user?.id;

  const deliverable = await prisma.clientDeliverable.findUnique({
    where: { id: params.id },
    include: { engagement: { select: { clientId: true } } },
  });
  if (!deliverable) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  // Client can only comment on their own deliverables
  if (role === "CLIENT" && deliverable.engagement.clientId !== userId) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
  if (!["CLIENT", "ADMIN", "MANAGER", "AGENT"].includes(role)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { content } = await request.json();
  if (!content || typeof content !== "string" || !content.trim()) {
    return NextResponse.json({ error: "Conteúdo obrigatório" }, { status: 400 });
  }

  const comment = await prisma.deliverableComment.create({
    data: {
      deliverableId: deliverable.id,
      authorId: userId,
      content: content.trim(),
      isFromArthea: role !== "CLIENT",
    },
  });

  return NextResponse.json(comment, { status: 201 });
}
