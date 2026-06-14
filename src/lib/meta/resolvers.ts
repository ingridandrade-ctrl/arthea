// Resolvers pra extrair valores das estruturas aninhadas do Meta Insights
// (actions[], action_values[], cost_per_action_type[], video_*_actions[]).
//
// O Meta retorna métricas como Resultados, Leads, Compras dentro de `actions[]`
// onde cada item é { action_type: "lead", value: "42" }. Aqui centralizamos
// o parsing pra evitar tipar/extrair errado em vários lugares.

import type { MetaActionRow, MetaInsights, MetaCampaignInsight } from "./api";

type AnyInsights = MetaInsights | MetaCampaignInsight;

// ─── Lookup primitivo ────────────────────────────────────────────

export function getActionValue(rows: MetaActionRow[] | undefined, type: string): number {
  if (!rows) return 0;
  const row = rows.find((r) => r.action_type === type);
  if (!row) return 0;
  const n = Number(row.value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Soma valores de várias actions (ex: resultados = leads + purchases + onsite_conversion).
 * Útil quando objetivo da campanha é variado e queremos "Resultados" como termo guarda-chuva.
 */
export function sumActionValues(rows: MetaActionRow[] | undefined, types: string[]): number {
  if (!rows) return 0;
  let sum = 0;
  for (const t of types) sum += getActionValue(rows, t);
  return sum;
}

// ─── Métricas de conversão ───────────────────────────────────────

/**
 * Conta de Resultados agregada. Convenção Arthea:
 *   - Leads (lead form Meta) + leads do pixel + purchases + onsite_conversions de leads.
 *
 * Quando a campanha tem objetivo claro (LEAD_GENERATION), Resultados = leads.
 * Quando é mista, conta tudo que vira "negócio fechado ou semi-fechado".
 */
const RESULT_ACTION_TYPES = [
  "lead",
  "onsite_conversion.lead_grouped",
  "offsite_conversion.fb_pixel_lead",
  "purchase",
  "onsite_conversion.purchase",
  "offsite_conversion.fb_pixel_purchase",
];

export function getResults(insights: AnyInsights): number {
  return sumActionValues(insights.actions, RESULT_ACTION_TYPES);
}

export function getCostPerResult(insights: AnyInsights): number {
  const results = getResults(insights);
  const spend = Number(insights.spend || 0);
  return results > 0 ? spend / results : 0;
}

export function getLeads(insights: AnyInsights): number {
  return sumActionValues(insights.actions, [
    "lead",
    "onsite_conversion.lead_grouped",
    "offsite_conversion.fb_pixel_lead",
  ]);
}

export function getCostPerLead(insights: AnyInsights): number {
  const leads = getLeads(insights);
  const spend = Number(insights.spend || 0);
  return leads > 0 ? spend / leads : 0;
}

export function getPurchases(insights: AnyInsights): number {
  return sumActionValues(insights.actions, [
    "purchase",
    "onsite_conversion.purchase",
    "offsite_conversion.fb_pixel_purchase",
  ]);
}

export function getCostPerPurchase(insights: AnyInsights): number {
  const purchases = getPurchases(insights);
  const spend = Number(insights.spend || 0);
  return purchases > 0 ? spend / purchases : 0;
}

export function getPurchaseValue(insights: AnyInsights): number {
  return sumActionValues(insights.action_values, [
    "purchase",
    "onsite_conversion.purchase",
    "offsite_conversion.fb_pixel_purchase",
  ]);
}

export function getPurchaseRoas(insights: AnyInsights): number {
  if (insights.purchase_roas && insights.purchase_roas.length > 0) {
    const n = Number(insights.purchase_roas[0].value);
    if (Number.isFinite(n)) return n;
  }
  const value = getPurchaseValue(insights);
  const spend = Number(insights.spend || 0);
  return spend > 0 ? value / spend : 0;
}

export function getTicketMedio(insights: AnyInsights): number {
  const value = getPurchaseValue(insights);
  const purchases = getPurchases(insights);
  return purchases > 0 ? value / purchases : 0;
}

export function getConversations(insights: AnyInsights): number {
  return sumActionValues(insights.actions, [
    "onsite_conversion.messaging_conversation_started_7d",
    "onsite_conversion.total_messaging_connection",
  ]);
}

export function getCostPerConversation(insights: AnyInsights): number {
  const conversations = getConversations(insights);
  const spend = Number(insights.spend || 0);
  return conversations > 0 ? spend / conversations : 0;
}

export function getLandingPageViews(insights: AnyInsights): number {
  return getActionValue(insights.actions, "landing_page_view");
}

export function getCostPerLandingPageView(insights: AnyInsights): number {
  const views = getLandingPageViews(insights);
  const spend = Number(insights.spend || 0);
  return views > 0 ? spend / views : 0;
}

// ─── Métricas de vídeo ───────────────────────────────────────────

/**
 * Visualizações de 3 segundos. No Meta, isso é `video_view` em actions[].
 * Pra Reels e short-form, esse é o numerador do Hook Rate.
 */
export function getVideo3SecWatched(insights: AnyInsights): number {
  return getActionValue(insights.actions, "video_view");
}

/**
 * Hook Rate / Taxa de Parada no Gancho.
 *   = video_3_sec_watched / impressões
 * Indica força do gancho dos primeiros segundos. Benchmark Reels: 25-35%.
 */
export function getHookRate(insights: AnyInsights): number {
  const views3s = getVideo3SecWatched(insights);
  const impressions = Number(insights.impressions || 0);
  return impressions > 0 ? views3s / impressions : 0;
}

/** Pega o valor de `video_*_watched_actions` (primeiro item geralmente é "video_view"). */
function getVideoActionValue(rows: MetaActionRow[] | undefined): number {
  if (!rows || rows.length === 0) return 0;
  // Meta retorna múltiplos action_types às vezes (video_view + outros).
  // Pegamos o video_view default ou somamos.
  for (const r of rows) {
    if (r.action_type === "video_view") {
      const n = Number(r.value);
      if (Number.isFinite(n)) return n;
    }
  }
  // Fallback: soma todos
  let sum = 0;
  for (const r of rows) {
    const n = Number(r.value);
    if (Number.isFinite(n)) sum += n;
  }
  return sum;
}

export function getVideoP25Watched(insights: AnyInsights): number {
  return getVideoActionValue(insights.video_p25_watched_actions);
}

export function getVideoP50Watched(insights: AnyInsights): number {
  return getVideoActionValue(insights.video_p50_watched_actions);
}

export function getVideoP75Watched(insights: AnyInsights): number {
  return getVideoActionValue(insights.video_p75_watched_actions);
}

export function getVideoP95Watched(insights: AnyInsights): number {
  return getVideoActionValue(insights.video_p95_watched_actions);
}

export function getVideoP100Watched(insights: AnyInsights): number {
  return getVideoActionValue(insights.video_p100_watched_actions);
}

/**
 * Hold Rate / Taxa de Retenção.
 *   = video_p25_watched / video_3_sec_watched
 * Mede se o conteúdo segura depois do hook. Bom: 50-70%.
 */
export function getHoldRate(insights: AnyInsights): number {
  const views3s = getVideo3SecWatched(insights);
  const p25 = getVideoP25Watched(insights);
  return views3s > 0 ? p25 / views3s : 0;
}

export function getThruPlayWatched(insights: AnyInsights): number {
  return getVideoActionValue(insights.video_thruplay_watched_actions);
}

export function getThruPlayRate(insights: AnyInsights): number {
  const thruplays = getThruPlayWatched(insights);
  const impressions = Number(insights.impressions || 0);
  return impressions > 0 ? thruplays / impressions : 0;
}

export function getCostPerThruPlay(insights: AnyInsights): number {
  if (insights.cost_per_thruplay) {
    const n = Number(insights.cost_per_thruplay);
    if (Number.isFinite(n)) return n;
  }
  const tp = getThruPlayWatched(insights);
  const spend = Number(insights.spend || 0);
  return tp > 0 ? spend / tp : 0;
}

export function getCostPer3SecView(insights: AnyInsights): number {
  if (insights.cost_per_action_type) {
    const v = getActionValue(insights.cost_per_action_type, "video_view");
    if (v > 0) return v;
  }
  const views = getVideo3SecWatched(insights);
  const spend = Number(insights.spend || 0);
  return views > 0 ? spend / views : 0;
}

export function getVideoAvgTimeWatched(insights: AnyInsights): number {
  return getVideoActionValue(insights.video_avg_time_watched_actions);
}

export function getVideoCompletionRate(insights: AnyInsights): number {
  const views3s = getVideo3SecWatched(insights);
  const p100 = getVideoP100Watched(insights);
  return views3s > 0 ? p100 / views3s : 0;
}

// ─── Builder de summary completo ─────────────────────────────────

/**
 * Resumo completo de uma conta Meta agregando todos os campos calculados.
 * Use no endpoint /api/meta/engagement-dashboard pra retornar pronto pra UI.
 */
export type MetaFullSummary = {
  // Brutos
  spend: number;
  impressions: number;
  reach: number;
  frequency: number;
  clicks: number;
  linkClicks: number;
  // Performance
  ctr: number;
  cpc: number;
  cpm: number;
  // Conversão
  results: number;
  costPerResult: number;
  leads: number;
  costPerLead: number;
  purchases: number;
  costPerPurchase: number;
  purchaseValue: number;
  purchaseRoas: number;
  ticketMedio: number;
  conversations: number;
  costPerConversation: number;
  landingPageViews: number;
  costPerLandingPageView: number;
  // Vídeo
  video3SecWatched: number;
  hookRate: number;
  costPer3SecView: number;
  videoP25Watched: number;
  videoP50Watched: number;
  videoP75Watched: number;
  videoP95Watched: number;
  videoP100Watched: number;
  holdRate: number;
  thruPlayWatched: number;
  thruPlayRate: number;
  costPerThruPlay: number;
  videoAvgTimeWatched: number;
  videoCompletionRate: number;
};

export function buildMetaSummary(insights: AnyInsights | null | undefined): MetaFullSummary {
  if (!insights) return EMPTY_SUMMARY;
  const spend = Number(insights.spend || 0);
  const impressions = Number(insights.impressions || 0);
  const reach = Number(insights.reach || 0);
  const clicks = Number(insights.clicks || 0);
  const linkClicks = Number(insights.inline_link_clicks || 0);
  const frequency = Number(insights.frequency || 0) || (reach > 0 ? impressions / reach : 0);
  return {
    spend,
    impressions,
    reach,
    frequency,
    clicks,
    linkClicks,
    ctr: Number(insights.ctr || 0) / 100, // Meta retorna em %, normalizamos pra decimal
    cpc: Number(insights.cpc || 0),
    cpm: Number(insights.cpm || 0),
    results: getResults(insights),
    costPerResult: getCostPerResult(insights),
    leads: getLeads(insights),
    costPerLead: getCostPerLead(insights),
    purchases: getPurchases(insights),
    costPerPurchase: getCostPerPurchase(insights),
    purchaseValue: getPurchaseValue(insights),
    purchaseRoas: getPurchaseRoas(insights),
    ticketMedio: getTicketMedio(insights),
    conversations: getConversations(insights),
    costPerConversation: getCostPerConversation(insights),
    landingPageViews: getLandingPageViews(insights),
    costPerLandingPageView: getCostPerLandingPageView(insights),
    video3SecWatched: getVideo3SecWatched(insights),
    hookRate: getHookRate(insights),
    costPer3SecView: getCostPer3SecView(insights),
    videoP25Watched: getVideoP25Watched(insights),
    videoP50Watched: getVideoP50Watched(insights),
    videoP75Watched: getVideoP75Watched(insights),
    videoP95Watched: getVideoP95Watched(insights),
    videoP100Watched: getVideoP100Watched(insights),
    holdRate: getHoldRate(insights),
    thruPlayWatched: getThruPlayWatched(insights),
    thruPlayRate: getThruPlayRate(insights),
    costPerThruPlay: getCostPerThruPlay(insights),
    videoAvgTimeWatched: getVideoAvgTimeWatched(insights),
    videoCompletionRate: getVideoCompletionRate(insights),
  };
}

const EMPTY_SUMMARY: MetaFullSummary = {
  spend: 0, impressions: 0, reach: 0, frequency: 0, clicks: 0, linkClicks: 0,
  ctr: 0, cpc: 0, cpm: 0,
  results: 0, costPerResult: 0, leads: 0, costPerLead: 0,
  purchases: 0, costPerPurchase: 0, purchaseValue: 0, purchaseRoas: 0,
  ticketMedio: 0, conversations: 0, costPerConversation: 0,
  landingPageViews: 0, costPerLandingPageView: 0,
  video3SecWatched: 0, hookRate: 0, costPer3SecView: 0,
  videoP25Watched: 0, videoP50Watched: 0, videoP75Watched: 0,
  videoP95Watched: 0, videoP100Watched: 0,
  holdRate: 0, thruPlayWatched: 0, thruPlayRate: 0, costPerThruPlay: 0,
  videoAvgTimeWatched: 0, videoCompletionRate: 0,
};

/**
 * Agrega DOIS summaries (usado quando temos múltiplas contas Meta na mesma
 * frente). Soma os campos cumulativos, recalcula os derivados.
 */
export function aggregateMetaSummaries(summaries: MetaFullSummary[]): MetaFullSummary {
  if (summaries.length === 0) return EMPTY_SUMMARY;
  if (summaries.length === 1) return summaries[0];

  const sum = (k: keyof MetaFullSummary) => summaries.reduce((acc, s) => acc + (s[k] as number), 0);
  const spend = sum("spend");
  const impressions = sum("impressions");
  const reach = sum("reach");
  const clicks = sum("clicks");
  const linkClicks = sum("linkClicks");
  const results = sum("results");
  const leads = sum("leads");
  const purchases = sum("purchases");
  const purchaseValue = sum("purchaseValue");
  const conversations = sum("conversations");
  const landingPageViews = sum("landingPageViews");
  const video3SecWatched = sum("video3SecWatched");
  const videoP25Watched = sum("videoP25Watched");
  const videoP50Watched = sum("videoP50Watched");
  const videoP75Watched = sum("videoP75Watched");
  const videoP95Watched = sum("videoP95Watched");
  const videoP100Watched = sum("videoP100Watched");
  const thruPlayWatched = sum("thruPlayWatched");

  return {
    spend, impressions, reach, clicks, linkClicks,
    frequency: reach > 0 ? impressions / reach : 0,
    ctr: impressions > 0 ? clicks / impressions : 0,
    cpc: clicks > 0 ? spend / clicks : 0,
    cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
    results,
    costPerResult: results > 0 ? spend / results : 0,
    leads,
    costPerLead: leads > 0 ? spend / leads : 0,
    purchases,
    costPerPurchase: purchases > 0 ? spend / purchases : 0,
    purchaseValue,
    purchaseRoas: spend > 0 ? purchaseValue / spend : 0,
    ticketMedio: purchases > 0 ? purchaseValue / purchases : 0,
    conversations,
    costPerConversation: conversations > 0 ? spend / conversations : 0,
    landingPageViews,
    costPerLandingPageView: landingPageViews > 0 ? spend / landingPageViews : 0,
    video3SecWatched,
    hookRate: impressions > 0 ? video3SecWatched / impressions : 0,
    costPer3SecView: video3SecWatched > 0 ? spend / video3SecWatched : 0,
    videoP25Watched, videoP50Watched, videoP75Watched, videoP95Watched, videoP100Watched,
    holdRate: video3SecWatched > 0 ? videoP25Watched / video3SecWatched : 0,
    thruPlayWatched,
    thruPlayRate: impressions > 0 ? thruPlayWatched / impressions : 0,
    costPerThruPlay: thruPlayWatched > 0 ? spend / thruPlayWatched : 0,
    // Tempo médio: ponderar por impressões
    videoAvgTimeWatched:
      impressions > 0
        ? summaries.reduce((acc, s) => acc + s.videoAvgTimeWatched * s.impressions, 0) /
          impressions
        : 0,
    videoCompletionRate: video3SecWatched > 0 ? videoP100Watched / video3SecWatched : 0,
  };
}
