import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/portal-auth";
import {
  getAccountSummary,
  getCampaignBreakdown,
  getDailyPerformance,
  getKeywordPerformance,
  getSearchTermsReport,
} from "@/lib/google-ads/api";
import { parseDateRange, dateRangeLabel } from "@/lib/google-ads/format";

export const revalidate = 3600;

// GET /api/google-ads/admin?engagementId=X&dateRange=LAST_30_DAYS
//
// Visão SÊNIOR (admin/manager). Inclui search_impression_share,
// quality_score numérico e impression share perdido por orçamento/qualidade
// pra análise interna.
export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const engagementId = req.nextUrl.searchParams.get("engagementId");
  if (!engagementId) {
    return NextResponse.json({ error: "engagementId obrigatório" }, { status: 400 });
  }

  const account = await prisma.googleAdsAccount.findFirst({
    where: { engagementId, hidden: false },
    include: { connection: { select: { id: true, status: true } } },
  });
  if (!account) {
    return NextResponse.json(
      { error: "Nenhuma conta Google Ads linkada a essa frente" },
      { status: 404 },
    );
  }
  if (account.connection.status !== "ACTIVE") {
    return NextResponse.json(
      { error: `Conexão Google Ads está ${account.connection.status.toLowerCase()}` },
      { status: 503 },
    );
  }

  const dateRange = parseDateRange(req.nextUrl.searchParams.get("dateRange"));
  const ctx = {
    connectionId: account.connection.id,
    customerId: account.customerId,
  };

  try {
    const [summary, campaigns, keywords, searchTerms, daily] = await Promise.all([
      getAccountSummary(ctx, dateRange),
      getCampaignBreakdown(ctx, dateRange, true),
      getKeywordPerformance(ctx, dateRange, 50),
      getSearchTermsReport(ctx, dateRange, 100),
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
      keywords, // qualityScore raw
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
