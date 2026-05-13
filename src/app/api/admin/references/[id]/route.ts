import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/portal-auth";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const { title, type, url, description, order } = body;

  const ref = await prisma.clientReference.update({
    where: { id: params.id },
    data: {
      ...(title !== undefined && { title }),
      ...(type !== undefined && { type }),
      ...(url !== undefined && { url }),
      ...(description !== undefined && { description }),
      ...(order !== undefined && { order: Number(order) }),
    },
  });
  return NextResponse.json(ref);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  await prisma.clientReference.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
