import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH — edita um template
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; templateId: string } },
) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "MANAGER") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { title, description, kind, phase, order } = body as any;

  const updated = await prisma.serviceDeliverableTemplate.update({
    where: { id: params.templateId },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description: description || null }),
      ...(kind !== undefined && { kind }),
      ...(phase !== undefined && { phase }),
      ...(order !== undefined && { order }),
    },
  });

  return NextResponse.json(updated);
}

// DELETE — remove template
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; templateId: string } },
) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "MANAGER") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  await prisma.serviceDeliverableTemplate.delete({
    where: { id: params.templateId },
  });

  return NextResponse.json({ ok: true });
}
