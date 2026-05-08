import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/portal-auth";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const { question, type, options, order, isRequired } = body;
  if (!question) {
    return NextResponse.json({ error: "Pergunta obrigatória" }, { status: 400 });
  }

  const q = await prisma.deliverableQuestion.create({
    data: {
      deliverableId: params.id,
      question,
      type: type || "text",
      options: Array.isArray(options) ? options : [],
      order: order ?? 0,
      isRequired: !!isRequired,
    },
  });
  return NextResponse.json(q, { status: 201 });
}
