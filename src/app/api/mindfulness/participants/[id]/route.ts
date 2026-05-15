import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/mindfulness/admin-auth";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = params;
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "id ausente." }, { status: 400 });
  }

  try {
    // Cascade configurado no schema apaga respostas e rascunhos junto.
    await prisma.mindfulnessParticipant.delete({ where: { id } });
  } catch (err: unknown) {
    // P2025 = registro não encontrado
    if (typeof err === "object" && err && "code" in err && (err as { code: string }).code === "P2025") {
      return NextResponse.json({ error: "Participante não encontrada." }, { status: 404 });
    }
    return NextResponse.json({ error: "Erro ao excluir." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
