import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET conversa específica com lead (substitui o hack antigo de buscar
// todos os leads pra achar uma conversa).
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const conv = await prisma.conversation.findUnique({
    where: { id: params.id },
    include: {
      lead: { select: { id: true, name: true, phone: true, email: true, company: true } },
    },
  });
  if (!conv) return NextResponse.json({ error: "Conversa não encontrada" }, { status: 404 });
  return NextResponse.json(conv);
}

// PATCH: atualiza flags da conversa (isAiActive principalmente).
// Antes a UI chamava PUT /api/leads/[id] com body vazio, que não persistia
// nada — toggle parecia funcionar visualmente mas voltava no reload.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const data: any = {};
  if (typeof body.isAiActive === "boolean") data.isAiActive = body.isAiActive;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nenhum campo válido pra atualizar" }, { status: 400 });
  }

  const updated = await prisma.conversation.update({
    where: { id: params.id },
    data,
  });
  return NextResponse.json(updated);
}
