import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const userId = session.user.id as string;

  const notification = await prisma.notification.findUnique({
    where: { id: params.id },
    select: { userId: true },
  });

  if (!notification) {
    return NextResponse.json({ error: "Notificação não encontrada" }, { status: 404 });
  }

  if (notification.userId !== userId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const updated = await prisma.notification.update({
    where: { id: params.id },
    data: { read: true },
  });

  return NextResponse.json({ notification: updated });
}
