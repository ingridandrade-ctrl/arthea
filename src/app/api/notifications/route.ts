import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = (await getServerSession(authOptions)) as any;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const userId = session.user.id as string;

  const [unread, read, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId, read: false },
      orderBy: { createdAt: "desc" },
    }),
    prisma.notification.findMany({
      where: { userId, read: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.notification.count({ where: { userId, read: false } }),
  ]);

  const notifications = [...unread, ...read];

  return NextResponse.json({ notifications, unreadCount });
}
