import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listAdAccounts } from "@/lib/meta/api";

export async function POST(request: NextRequest) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  const userId = session.user?.id;
  if (!userId) return NextResponse.json({ error: "Sem sessao" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const connectionId: string | undefined = body.connectionId;
  if (!connectionId) {
    return NextResponse.json({ error: "connectionId obrigatorio" }, { status: 400 });
  }

  const conn = await prisma.metaConnection.findUnique({ where: { id: connectionId } });
  if (!conn || conn.userId !== userId) {
    return NextResponse.json({ error: "Conexao nao encontrada" }, { status: 404 });
  }

  try {
    const accounts = await listAdAccounts(conn.accessToken);

    await prisma.$transaction(
      accounts.map((acc) =>
        prisma.metaAdAccount.upsert({
          where: { connectionId_accountId: { connectionId: conn.id, accountId: acc.account_id } },
          create: {
            connectionId: conn.id,
            accountId: acc.account_id,
            name: acc.name,
            currency: acc.currency ?? null,
            timezoneName: acc.timezone_name ?? null,
            status: acc.account_status ?? null,
            businessName: acc.business?.name ?? null,
          },
          update: {
            name: acc.name,
            currency: acc.currency ?? null,
            timezoneName: acc.timezone_name ?? null,
            status: acc.account_status ?? null,
            businessName: acc.business?.name ?? null,
          },
        }),
      ),
    );

    const stored = await prisma.metaAdAccount.findMany({
      where: { connectionId: conn.id },
      include: { clientProject: { select: { id: true, name: true } } },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ count: stored.length, accounts: stored });
  } catch (err: any) {
    const meta = err?.response?.data?.error;
    console.error("Failed to sync ad accounts:", meta || err.message);
    if (meta?.code === 190) {
      await prisma.metaConnection.update({
        where: { id: conn.id },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json({ error: "Token expirado, reconecte-se" }, { status: 401 });
    }
    return NextResponse.json({ error: meta?.message || "Erro ao buscar contas" }, { status: 500 });
  }
}
