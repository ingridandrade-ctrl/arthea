import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/portal-auth";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
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

  const deliverable = await prisma.clientDeliverable.update({
    where: { id: params.id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(category !== undefined && { category }),
      ...(phase !== undefined && { phase: Number(phase) }),
      ...(order !== undefined && { order: Number(order) }),
      ...(status !== undefined && { status }),
      ...(documentUrl !== undefined && { documentUrl }),
      ...(documentEmbed !== undefined && { documentEmbed }),
      ...(isVisible !== undefined && { isVisible: !!isVisible }),
    },
  });
  return NextResponse.json(deliverable);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  await prisma.clientDeliverable.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
