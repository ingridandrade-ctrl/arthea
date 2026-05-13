import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_request: NextRequest) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  const userId = session.user?.id;
  if (!userId) return NextResponse.json({ error: "Sem sessao" }, { status: 401 });

  const connections = await prisma.metaConnection.findMany({
    where: { userId },
    select: {
      id: true,
      metaUserId: true,
      metaUserName: true,
      status: true,
      tokenExpiresAt: true,
      createdAt: true,
      adAccounts: {
        select: {
          id: true,
          accountId: true,
          name: true,
          currency: true,
          businessName: true,
          engagementId: true,
          engagement: { select: { id: true, name: true } },
        },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(connections);
}
