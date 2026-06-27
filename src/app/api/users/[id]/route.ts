import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcryptjs from "bcryptjs";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if ((session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const body = await request.json();
  const { name, email, password, role } = body;

  const data: any = {};
  if (name !== undefined) data.name = name;
  if (email !== undefined) data.email = email;
  if (role !== undefined) data.role = role;
  if (password) data.password = await bcryptjs.hash(password, 10);

  const user = await prisma.user.update({
    where: { id: params.id },
    data,
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return NextResponse.json(user);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if ((session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  // Don't allow deleting yourself
  if ((session.user as any).id === params.id) {
    return NextResponse.json({ error: "Não é possível excluir seu próprio usuário" }, { status: 400 });
  }

  try {
    await prisma.$transaction([
      prisma.task.updateMany({ where: { assignedToId: params.id }, data: { assignedToId: null } }),
      prisma.task.deleteMany({ where: { createdById: params.id } }),
      prisma.message.updateMany({ where: { sentByUserId: params.id }, data: { sentByUserId: null } }),
      prisma.activity.deleteMany({ where: { userId: params.id } }),
      prisma.notification.deleteMany({ where: { userId: params.id } }),
      prisma.clientEngagement.deleteMany({ where: { clientId: params.id } }),
      prisma.sceneComment.deleteMany({ where: { authorId: params.id } }),
      prisma.scene.deleteMany({ where: { clientId: params.id } }),
      prisma.metaConnection.deleteMany({ where: { userId: params.id } }),
      prisma.googleAdsConnection.deleteMany({ where: { userId: params.id } }),
      prisma.clientDossier.deleteMany({ where: { clientId: params.id } }),
      prisma.contract.updateMany({ where: { clientUserId: params.id }, data: { clientUserId: null } }),
      prisma.user.delete({ where: { id: params.id } }),
    ]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }
    return NextResponse.json({ error: "Erro ao excluir usuário. Verifique se não há registros vinculados." }, { status: 500 });
  }
}
