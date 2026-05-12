import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAccountInsights, listCampaigns } from "@/lib/meta/api";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  const userId = session.user?.id;
  if (!userId) return NextResponse.json({ error: "Sem sessao" }, { status: 401 });

  const datePreset = request.nextUrl.searchParams.get("date_preset") || "last_30d";

  const account = await prisma.metaAdAccount.findUnique({
    where: { id: params.id },
    include: { connection: true, engagement: { select: { id: true, name: true } } },
  });
  if (!account || account.connection.userId !== userId) {
    return NextResponse.json({ error: "Conta nao encontrada" }, { status: 404 });
  }

  try {
    const [campaigns, insights] = await Promise.all([
      listCampaigns(account.connection.accessToken, account.accountId),
      getAccountInsights(account.connection.accessToken, account.accountId, datePreset),
    ]);

    return NextResponse.json({
      account: {
        id: account.id,
        accountId: account.accountId,
        name: account.name,
        currency: account.currency,
        businessName: account.businessName,
        engagement: account.engagement,
      },
      campaigns,
      insights,
      datePreset,
    });
  } catch (err: any) {
    const meta = err?.response?.data?.error;
    console.error("Meta overview error:", meta || err.message);
    if (meta?.code === 190) {
      await prisma.metaConnection.update({
        where: { id: account.connectionId },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json({ error: "Token expirado, reconecte-se" }, { status: 401 });
    }
    return NextResponse.json({ error: meta?.message || "Erro Meta API" }, { status: 500 });
  }
}
