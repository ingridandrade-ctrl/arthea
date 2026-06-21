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

const API_VERSION = process.env.GOOGLE_ADS_API_VERSION || "v22";
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
  averageCpm: number; // BRL
  cost: number; // BRL
  conversions: number;
  conversionsValue: number; // Receita total
  roas: number; // Receita / Investimento
  costPerConversion: number; // BRL
  // Vídeo (YouTube)
  videoViews: number;
  videoViewRate: number; // views / impressões
  averageCpv: number; // BRL
  videoQuartileP25Rate: number;
  videoQuartileP50Rate: number;
  videoQuartileP75Rate: number;
  videoQuartileP100Rate: number;
  viewThroughConversions: number;
  // Engagement (Display)
  engagements: number;
  engagementRate: number;
};

export type CampaignBreakdownRow = {
  campaignId: string;
  campaignName: string;
  status: string; // ENABLED | PAUSED | REMOVED
  channelType: string; // SEARCH | DISPLAY | VIDEO | SHOPPING | PERFORMANCE_MAX | DEMAND_GEN
  advertisingChannelSubType?: string;
  impressions: number;
  clicks: number;
  ctr: number;
  averageCpc: number;
  averageCpm: number;
  cost: number;
  conversions: number;
  conversionsValue: number;
  roas: number;
  costPerConversion: number;
  // Vídeo
  videoViews: number;
  videoViewRate: number;
  averageCpv: number;
  // Admin / quality
  searchImpressionShare: number | null;
  searchTopImpressionShare: number | null;
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
  conversionsValue: number;
};

// ─── Helpers de parse seguro ─────────────────────────────────────

const num = (v: unknown): number => {
  if (v == null) return 0;
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : 0;
};

// ─── Queries ─────────────────────────────────────────────────────

/**
 * Totais agregados da conta no período.
 *
 * Nota Google Ads API v22: a query no nível `customer` só aceita métricas
 * universais (válidas em todos os canais). Campos específicos de vídeo
 * (video_views, video_view_rate, average_cpv, video_quartile_*) e de display
 * (engagements, engagement_rate, view_through_conversions) só funcionam em
 * `campaign`/`ad_group_ad`. Esses agregados, quando precisos, vêm da soma
 * das linhas de getCampaignBreakdown no endpoint.
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
      metrics.average_cpm,
      metrics.cost_micros,
      metrics.conversions,
      metrics.conversions_value,
      metrics.cost_per_conversion
    FROM customer
    WHERE segments.date DURING ${dateRange}
  `;
  const rows = await runGAQL(ctx, query);

  let impressions = 0;
  let clicks = 0;
  let costMicros = 0;
  let conversions = 0;
  let conversionsValue = 0;
  let cpmNumerator = 0;

  for (const r of rows) {
    const imp = num(r.metrics?.impressions);
    impressions += imp;
    clicks += num(r.metrics?.clicks);
    costMicros += num(r.metrics?.costMicros);
    conversions += num(r.metrics?.conversions);
    conversionsValue += num(r.metrics?.conversionsValue);
    cpmNumerator += num(r.metrics?.averageCpm) * imp;
  }

  const cost = microsToValue(costMicros);
  const ctr = impressions > 0 ? clicks / impressions : 0;
  const averageCpc = clicks > 0 ? cost / clicks : 0;
  const averageCpm = impressions > 0 ? cpmNumerator / impressions : 0;
  const costPerConversion = conversions > 0 ? cost / conversions : 0;
  const roas = cost > 0 ? conversionsValue / cost : 0;

  return {
    impressions,
    clicks,
    ctr,
    averageCpc,
    averageCpm,
    cost,
    conversions,
    conversionsValue,
    roas,
    costPerConversion,
    // Vídeo / engagement zerados — agregados a partir do breakdown de
    // campanhas no endpoint /api/google-ads/dashboard.
    videoViews: 0,
    videoViewRate: 0,
    averageCpv: 0,
    videoQuartileP25Rate: 0,
    videoQuartileP50Rate: 0,
    videoQuartileP75Rate: 0,
    videoQuartileP100Rate: 0,
    viewThroughConversions: 0,
    engagements: 0,
    engagementRate: 0,
  };
}

/**
 * Performance por campanha, ordenada por custo. Inclui search impression
 * share + search top impression share quando `includeAdminMetrics=true`.
 *
 * Sempre retorna métricas avançadas (receita, ROAS, CPM, vídeo) — o resolver
 * de cada campanha decide quais expor pra cliente vs admin.
 */
export async function getCampaignBreakdown(
  ctx: GoogleAdsRequestContext,
  dateRange: DateRangeKey,
  includeAdminMetrics = false,
): Promise<CampaignBreakdownRow[]> {
  const adminFields = includeAdminMetrics
    ? `, metrics.search_impression_share, metrics.search_top_impression_share, metrics.search_budget_lost_impression_share, metrics.search_rank_lost_impression_share`
    : "";
  // Métricas universais (todos os channel_types). Vídeo é puxado via
  // getVideoCampaignBreakdown quando tiver campanha VIDEO.
  const query = `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign.advertising_channel_type,
      campaign.advertising_channel_sub_type,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.average_cpc,
      metrics.average_cpm,
      metrics.cost_micros,
      metrics.conversions,
      metrics.conversions_value,
      metrics.cost_per_conversion${adminFields}
    FROM campaign
    WHERE segments.date DURING ${dateRange}
    ORDER BY metrics.cost_micros DESC
  `;
  const rows = await runGAQL(ctx, query);
  return rows.map((r): CampaignBreakdownRow => {
    const cost = microsToValue(r.metrics?.costMicros);
    const conversionsValue = num(r.metrics?.conversionsValue);
    const roas = cost > 0 ? conversionsValue / cost : 0;
    return {
      campaignId: String(r.campaign?.id ?? ""),
      campaignName: String(r.campaign?.name ?? ""),
      status: String(r.campaign?.status ?? ""),
      channelType: String(r.campaign?.advertisingChannelType ?? ""),
      advertisingChannelSubType: r.campaign?.advertisingChannelSubType
        ? String(r.campaign.advertisingChannelSubType)
        : undefined,
      impressions: num(r.metrics?.impressions),
      clicks: num(r.metrics?.clicks),
      ctr: num(r.metrics?.ctr),
      averageCpc: microsToValue(r.metrics?.averageCpc),
      averageCpm: num(r.metrics?.averageCpm),
      cost,
      conversions: num(r.metrics?.conversions),
      conversionsValue,
      roas,
      costPerConversion: microsToValue(r.metrics?.costPerConversion),
      videoViews: 0,
      videoViewRate: 0,
      averageCpv: 0,
      searchImpressionShare: includeAdminMetrics
        ? num(r.metrics?.searchImpressionShare) || null
        : null,
      searchTopImpressionShare: includeAdminMetrics
        ? num(r.metrics?.searchTopImpressionShare) || null
        : null,
    };
  });
}

/**
 * Performance específica de campanhas VIDEO (YouTube). Query separada
 * porque campos de vídeo só funcionam quando o channel type é VIDEO.
 * Retorna lista que pode ser correlacionada com getCampaignBreakdown via id.
 */
export type VideoCampaignMetrics = {
  campaignId: string;
  videoViews: number;
  videoViewRate: number;
  averageCpv: number;
  videoQuartileP25Rate: number;
  videoQuartileP50Rate: number;
  videoQuartileP75Rate: number;
  videoQuartileP100Rate: number;
};

export async function getVideoCampaignBreakdown(
  ctx: GoogleAdsRequestContext,
  dateRange: DateRangeKey,
): Promise<VideoCampaignMetrics[]> {
  const query = `
    SELECT
      campaign.id,
      metrics.video_views,
      metrics.video_view_rate,
      metrics.average_cpv,
      metrics.video_quartile_p25_rate,
      metrics.video_quartile_p50_rate,
      metrics.video_quartile_p75_rate,
      metrics.video_quartile_p100_rate
    FROM campaign
    WHERE segments.date DURING ${dateRange}
      AND campaign.advertising_channel_type = 'VIDEO'
  `;
  try {
    const rows = await runGAQL(ctx, query);
    return rows.map(
      (r): VideoCampaignMetrics => ({
        campaignId: String(r.campaign?.id ?? ""),
        videoViews: num(r.metrics?.videoViews),
        videoViewRate: num(r.metrics?.videoViewRate),
        averageCpv: microsToValue(r.metrics?.averageCpv),
        videoQuartileP25Rate: num(r.metrics?.videoQuartileP25Rate),
        videoQuartileP50Rate: num(r.metrics?.videoQuartileP50Rate),
        videoQuartileP75Rate: num(r.metrics?.videoQuartileP75Rate),
        videoQuartileP100Rate: num(r.metrics?.videoQuartileP100Rate),
      }),
    );
  } catch (err) {
    // Conta sem campanhas VIDEO ativas no período retorna erro de UNRECOGNIZED_FIELD
    // em alguns casos. Tratamos como vazio em vez de propagar.
    if (err instanceof Error && /UNRECOGNIZED|VIDEO|empty/i.test(err.message)) {
      return [];
    }
    return [];
  }
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

/** Série diária da conta inteira (pro gráfico de evolução). Inclui receita. */
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
      metrics.conversions,
      metrics.conversions_value
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
      conversionsValue: num(r.metrics?.conversionsValue),
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
 *
 * Implementado via GAQL em customer_client (no MCC). Evita o endpoint REST
 * customers:listAccessibleCustomers que tem histórico de mudanças entre
 * versões da API.
 */
export async function listAccessibleCustomers(
  connectionId: string,
): Promise<ListedCustomer[]> {
  const accessToken = await getValidAccessToken(connectionId);
  const { developerToken, mccCustomerId } = getGoogleAdsConfig();

  const query = `
    SELECT
      customer_client.id,
      customer_client.descriptive_name,
      customer_client.currency_code,
      customer_client.manager,
      customer_client.status
    FROM customer_client
    WHERE customer_client.status = 'ENABLED'
  `;

  const url = `${API_BASE}/customers/${mccCustomerId}/googleAds:searchStream`;
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
    const t = await res.text();
    throw new Error(`listAccessibleCustomers ${res.status}: ${t.slice(0, 400)}`);
  }

  const data = (await res.json()) as SearchStreamBatch[] | SearchStreamBatch;
  const batches = Array.isArray(data) ? data : [data];
  const accounts: ListedCustomer[] = [];
  for (const batch of batches) {
    for (const row of batch.results || []) {
      const cc = row.customerClient;
      if (!cc?.id) continue;
      // Pula a própria MCC e contas manager (só queremos contas de cliente final)
      if (cc.manager) continue;
      accounts.push({
        customerId: String(cc.id),
        name: String(cc.descriptiveName || `Customer ${cc.id}`),
        currencyCode: String(cc.currencyCode || "BRL"),
      });
    }
  }
  return accounts;
}
