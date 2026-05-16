import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/portal-auth";
import type { SceneTheme } from "@prisma/client";

// Lista cenas de um cliente, opcionalmente filtradas por tema.
// GET /api/admin/scenes?clientId=xxx&theme=COMMUNICATION_FAILURE
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const clientId = request.nextUrl.searchParams.get("clientId");
  const theme = request.nextUrl.searchParams.get("theme") as SceneTheme | null;
  if (!clientId) {
    return NextResponse.json({ error: "clientId obrigatório" }, { status: 400 });
  }

  const scenes = await prisma.scene.findMany({
    where: { clientId, ...(theme && { theme }) },
    orderBy: [{ theme: "asc" }, { order: "asc" }],
    include: { _count: { select: { comments: true } } },
  });
  return NextResponse.json(scenes);
}

// Cria nova cena.
// POST /api/admin/scenes  body: { clientId, theme, characters, type, ... }
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const {
    clientId,
    theme,
    characters,
    type,
    work,
    context,
    sceneAndQuote,
    platform,
    videoLink,
    hook,
    clinicalAngle,
    status,
    order,
  } = body;

  if (!clientId || !theme || !characters || !work || !sceneAndQuote || !clinicalAngle) {
    return NextResponse.json(
      { error: "Campos obrigatórios: clientId, theme, characters, work, sceneAndQuote, clinicalAngle" },
      { status: 400 },
    );
  }

  // Pega o próximo order do tema se não veio
  let nextOrder = order;
  if (nextOrder == null) {
    const last = await prisma.scene.findFirst({
      where: { clientId, theme },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    nextOrder = (last?.order ?? 0) + 1;
  }

  const scene = await prisma.scene.create({
    data: {
      clientId,
      theme,
      order: nextOrder,
      characters,
      type: type || "Filme",
      work,
      context: context || "",
      sceneAndQuote,
      platform: platform || null,
      videoLink: videoLink || null,
      hook: hook || null,
      clinicalAngle,
      status: status || "PENDING",
    },
  });
  return NextResponse.json(scene, { status: 201 });
}
