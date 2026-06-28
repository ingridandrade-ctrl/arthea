import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Marca um follow-up interno como concluído (status=sent) ou pulado (status=skipped),
// ou volta pra pending. Usado quando o follow-up aparece como item de Tarefas.
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const action = body.action as "complete" | "skip" | "reopen" | undefined;

  let data: any;
  if (action === "complete") data = { status: "sent", sentAt: new Date() };
  else if (action === "skip") data = { status: "skipped", sentAt: null };
  else if (action === "reopen") data = { status: "pending", sentAt: null };
  else return NextResponse.json({ error: "action obrigatório (complete|skip|reopen)" }, { status: 400 });

  const updated = await prisma.followUp.update({
    where: { id: params.id },
    data,
  });

  return NextResponse.json(updated);
}
