import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/portal-auth";

// Path histórico — agora atualiza o ClientDossier do cliente dono do engagement.
// O body pode trazer `content` (legacy HTML) ou seções estruturadas do dossiê.
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const engagement = await prisma.clientEngagement.findUnique({
    where: { id: params.id },
    select: { clientId: true },
  });
  if (!engagement) return NextResponse.json({ error: "Engagement não encontrado" }, { status: 404 });

  const body = await req.json();
  const { content, ...sections } = body as Record<string, unknown>;
  const data: Record<string, unknown> = {};

  if (typeof content === "string") data.legacySummaryHtml = content;

  // Aceita opcionalmente seções estruturadas (digitalPresence, brandContext, voice, etc.)
  const allowed = [
    "digitalPresence",
    "brandContext",
    "voice",
    "market",
    "contacts",
    "commercial",
    "archive",
    "brandIdentity",
    "performance",
  ];
  for (const key of allowed) {
    if (sections[key] !== undefined) data[key] = sections[key];
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nada para atualizar" }, { status: 400 });
  }

  const dossier = await prisma.clientDossier.upsert({
    where: { clientId: engagement.clientId },
    create: { clientId: engagement.clientId, ...data },
    update: data,
  });
  return NextResponse.json(dossier);
}
