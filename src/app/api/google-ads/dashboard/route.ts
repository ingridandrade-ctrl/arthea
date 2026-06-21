import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getAccountSummary,
  getCampaignBreakdown,
  getDailyPerformance,
  getKeywordPerformance,
  getSearchTermsReport,
} from "@/lib/google-ads/api";
import { parseDateRange, dateRangeLabel } from "@/lib/google-ads/format";

export const revalidate = 3600; // cache 1h

// GET /api/google-ads/dashboard?engagementId=X&dateRange=LAST_30_DAYS
//
// Visão do CLIENTE. Não inclui quality_score numérico nem search impression
// share — só o suficiente pra dashboard editorial.
export async function GET(req: NextRequest) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const role = session.user?.role;
  const userId = session.user?.id as string;

  const engagementId = req.nextUrl.searchParams.get("engagementId");
  if (!engagementId) {
    return NextResponse.json({ error: "engagementId obrigatório" }, { status: 400 });
  }

  // CLIENT só vê seu próprio engagement; admin/manager vê qualquer.
  const engagement = await prisma.clientEngagement.findUnique({
    where: { id: engagementId },
    select: { id: true, clientId: true, name: true, slug: true },
  });
  if (!engagement) {
    return NextResponse.json({ error: "Engagement não encontrado" }, { status: 404 });
  }
  if (role === "CLIENT" && engagement.clientId !== userId) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const account = await prisma.googleAdsAccount.findFirst({
    where: { engagementId, hidden: false },
    include: { connection: { select: { id: true, status: true } } },
  });
  if (!account) {
    return NextResponse.json({
      dateRange: parseDateRange(req.nextUrl.searchParams.get("dateRange")),
      account: null,
      summary: null,
      campaigns: [],
      keywords: [],
      searchTerms: [],
      daily: [],
      note: "Nenhuma conta Google Ads linkada a essa frente ainda.",
    });
  }

  if (account.connection.status !== "ACTIVE") {
    return NextResponse.json({
      account: {
        customerId: account.customerId,
        name: account.name,
        currencyCode: account.currencyCode,
      },
      error: `Conexão Google Ads está ${account.connection.status.toLowerCase()}. A equipe Arthea precisa reconectar.`,
    });
  }

  const dateRange = parseDateRange(req.nextUrl.searchParams.get("dateRange"));
  const ctx = {
    connectionId: account.connection.id,
    customerId: account.customerId,
  };

  try {
    const [summary, campaigns, keywords, searchTerms, daily] = await Promise.all([
      getAccountSummary(ctx, dateRange),
      getCampaignBreakdown(ctx, dateRange, false),
      getKeywordPerformance(ctx, dateRange, 20),
      getSearchTermsReport(ctx, dateRange, 30),
      getDailyPerformance(ctx, dateRange),
    ]);

    return NextResponse.json({
      dateRange,
      dateRangeLabel: dateRangeLabel(dateRange),
      account: {
        customerId: account.customerId,
        name: account.name,
        currencyCode: account.currencyCode,
      },
      summary,
      campaigns,
      // Pra cliente, mascaramos quality_score em semáforo
      keywords: keywords.map((k) => ({
        ...k,
        qualityScore: undefined,
        qualityTier: tierFromQuality(k.qualityScore),
      })),
      searchTerms,
      daily,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: `Erro Google Ads API: ${e.message}` },
      { status: 502 },
    );
  }
}

function tierFromQuality(q: number | null): "good" | "warn" | "bad" | "unknown" {
  if (q == null) return "unknown";
  if (q >= 7) return "good";
  if (q >= 4) return "warn";
  return "bad";
}
