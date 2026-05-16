import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT /api/portal/scenes/[id]  → cliente atualiza status / scriptText / videoLink
// (todo mundo edita; só campos limitados pelo lado do cliente)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
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

  // Cliente só pode editar a própria cena. Admin/manager pode qualquer.
  if (role === "CLIENT" && scene.clientId !== userId) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if ("status" in body) data.status = body.status;
  if ("scriptText" in body) data.scriptText = body.scriptText || null;
  if ("videoLink" in body) data.videoLink = body.videoLink || null;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nada para atualizar" }, { status: 400 });
  }

  const updated = await prisma.scene.update({ where: { id: scene.id }, data });
  return NextResponse.json(updated);
}
