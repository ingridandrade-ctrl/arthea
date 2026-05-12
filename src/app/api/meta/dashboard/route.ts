import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getAccountInsights,
  getCampaignInsightsForAccount,
} from "@/lib/meta/api";

const VALID_PRESETS = new Set([
  "today",
  "yesterday",
  "this_week_mon_sun",
  "last_7d",
  "last_14d",
  "last_28d",
  "last_30d",
  "last_90d",
  "this_month",
  "last_month",
  "this_quarter",
  "maximum",
]);

export async function GET(request: NextRequest) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  const userId = session.user?.id;
  if (!userId) return NextResponse.json({ error: "Sem sessao" }, { status: 401 });

  const datePreset = request.nextUrl.searchParams.get("date_preset") || "last_30d";
  if (!VALID_PRESETS.has(datePreset)) {
    return NextResponse.json({ error: "Periodo invalido" }, { status: 400 });
  }

  const accounts = await prisma.metaAdAccount.findMany({
    where: { connection: { userId, status: "ACTIVE" }, hidden: false },
    include: {
      connection: { select: { accessToken: true, status: true } },
      engagement: { select: { id: true, name: true } },
    },
  });

  if (accounts.length === 0) {
    return NextResponse.json({
      datePreset,
      summary: { spend: 0, impressions: 0, clicks: 0, ctr: 0, cpm: 0 },
      accountCount: 0,
      activeCampaigns: 0,
      perAccount: [],
      topCampaigns: [],
      errors: [],
    });
  }

  const results = await Promise.all(
    accounts.map(async (acc) => {
      try {
        const [insights, campaigns] = await Promise.all([
          getAccountInsights(acc.connection.accessToken, acc.accountId, datePreset),
          getCampaignInsightsForAccount(acc.connection.accessToken, acc.accountId, datePreset),
        ]);
        return { acc, insights, campaigns, error: null as null | string };
      } catch (err: any) {
        const meta = err?.response?.data?.error;
        return {
          acc,
          insights: null,
          campaigns: [],
          error: meta?.message || err.message || "Erro Meta API",
        };
      }
    }),
  );

  let totalSpend = 0;
  let totalImpressions = 0;
  let totalClicks = 0;
  const perAccount = [] as any[];
  const allCampaigns = [] as any[];
  const errors = [] as { accountId: string; name: string; error: string }[];

  for (const r of results) {
    if (r.error) {
      errors.push({ accountId: r.acc.accountId, name: r.acc.name, error: r.error });
    }
    const spend = Number(r.insights?.spend || 0);
    const impressions = Number(r.insights?.impressions || 0);
    const clicks = Number(r.insights?.clicks || 0);
    totalSpend += spend;
    totalImpressions += impressions;
    totalClicks += clicks;

    perAccount.push({
      id: r.acc.id,
      accountId: r.acc.accountId,
      name: r.acc.name,
      currency: r.acc.currency,
      engagement: r.acc.engagement,
      spend,
      impressions,
      clicks,
      campaignCount: r.campaigns.length,
    });

    for (const c of r.campaigns) {
      allCampaigns.push({
        campaignId: c.campaign_id,
        campaignName: c.campaign_name,
        accountName: r.acc.name,
        accountId: r.acc.accountId,
        engagementName: r.acc.engagement?.name ?? null,
        currency: r.acc.currency,
        spend: Number(c.spend || 0),
        impressions: Number(c.impressions || 0),
        clicks: Number(c.clicks || 0),
        ctr: Number(c.ctr || 0),
      });
    }
  }

  perAccount.sort((a, b) => b.spend - a.spend);
  const topCampaigns = allCampaigns
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 10);

  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const cpm = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;

  return NextResponse.json({
    datePreset,
    summary: {
      spend: totalSpend,
      impressions: totalImpressions,
      clicks: totalClicks,
      ctr,
      cpm,
    },
    accountCount: accounts.length,
    activeCampaigns: allCampaigns.length,
    perAccount,
    topCampaigns,
    errors,
  });
}
