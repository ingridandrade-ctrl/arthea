import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/portal-auth";

// PUT /api/admin/scenes/[id]  → admin edita qualquer campo da cena
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const fields = [
    "characters",
    "type",
    "work",
    "context",
    "sceneAndQuote",
    "platform",
    "videoLink",
    "hook",
    "clinicalAngle",
    "status",
    "scriptText",
    "order",
    "theme",
  ];
  const data: Record<string, unknown> = {};
  for (const f of fields) {
    if (f in body) data[f] = body[f];
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nada para atualizar" }, { status: 400 });
  }

  const scene = await prisma.scene.update({
    where: { id: params.id },
    data,
  });
  return NextResponse.json(scene);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  await prisma.scene.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
