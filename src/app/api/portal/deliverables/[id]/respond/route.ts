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
  if (session.user?.role !== "CLIENT") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const userId = session.user.id;
  const deliverable = await prisma.clientDeliverable.findUnique({
    where: { id: params.id },
    include: { project: { select: { clientId: true } } },
  });
  if (!deliverable) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  if (deliverable.project.clientId !== userId) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const body = await request.json();
  const responses: { questionId: string; answer: string }[] = body.responses || [];
  const action: "approve" | "revision" = body.action;

  if (!["approve", "revision"].includes(action)) {
    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  }

  // Upsert each response
  for (const r of responses) {
    if (!r.questionId) continue;
    const existing = await prisma.deliverableResponse.findFirst({
      where: { deliverableId: deliverable.id, questionId: r.questionId },
    });
    if (existing) {
      await prisma.deliverableResponse.update({
        where: { id: existing.id },
        data: { answer: r.answer ?? "" },
      });
    } else {
      await prisma.deliverableResponse.create({
        data: {
          deliverableId: deliverable.id,
          questionId: r.questionId,
          answer: r.answer ?? "",
        },
      });
    }
  }

  const newStatus = action === "approve" ? "APPROVED" : "REVISION";
  const updated = await prisma.clientDeliverable.update({
    where: { id: deliverable.id },
    data: { status: newStatus },
  });

  return NextResponse.json({ ok: true, status: updated.status });
}
