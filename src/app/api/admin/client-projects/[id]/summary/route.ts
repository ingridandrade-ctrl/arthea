import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/portal-auth";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const { content } = body;
  if (typeof content !== "string") {
    return NextResponse.json({ error: "Conteúdo obrigatório" }, { status: 400 });
  }

  const summary = await prisma.clientSummary.upsert({
    where: { projectId: params.id },
    create: { projectId: params.id, content },
    update: { content },
  });
  return NextResponse.json(summary);
}
