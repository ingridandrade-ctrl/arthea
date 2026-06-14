import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getAccountInsights,
  getCampaignInsightsForAccount,
  getAccountDailyInsights,
  getAdInsightsForAccount,
  getAdCreatives,
} from "@/lib/meta/api";
import { buildMetaSummary, aggregateMetaSummaries } from "@/lib/meta/resolvers";
import { mapObjectiveToGroup, OBJECTIVE_DEFINITIONS, type ObjectiveGroup } from "@/lib/meta/objectives";

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
      objectiveGroups: [],
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
      objectiveGroups: [],
      error: "Conexão Meta Ads não está ativa. A equipe Arthea precisa reconectar.",
    });
  }

  try {
    const perAccountSummaries: ReturnType<typeof buildMetaSummary>[] = [];
    const allCampaigns: Array<any> = [];
    const allAds: Array<any> = [];
    const dailyMap = new Map<string, { spend: number; clicks: number }>();
    // Map ad_id → access token usado pra buscar creative depois
    const adAccessTokenMap = new Map<string, string>();

    for (const acc of active) {
      const [insights, campaigns, daily, ads] = await Promise.all([
        getAccountInsights(acc.connection.accessToken, acc.accountId, datePreset),
        getCampaignInsightsForAccount(acc.connection.accessToken, acc.accountId, datePreset),
        getAccountDailyInsights(acc.connection.accessToken, acc.accountId, datePreset),
        getAdInsightsForAccount(acc.connection.accessToken, acc.accountId, datePreset, 300).catch(() => [] as any[]),
      ]);

      perAccountSummaries.push(buildMetaSummary(insights));

      for (const c of campaigns) {
        const cSummary = buildMetaSummary(c);
        allCampaigns.push({
          campaignId: c.campaign_id,
          campaignName: c.campaign_name,
          objective: c.objective,
          objectiveGroup: mapObjectiveToGroup(c.objective),
          accountName: acc.name,
          ...cSummary,
        });
      }

      // Indexa campanha → objetivo pra propagar pros ads
      const campObjective = new Map<string, string | undefined>();
      for (const c of campaigns) campObjective.set(c.campaign_id, c.objective);

      for (const ad of ads) {
        const adSummary = buildMetaSummary(ad);
        const adObj = ad.objective || campObjective.get(ad.campaign_id);
        allAds.push({
          adId: ad.ad_id,
          adName: ad.ad_name,
          campaignId: ad.campaign_id,
          campaignName: ad.campaign_name,
          adsetId: ad.adset_id,
          adsetName: ad.adset_name,
          objective: adObj,
          objectiveGroup: mapObjectiveToGroup(adObj),
          accountName: acc.name,
          ...adSummary,
        });
        adAccessTokenMap.set(ad.ad_id, acc.connection.accessToken);
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

    // ─── Agrupa campanhas por objetivo ───────────────────────────
    const groupMap = new Map<ObjectiveGroup, any>();
    for (const c of allCampaigns) {
      const g = c.objectiveGroup as ObjectiveGroup;
      if (!groupMap.has(g)) {
        groupMap.set(g, {
          ...OBJECTIVE_DEFINITIONS[g],
          campaigns: [] as any[],
          ads: [] as any[],
          spend: 0,
        });
      }
      const block = groupMap.get(g)!;
      block.campaigns.push(c);
      block.spend += c.spend || 0;
    }

    // Distribui ads pros grupos
    for (const ad of allAds) {
      const g = ad.objectiveGroup as ObjectiveGroup;
      const block = groupMap.get(g);
      if (block) block.ads.push(ad);
    }

    const totalSpend = summary.spend || 1;
    const objectiveGroups = Array.from(groupMap.values())
      .map((block) => {
        // Agrega summary de todas as campanhas do grupo
        const campaignSummaries = block.campaigns.map((c: any) => ({
          ...c,
        }));
        const blockSummary = aggregateMetaSummaries(campaignSummaries as any);
        // Pega top 6 ads ordenados pela métrica relevante do objetivo
        const def = OBJECTIVE_DEFINITIONS[block.group as ObjectiveGroup];
        const rankKey = def.rankBy;
        const topAds = [...block.ads]
          .filter((ad: any) => (ad[rankKey] || 0) > 0 || (ad.spend || 0) > 0)
          .sort((a: any, b: any) => (b[rankKey] || 0) - (a[rankKey] || 0))
          .slice(0, 6);
        return {
          group: block.group,
          label: def.label,
          description: def.description,
          emoji: def.emoji,
          primaryMetrics: def.primaryMetrics,
          secondaryMetrics: def.secondaryMetrics,
          headlineLabel: def.headlineLabel,
          headlineMetric: def.headlineMetric,
          rankBy: def.rankBy,
          spend: block.spend,
          sharePct: block.spend / totalSpend,
          summary: blockSummary,
          campaigns: campaignSummaries.sort((a: any, b: any) => b.spend - a.spend),
          topAds,
        };
      })
      .sort((a, b) => b.spend - a.spend);

    // ─── Busca criativos (thumbnails) dos top ads de cada grupo ──
    const adIdsToFetch = objectiveGroups.flatMap((g) => g.topAds.map((a: any) => a.adId));
    const creativesMap: Record<string, any> = {};
    if (adIdsToFetch.length > 0 && active[0]) {
      try {
        // Usa o token da primeira conta ativa (assumindo single-account pra simplificar)
        // TODO: multi-account precisa indexar token por ad
        const creatives = await getAdCreatives(active[0].connection.accessToken, adIdsToFetch);
        Object.assign(creativesMap, creatives);
      } catch {
        // Falha silenciosa — UI mostra placeholder
      }
    }

    // Anexa creative info aos ads
    for (const group of objectiveGroups) {
      group.topAds = group.topAds.map((ad: any) => ({
        ...ad,
        creative: creativesMap[ad.adId] || null,
      }));
    }

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
      objectiveGroups,
    });
  } catch (e: any) {
    const meta = e?.response?.data?.error;
    return NextResponse.json(
      { error: `Erro Meta API: ${meta?.message || e.message}` },
      { status: 502 },
    );
  }
}
