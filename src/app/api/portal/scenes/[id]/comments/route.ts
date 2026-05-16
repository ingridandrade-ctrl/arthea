import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/portal/scenes/[id]/comments  → adiciona comentário (cliente ou Arthea)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const userId = session.user?.id;
  const role = session.user?.role;
  if (!userId) return NextResponse.json({ error: "Sem sessão" }, { status: 401 });

  const scene = await prisma.scene.findUnique({
    where: { id: params.id },
    select: { id: true, clientId: true },
  });
  if (!scene) return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
  if (role === "CLIENT" && scene.clientId !== userId) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { content } = await req.json();
  if (!content || typeof content !== "string" || !content.trim()) {
    return NextResponse.json({ error: "Conteúdo obrigatório" }, { status: 400 });
  }

  const comment = await prisma.sceneComment.create({
    data: {
      sceneId: scene.id,
      authorId: userId,
      content: content.trim(),
      isFromArthea: role !== "CLIENT",
    },
  });
  return NextResponse.json(comment, { status: 201 });
}
