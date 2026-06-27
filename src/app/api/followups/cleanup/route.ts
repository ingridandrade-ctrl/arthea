import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Remove follow-ups duplicados, mantendo apenas o mais recente
// por (leadServiceId, stageId, order). Pending tem prioridade sobre outros estados.
export async function POST() {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const all = await prisma.followUp.findMany({
    select: { id: true, leadServiceId: true, stageId: true, order: true, status: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  const seen = new Map<string, string>();
  const toDelete: string[] = [];

  const pendingFirst = [...all].sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (b.status === "pending" && a.status !== "pending") return 1;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  for (const fu of pendingFirst) {
    const key = `${fu.leadServiceId}|${fu.stageId}|${fu.order}`;
    if (seen.has(key)) {
      toDelete.push(fu.id);
    } else {
      seen.set(key, fu.id);
    }
  }

  if (toDelete.length > 0) {
    await prisma.followUp.deleteMany({ where: { id: { in: toDelete } } });
  }

  return NextResponse.json({
    totalBefore: all.length,
    deleted: toDelete.length,
    kept: seen.size,
  });
}
