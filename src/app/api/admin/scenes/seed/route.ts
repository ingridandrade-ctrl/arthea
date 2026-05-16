import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/portal-auth";
import { SEED_SCENES } from "../../../../../../prisma/seed-scenes-data";

// POST /api/admin/scenes/seed { clientId }
// Importa as cenas iniciais do briefing (pop_culture_7temas.xlsx) pro cliente.
// Só roda se não houver cenas já cadastradas (idempotente — não duplica).
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const body = await req.json().catch(() => ({}));
  const clientId = body.clientId;
  if (!clientId) {
    return NextResponse.json({ error: "clientId obrigatório" }, { status: 400 });
  }

  const client = await prisma.user.findUnique({
    where: { id: clientId },
    select: { id: true, scenesEnabled: true },
  });
  if (!client) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }

  // Garante que o módulo está ligado pro cliente
  if (!client.scenesEnabled) {
    await prisma.user.update({
      where: { id: clientId },
      data: { scenesEnabled: true },
    });
  }

  const existing = await prisma.scene.count({ where: { clientId } });
  if (existing > 0) {
    return NextResponse.json(
      {
        error: `Esse cliente já tem ${existing} cenas. Apague antes ou edite individualmente.`,
      },
      { status: 409 },
    );
  }

  await prisma.scene.createMany({
    data: SEED_SCENES.map((s) => ({
      clientId,
      theme: s.theme,
      order: s.order,
      characters: s.characters,
      type: s.type,
      work: s.work,
      context: s.context,
      sceneAndQuote: s.sceneAndQuote,
      platform: s.platform || null,
      videoLink: s.videoLink || null,
      hook: s.hook || null,
      clinicalAngle: s.clinicalAngle,
    })),
  });

  return NextResponse.json({ ok: true, created: SEED_SCENES.length });
}
