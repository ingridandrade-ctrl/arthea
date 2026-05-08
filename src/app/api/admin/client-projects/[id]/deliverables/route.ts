import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/portal-auth";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const {
    title,
    description,
    category,
    phase,
    order,
    status,
    documentUrl,
    documentEmbed,
    isVisible,
  } = body;

  if (!title || !category || phase == null) {
    return NextResponse.json(
      { error: "Campos obrigatórios: title, category, phase" },
      { status: 400 }
    );
  }

  const deliverable = await prisma.clientDeliverable.create({
    data: {
      projectId: params.id,
      title,
      description: description || null,
      category,
      phase: Number(phase),
      order: order ?? 0,
      status: status || "PENDING",
      documentUrl: documentUrl || null,
      documentEmbed: documentEmbed || null,
      isVisible: isVisible !== false,
    },
  });
  return NextResponse.json(deliverable, { status: 201 });
}
