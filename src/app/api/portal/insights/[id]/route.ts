import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/portal/insights/[id]
// Body pode conter { status, title, body, category, severity }.
// Ao mudar status pra APPROVED, marca approvedById + approvedAt.
// Ao mudar pra DISMISSED, marca dismissedAt.
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "MANAGER") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const patch = await req.json().catch(() => ({}));
  const { status, title, body, category, severity } = patch as any;

  const data: any = {};
  if (title !== undefined) data.title = title;
  if (body !== undefined) data.body = body;
  if (category !== undefined) data.category = category;
  if (severity !== undefined) data.severity = severity;

  if (status !== undefined) {
    data.status = status;
    if (status === "APPROVED") {
      data.approvedById = session.user.id;
      data.approvedAt = new Date();
      data.dismissedAt = null;
    } else if (status === "DISMISSED") {
      data.dismissedAt = new Date();
    } else if (status === "PENDING") {
      data.approvedById = null;
      data.approvedAt = null;
      data.dismissedAt = null;
    }
  }

  const updated = await prisma.clientInsight.update({
    where: { id: params.id },
    data,
  });

  return NextResponse.json(updated);
}

// DELETE — apagar permanentemente. Preferimos DISMISSED via PATCH pra manter
// histórico, mas o endpoint existe pra limpezas manuais.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "MANAGER") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  await prisma.clientInsight.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
