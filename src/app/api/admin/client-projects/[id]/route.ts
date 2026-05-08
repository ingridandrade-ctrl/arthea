import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/portal-auth";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const project = await prisma.clientProject.findUnique({
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
      summary: true,
    },
  });
  if (!project) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(project);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const { name, description, startDate, endDate, currentPhase, accentColor, logoUrl, isActive } = body;

  const project = await prisma.clientProject.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
      ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
      ...(currentPhase !== undefined && { currentPhase: Number(currentPhase) }),
      ...(accentColor !== undefined && { accentColor }),
      ...(logoUrl !== undefined && { logoUrl }),
      ...(isActive !== undefined && { isActive: !!isActive }),
    },
  });
  return NextResponse.json(project);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  await prisma.clientProject.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
