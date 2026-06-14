import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getAccountInsights,
  getCampaignInsightsForAccount,
  getAccountDailyInsights,
} from "@/lib/meta/api";
import { buildMetaSummary, aggregateMetaSummaries } from "@/lib/meta/resolvers";

export const revalidate = 3600;

const VALID_PRESETS = new Set([
  "today",
  "yesterday",
  "last_7d",
  "last_14d",
  "last_28d",
  "last_30d",
  "this_month",
  "last_month",
]);

// GET /api/meta/engagement-dashboard?engagementId=X&datePreset=last_30d
//
// Visão Meta Ads escopada a UMA frente (engagement). Combina insights de todas
// as MetaAdAccount linkadas. Usa o resolver `buildMetaSummary` pra extrair
// todas as ~30 métricas catalogadas (incluindo Hook Rate, Hold Rate, ThruPlay).
export async function GET(req: NextRequest) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const role = session.user?.role;
  const userId = session.user?.id as string;

  const engagementId = req.nextUrl.searchParams.get("engagementId");
  if (!engagementId) {
    return NextResponse.json({ error: "engagementId obrigatório" }, { status: 400 });
  }

  const engagement = await prisma.clientEngagement.findUnique({
    where: { id: engagementId },
    select: { id: true, clientId: true, name: true },
  });
  if (!engagement) {
    return NextResponse.json({ error: "Engagement não encontrado" }, { status: 404 });
  }
  if (role === "CLIENT" && engagement.clientId !== userId) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const datePresetRaw = req.nextUrl.searchParams.get("datePreset") || "last_30d";
  const datePreset = VALID_PRESETS.has(datePresetRaw) ? datePresetRaw : "last_30d";

  const accounts = await prisma.metaAdAccount.findMany({
    where: { engagementId, hidden: false },
    include: { connection: { select: { accessToken: true, status: true } } },
  });

  if (accounts.length === 0) {
    return NextResponse.json({
      datePreset,
      account: null,
      summary: null,
      campaigns: [],
      daily: [],
      note: "Nenhuma conta Meta Ads linkada a essa frente ainda.",
    });
  }

  const active = accounts.filter((a) => a.connection.status === "ACTIVE");
  if (active.length === 0) {
    return NextResponse.json({
      datePreset,
      account: null,
      summary: null,
      campaigns: [],
      daily: [],
      error: "Conexão Meta Ads não está ativa. A equipe Arthea precisa reconectar.",
    });
  }

  try {
    const perAccountSummaries: ReturnType<typeof buildMetaSummary>[] = [];
    const allCampaigns: Array<any> = [];
    const dailyMap = new Map<string, { spend: number; clicks: number }>();

    for (const acc of active) {
      const [insights, campaigns, daily] = await Promise.all([
        getAccountInsights(acc.connection.accessToken, acc.accountId, datePreset),
        getCampaignInsightsForAccount(acc.connection.accessToken, acc.accountId, datePreset),
        getAccountDailyInsights(acc.connection.accessToken, acc.accountId, datePreset),
      ]);

      perAccountSummaries.push(buildMetaSummary(insights));

      for (const c of campaigns) {
        const cSummary = buildMetaSummary(c);
        allCampaigns.push({
          campaignId: c.campaign_id,
          campaignName: c.campaign_name,
          objective: c.objective,
          accountName: acc.name,
          ...cSummary,
        });
      }

      for (const d of daily) {
        const key = d.date_start;
        const prev = dailyMap.get(key) || { spend: 0, clicks: 0 };
        dailyMap.set(key, {
          spend: prev.spend + Number(d.spend || 0),
          clicks: prev.clicks + Number(d.clicks || 0),
        });
      }
    }

    const summary = aggregateMetaSummaries(perAccountSummaries);

    allCampaigns.sort((a, b) => b.spend - a.spend);
    const daily = Array.from(dailyMap.entries())
      .map(([date, v]) => ({ date, clicks: v.clicks, cost: v.spend }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const primary = active[0];
    return NextResponse.json({
      datePreset,
      account: {
        name: active.length === 1 ? primary.name : `${active.length} contas`,
        currency: primary.currency || "BRL",
        accountCount: active.length,
      },
      summary,
      campaigns: allCampaigns,
      daily,
    });
  } catch (e: any) {
    const meta = e?.response?.data?.error;
    return NextResponse.json(
      { error: `Erro Meta API: ${meta?.message || e.message}` },
      { status: 502 },
    );
  }
}
