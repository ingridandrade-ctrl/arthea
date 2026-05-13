import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/portal-auth";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const engagement = await prisma.clientEngagement.findUnique({
    where: { id: params.id },
    include: {
      client: { select: { id: true, name: true, email: true } },
      deliverables: {
        orderBy: [{ phase: "asc" }, { order: "asc" }],
        include: {
          questions: { orderBy: { order: "asc" } },
          _count: { select: { comments: true, responses: true } },
        },
      },
      accesses: { orderBy: { order: "asc" } },
      references: { orderBy: { order: "asc" } },
    },
  });
  if (!engagement) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  // Dossier vive no client agora, não no engagement
  const dossier = await prisma.clientDossier.findUnique({
    where: { clientId: engagement.clientId },
  });

  return NextResponse.json({ ...engagement, dossier });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const {
    name,
    description,
    startDate,
    endDate,
    currentPhase,
    totalPhases,
    accentColor,
    logoUrl,
    isActive,
    type,
    slug,
  } = body;

  const engagement = await prisma.clientEngagement.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(slug !== undefined && { slug }),
      ...(type !== undefined && { type }),
      ...(description !== undefined && { description }),
      ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
      ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
      ...(currentPhase !== undefined && { currentPhase: Number(currentPhase) }),
      ...(totalPhases !== undefined && { totalPhases: Number(totalPhases) }),
      ...(accentColor !== undefined && { accentColor }),
      ...(logoUrl !== undefined && { logoUrl }),
      ...(isActive !== undefined && { isActive: !!isActive }),
    },
  });
  return NextResponse.json(engagement);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  await prisma.clientEngagement.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
