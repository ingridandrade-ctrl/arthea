import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/portal-auth";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const { platform, icon, username, password, url, notes, order } = body;

  const access = await prisma.clientAccess.update({
    where: { id: params.id },
    data: {
      ...(platform !== undefined && { platform }),
      ...(icon !== undefined && { icon }),
      ...(username !== undefined && { username }),
      ...(password !== undefined && { password }),
      ...(url !== undefined && { url }),
      ...(notes !== undefined && { notes }),
      ...(order !== undefined && { order: Number(order) }),
    },
  });
  return NextResponse.json(access);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  await prisma.clientAccess.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
