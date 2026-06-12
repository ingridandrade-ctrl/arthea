// Wrapper REST da Google Ads API v17 (searchStream).
// Documentação: https://developers.google.com/google-ads/api/docs/start
//
// Auth:
//   - Authorization: Bearer {access_token}   (renovado via auth.ts)
//   - developer-token: {GOOGLE_ADS_DEVELOPER_TOKEN}
//   - login-customer-id: {MCC sem hifens}    (necessário quando acessando contas via MCC)
//
// Todas as queries usam GAQL (Google Ads Query Language) e o endpoint
// googleAds:searchStream que retorna batches no array `results`.

import { getValidAccessToken } from "./auth";
import { getGoogleAdsConfig, stripHyphens } from "./config";
import {
  microsToValue,
  type DateRangeKey,
} from "./format";

const API_VERSION = "v17";
const API_BASE = `https://googleads.googleapis.com/${API_VERSION}`;

export type GoogleAdsRequestContext = {
  connectionId: string;
  customerId: string; // sem hífens
};

// ─── Low-level: executa GAQL e retorna linhas planas ─────────────

type SearchStreamBatch = {
  results?: any[];
  fieldMask?: string;
  requestId?: string;
};

async function runGAQL(ctx: GoogleAdsRequestContext, query: string): Promise<any[]> {
  const accessToken = await getValidAccessToken(ctx.connectionId);
  const { developerToken, mccCustomerId } = getGoogleAdsConfig();
  const customerId = stripHyphens(ctx.customerId);
  const url = `${API_BASE}/customers/${customerId}/googleAds:searchStream`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "developer-token": developerToken,
      "login-customer-id": mccCustomerId,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google Ads API ${res.status}: ${errText.slice(0, 800)}`);
  }

  const data = (await res.json()) as SearchStreamBatch[] | SearchStreamBatch;
  const batches = Array.isArray(data) ? data : [data];
  const rows: any[] = [];
  for (const batch of batches) {
    if (batch.results) rows.push(...batch.results);
  }
  return rows;
}

// ─── Tipos de saída ──────────────────────────────────────────────

export type AccountSummary = {
  impressions: number;
  clicks: number;
  ctr: number; // 0–1
  averageCpc: number; // BRL
  cost: number; // BRL
  conversions: number;
  costPerConversion: number; // BRL
};

export type CampaignBreakdownRow = {
  campaignId: string;
  campaignName: string;
  status: string; // ENABLED | PAUSED | REMOVED
  impressions: number;
  clicks: number;
  ctr: number;
  averageCpc: number;
  cost: number;
  conversions: number;
  costPerConversion: number;
  searchImpressionShare: number | null; // 0–1 (só admin)
};

export type KeywordPerformanceRow = {
  keywordText: string;
  matchType: string;
  adGroupName: string;
  campaignName: string;
  impressions: number;
  clicks: number;
  ctr: number;
  averageCpc: number;
  cost: number;
  conversions: number;
  qualityScore: number | null; // 1–10 (null se sem dados)
};

export type SearchTermRow = {
  searchTerm: string;
  campaignName: string;
  adGroupName: string;
  impressions: number;
  clicks: number;
  ctr: number;
  cost: number;
  conversions: number;
};

export type DailyPerformanceRow = {
  date: string; // YYYY-MM-DD
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
};

// ─── Helpers de parse seguro ─────────────────────────────────────

const num = (v: unknown): number => {
  if (v == null) return 0;
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : 0;
};

// ─── Queries ─────────────────────────────────────────────────────

/**
 * Totais agregados da conta no período (impressões, cliques, CTR, CPC médio,
 * custo, conversões, custo por conversão).
 */
export async function getAccountSummary(
  ctx: GoogleAdsRequestContext,
  dateRange: DateRangeKey,
): Promise<AccountSummary> {
  const query = `
    SELECT
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.average_cpc,
      metrics.cost_micros,
      metrics.conversions,
      metrics.cost_per_conversion
    FROM customer
    WHERE segments.date DURING ${dateRange}
  `;
  const rows = await runGAQL(ctx, query);
  let impressions = 0;
  let clicks = 0;
  let costMicros = 0;
  let conversions = 0;
  for (const r of rows) {
    impressions += num(r.metrics?.impressions);
    clicks += num(r.metrics?.clicks);
    costMicros += num(r.metrics?.costMicros);
    conversions += num(r.metrics?.conversions);
  }
  const cost = microsToValue(costMicros);
  const ctr = impressions > 0 ? clicks / impressions : 0;
  const averageCpc = clicks > 0 ? cost / clicks : 0;
  const costPerConversion = conversions > 0 ? cost / conversions : 0;
  return { impressions, clicks, ctr, averageCpc, cost, conversions, costPerConversion };
}

/**
 * Performance por campanha, ordenada por custo. Inclui search impression
 * share só se `includeAdminMetrics=true` (visão sênior).
 */
export async function getCampaignBreakdown(
  ctx: GoogleAdsRequestContext,
  dateRange: DateRangeKey,
  includeAdminMetrics = false,
): Promise<CampaignBreakdownRow[]> {
  const adminFields = includeAdminMetrics
    ? `, metrics.search_impression_share, metrics.search_budget_lost_impression_share, metrics.search_rank_lost_impression_share`
    : "";
  const query = `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.average_cpc,
      metrics.cost_micros,
      metrics.conversions,
      metrics.cost_per_conversion${adminFields}
    FROM campaign
    WHERE segments.date DURING ${dateRange}
    ORDER BY metrics.cost_micros DESC
  `;
  const rows = await runGAQL(ctx, query);
  return rows.map(
    (r): CampaignBreakdownRow => ({
      campaignId: String(r.campaign?.id ?? ""),
      campaignName: String(r.campaign?.name ?? ""),
      status: String(r.campaign?.status ?? ""),
      impressions: num(r.metrics?.impressions),
      clicks: num(r.metrics?.clicks),
      ctr: num(r.metrics?.ctr),
      averageCpc: microsToValue(r.metrics?.averageCpc),
      cost: microsToValue(r.metrics?.costMicros),
      conversions: num(r.metrics?.conversions),
      costPerConversion: microsToValue(r.metrics?.costPerConversion),
      searchImpressionShare: includeAdminMetrics
        ? num(r.metrics?.searchImpressionShare) || null
        : null,
    }),
  );
}

/**
 * Top 20 keywords por impressões, só ENABLED. Inclui quality_score
 * (semáforo no cliente, número real só na visão admin).
 */
export async function getKeywordPerformance(
  ctx: GoogleAdsRequestContext,
  dateRange: DateRangeKey,
  limit = 20,
): Promise<KeywordPerformanceRow[]> {
  const query = `
    SELECT
      ad_group_criterion.keyword.text,
      ad_group_criterion.keyword.match_type,
      ad_group.name,
      campaign.name,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.average_cpc,
      metrics.cost_micros,
      metrics.conversions,
      ad_group_criterion.quality_info.quality_score
    FROM keyword_view
    WHERE segments.date DURING ${dateRange}
      AND ad_group_criterion.status = 'ENABLED'
    ORDER BY metrics.impressions DESC
    LIMIT ${limit}
  `;
  const rows = await runGAQL(ctx, query);
  return rows.map(
    (r): KeywordPerformanceRow => ({
      keywordText: String(r.adGroupCriterion?.keyword?.text ?? ""),
      matchType: String(r.adGroupCriterion?.keyword?.matchType ?? ""),
      adGroupName: String(r.adGroup?.name ?? ""),
      campaignName: String(r.campaign?.name ?? ""),
      impressions: num(r.metrics?.impressions),
      clicks: num(r.metrics?.clicks),
      ctr: num(r.metrics?.ctr),
      averageCpc: microsToValue(r.metrics?.averageCpc),
      cost: microsToValue(r.metrics?.costMicros),
      conversions: num(r.metrics?.conversions),
      qualityScore: r.adGroupCriterion?.qualityInfo?.qualityScore
        ? num(r.adGroupCriterion.qualityInfo.qualityScore)
        : null,
    }),
  );
}

/**
 * Top 30 termos de busca que ativaram anúncios.
 *
 * NOTA: search_term_view pode retornar vazio em campanhas Performance Max,
 * Demand Gen ou contas com pouca atividade. Quando vazio, a UI mostra
 * uma nota explicativa sem quebrar.
 */
export async function getSearchTermsReport(
  ctx: GoogleAdsRequestContext,
  dateRange: DateRangeKey,
  limit = 30,
): Promise<SearchTermRow[]> {
  const query = `
    SELECT
      search_term_view.search_term,
      campaign.name,
      ad_group.name,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.cost_micros,
      metrics.conversions
    FROM search_term_view
    WHERE segments.date DURING ${dateRange}
    ORDER BY metrics.impressions DESC
    LIMIT ${limit}
  `;
  try {
    const rows = await runGAQL(ctx, query);
    return rows.map(
      (r): SearchTermRow => ({
        searchTerm: String(r.searchTermView?.searchTerm ?? ""),
        campaignName: String(r.campaign?.name ?? ""),
        adGroupName: String(r.adGroup?.name ?? ""),
        impressions: num(r.metrics?.impressions),
        clicks: num(r.metrics?.clicks),
        ctr: num(r.metrics?.ctr),
        cost: microsToValue(r.metrics?.costMicros),
        conversions: num(r.metrics?.conversions),
      }),
    );
  } catch (err) {
    // Performance Max / Demand Gen não suportam search_term_view —
    // retornamos vazio em vez de propagar erro pra UI.
    if (err instanceof Error && /UNSUPPORTED|search_term_view/i.test(err.message)) {
      return [];
    }
    throw err;
  }
}

/** Série diária da conta inteira (pro gráfico de evolução). */
export async function getDailyPerformance(
  ctx: GoogleAdsRequestContext,
  dateRange: DateRangeKey,
): Promise<DailyPerformanceRow[]> {
  const query = `
    SELECT
      segments.date,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions
    FROM customer
    WHERE segments.date DURING ${dateRange}
    ORDER BY segments.date ASC
  `;
  const rows = await runGAQL(ctx, query);
  return rows.map(
    (r): DailyPerformanceRow => ({
      date: String(r.segments?.date ?? ""),
      impressions: num(r.metrics?.impressions),
      clicks: num(r.metrics?.clicks),
      cost: microsToValue(r.metrics?.costMicros),
      conversions: num(r.metrics?.conversions),
    }),
  );
}

// ─── Listagem de contas (pro admin linkar a engagements) ──────────

export type ListedCustomer = {
  customerId: string;
  name: string;
  currencyCode: string;
};

/**
 * Lista as contas acessíveis pelo MCC configurado. Usado quando o admin
 * vai linkar uma conta Google Ads a um ClientEngagement.
 */
export async function listAccessibleCustomers(
  connectionId: string,
): Promise<ListedCustomer[]> {
  const accessToken = await getValidAccessToken(connectionId);
  const { developerToken, mccCustomerId } = getGoogleAdsConfig();
  // 1) Listar IDs acessíveis
  const idsRes = await fetch(`${API_BASE}/customers:listAccessibleCustomers`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "developer-token": developerToken,
    },
  });
  if (!idsRes.ok) {
    const t = await idsRes.text();
    throw new Error(`listAccessibleCustomers ${idsRes.status}: ${t.slice(0, 400)}`);
  }
  const idsData = (await idsRes.json()) as { resourceNames?: string[] };
  const ids = (idsData.resourceNames || []).map((rn) => rn.split("/")[1]);
  if (ids.length === 0) return [];

  // 2) Pra cada id, perguntar nome + moeda via GAQL no MCC
  const accounts: ListedCustomer[] = [];
  for (const id of ids) {
    try {
      const url = `${API_BASE}/customers/${mccCustomerId}/googleAds:search`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "developer-token": developerToken,
          "login-customer-id": mccCustomerId,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            SELECT customer_client.id, customer_client.descriptive_name, customer_client.currency_code
            FROM customer_client
            WHERE customer_client.id = ${id}
            LIMIT 1
          `,
        }),
      });
      if (!res.ok) continue;
      const data = (await res.json()) as { results?: any[] };
      const row = data.results?.[0];
      if (!row?.customerClient) continue;
      accounts.push({
        customerId: String(row.customerClient.id),
        name: String(row.customerClient.descriptiveName || `Customer ${id}`),
        currencyCode: String(row.customerClient.currencyCode || "BRL"),
      });
    } catch {
      // Ignora contas inacessíveis via MCC
    }
  }
  return accounts;
}
