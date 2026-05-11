import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  const userId = session.user?.id;
  const role = session.user?.role;
  if (!userId || (role !== "ADMIN" && role !== "MANAGER")) {
    return NextResponse.json({ error: "Permissao insuficiente" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const connectionId: string | undefined = body.connectionId;
  if (!connectionId) {
    return NextResponse.json({ error: "connectionId obrigatorio" }, { status: 400 });
  }

  const conn = await prisma.metaConnection.findUnique({ where: { id: connectionId } });
  if (!conn || conn.userId !== userId) {
    return NextResponse.json({ error: "Conexao nao encontrada" }, { status: 404 });
  }

  await prisma.metaConnection.delete({ where: { id: connectionId } });
  return NextResponse.json({ success: true });
}
