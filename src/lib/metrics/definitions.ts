// Biblioteca centralizada de métricas de mídia paga.
//
// Toda métrica usada no dashboard, configurador "Organizar", relatório semanal
// e PDF export vive aqui. Single source of truth pra:
//   - Label PT-BR
//   - Descrição (tooltip "i")
//   - Fórmula (transparência)
//   - Formato (currency / number / percent / decimal / duration)
//   - Plataforma (google / meta / ambas)
//   - Categoria (custo, performance, vídeo, alcance, conversão...)
//   - Benchmark (good / warn thresholds com semáforo)
//   - Mapeamento pra campos da API (GAQL pro Google, Insights pro Meta)
//
// Para adicionar métrica nova: adicione um entry em METRIC_DEFINITIONS abaixo.

export type MetricFormat =
  | "currency"   // R$ 1.234,56
  | "number"     // 1.234
  | "percent"    // 12,34%
  | "decimal"    // 2,1×
  | "compact"    // 1,2K, 1,2M
  | "duration";  // 12s, 1m30s

export type MetricPlatform = "google" | "meta" | "both";

export type MetricCategory =
  | "cost"          // Investimento, CPC, CPM, CPV
  | "performance"   // CTR, ROAS, taxa de conversão
  | "video"         // Hook Rate, Hold Rate, ThruPlay, quartis
  | "reach"         // Impressões, Alcance, Frequência
  | "engagement"    // Engajamento, Conversas, Cliques no link
  | "conversion"    // Resultados, Leads, Compras, Vendas
  | "quality"       // Quality Score, Share Impressão
  | "financial";    // Receita, Ticket Médio

export type Benchmark = {
  good: number;       // valor ≥ good (ou ≤ se higherBetter=false) → tom "good"
  warn: number;       // valor entre warn e good → tom "warn", abaixo de warn → "danger"
};

/**
 * Mapeamento dos campos das APIs de cada plataforma.
 *
 * - Google: nome do campo GAQL em snake_case (`metrics.average_cpc`)
 * - Meta: nome do field/action_type/conversion na resposta de /insights
 *
 * Métricas computadas (Hook Rate, Hold Rate, ROAS quando não vem direto)
 * são marcadas com `computed: true` e não têm `apiField` direto — o
 * resolver (lib/metrics/resolvers.ts) calcula a partir de outras métricas.
 */
export type ApiMapping = {
  google?: string;            // ex: "metrics.cost_micros"
  meta?: string;              // ex: "spend" ou "actions.lead"
  metaActionType?: string;    // pra métricas que vivem em actions[]
  computed?: boolean;         // calculada a partir de outras
};

export type MetricDefinition = {
  id: string;                // identificador único: "hook_rate", "spend", etc
  label: string;             // PT-BR pra UI: "Taxa de Parada no Gancho"
  shortLabel?: string;       // pra espaços apertados (tabelas, sparkline labels)
  abbreviation?: string;     // sigla: "CTR", "ROAS", "CPR"
  description: string;       // tooltip "i" — explica em 1-2 frases
  formula?: string;          // fórmula em humano: "Cliques ÷ Impressões × 100"
  platforms: MetricPlatform[]; // ["meta"] ou ["both"]
  category: MetricCategory;
  format: MetricFormat;
  decimals?: number;         // override do default por formato
  suffix?: string;           // ex: "×" pra ROAS
  higherBetter?: boolean;    // default true; CPC/CPM/Frequência = false
  benchmark?: Benchmark;     // com base na regra higherBetter
  api: ApiMapping;
  isPrimary?: boolean;       // entra no preset default
  isAdvanced?: boolean;      // só visão sênior
};

// ─── Definições ──────────────────────────────────────────────────

export const METRIC_DEFINITIONS: Record<string, MetricDefinition> = {
  // ═══ COMUNS (Google + Meta) ═══

  spend: {
    id: "spend",
    label: "Investimento",
    shortLabel: "Gasto",
    description: "Total investido nas campanhas no período. Valor após descontos da plataforma.",
    platforms: ["both"],
    category: "cost",
    format: "currency",
    higherBetter: false, // mais investimento ≠ melhor; só significa mais escala
    api: { google: "metrics.cost_micros", meta: "spend" },
    isPrimary: true,
  },

  impressions: {
    id: "impressions",
    label: "Impressões",
    description: "Quantas vezes seus anúncios apareceram. Inclui mesma pessoa vendo várias vezes.",
    platforms: ["both"],
    category: "reach",
    format: "compact",
    api: { google: "metrics.impressions", meta: "impressions" },
    isPrimary: true,
  },

  clicks: {
    id: "clicks",
    label: "Cliques",
    description: "Cliques nos anúncios (qualquer tipo). Pra Meta, conta todos os tipos de clique.",
    platforms: ["both"],
    category: "engagement",
    format: "number",
    api: { google: "metrics.clicks", meta: "clicks" },
    isPrimary: true,
  },

  ctr: {
    id: "ctr",
    abbreviation: "CTR",
    label: "Taxa de Cliques",
    shortLabel: "CTR",
    description: "Quantos cliques aconteceram a cada 100 impressões. Mede atratividade do anúncio.",
    formula: "Cliques ÷ Impressões × 100",
    platforms: ["both"],
    category: "performance",
    format: "percent",
    decimals: 2,
    benchmark: { good: 0.03, warn: 0.01 }, // 3% e 1%
    api: { google: "metrics.ctr", meta: "ctr" },
    isPrimary: true,
  },

  cpc: {
    id: "cpc",
    abbreviation: "CPC",
    label: "Custo por Clique",
    shortLabel: "CPC",
    description: "Quanto você paga em média por cada clique. Quanto menor, melhor.",
    formula: "Investimento ÷ Cliques",
    platforms: ["both"],
    category: "cost",
    format: "currency",
    higherBetter: false,
    api: { google: "metrics.average_cpc", meta: "cpc" },
    isPrimary: true,
  },

  cpm: {
    id: "cpm",
    abbreviation: "CPM",
    label: "Custo por Mil Impressões",
    shortLabel: "CPM",
    description: "Custo de cada 1.000 impressões. Indicador da inflação do leilão da plataforma.",
    formula: "Investimento ÷ Impressões × 1.000",
    platforms: ["both"],
    category: "cost",
    format: "currency",
    higherBetter: false,
    api: { google: "metrics.average_cpm", meta: "cpm" },
  },

  reach: {
    id: "reach",
    label: "Alcance",
    description: "Pessoas únicas que viram os anúncios. Diferente de impressões (que conta repetições).",
    platforms: ["both"],
    category: "reach",
    format: "compact",
    api: { google: "metrics.average_target_impression_share", meta: "reach" }, // Google não expõe reach diretamente
  },

  frequency: {
    id: "frequency",
    label: "Frequência",
    description: "Em média, quantas vezes cada pessoa viu seus anúncios. >3× tende a cansar; >5× é crítico.",
    formula: "Impressões ÷ Alcance",
    platforms: ["meta"], // Google Ads não expõe diretamente, só Performance Planner
    category: "reach",
    format: "decimal",
    decimals: 1,
    suffix: "×",
    higherBetter: false,
    benchmark: { good: 3, warn: 5 }, // ≤3 ok, 3-5 atenção, >5 crítico
    api: { meta: "frequency" },
    isPrimary: true,
  },

  // ═══ GOOGLE — Conversão e financeiro ═══

  conversions: {
    id: "conversions",
    label: "Conversões",
    description: "Eventos de conversão registrados (compras, leads, etc) conforme configurado no Google Ads.",
    platforms: ["google"],
    category: "conversion",
    format: "number",
    decimals: 0,
    api: { google: "metrics.conversions" },
    isPrimary: true,
  },

  revenue: {
    id: "revenue",
    label: "Receita",
    description: "Valor total das conversões registradas. Vem do conversion tracking com value.",
    platforms: ["google"],
    category: "financial",
    format: "currency",
    api: { google: "metrics.conversions_value" },
    isPrimary: true,
  },

  roas: {
    id: "roas",
    abbreviation: "ROAS",
    label: "ROAS",
    shortLabel: "ROAS",
    description: "Retorno sobre investimento em anúncios. ROAS 3× significa R$ 3 de receita pra cada R$ 1 gasto.",
    formula: "Receita ÷ Investimento",
    platforms: ["google"],
    category: "performance",
    format: "decimal",
    decimals: 2,
    suffix: "×",
    benchmark: { good: 2, warn: 1 }, // <1 perde dinheiro, 1-2 borderline, >2 lucrativo
    api: { google: "metrics.value_per_conversion", computed: true }, // computado por engagement
    isPrimary: true,
  },

  cost_per_conversion: {
    id: "cost_per_conversion",
    abbreviation: "CPA",
    label: "Custo por Conversão",
    shortLabel: "CPA",
    description: "Custo médio por conversão registrada. Quanto menor, mais eficiente a campanha.",
    formula: "Investimento ÷ Conversões",
    platforms: ["google"],
    category: "cost",
    format: "currency",
    higherBetter: false,
    api: { google: "metrics.cost_per_conversion" },
    isPrimary: true,
  },

  search_impression_share: {
    id: "search_impression_share",
    label: "Share de Impressão",
    shortLabel: "IS",
    description: "% das buscas elegíveis em que seu anúncio apareceu. Indica oportunidade perdida quando baixo.",
    platforms: ["google"],
    category: "quality",
    format: "percent",
    decimals: 1,
    benchmark: { good: 0.6, warn: 0.3 },
    api: { google: "metrics.search_impression_share" },
    isAdvanced: true,
  },

  search_top_impression_share: {
    id: "search_top_impression_share",
    label: "Share Topo",
    description: "% das vezes em que seu anúncio apareceu acima dos resultados orgânicos (topo da página).",
    platforms: ["google"],
    category: "quality",
    format: "percent",
    decimals: 1,
    benchmark: { good: 0.5, warn: 0.2 },
    api: { google: "metrics.search_top_impression_share" },
    isAdvanced: true,
  },

  quality_score: {
    id: "quality_score",
    label: "Quality Score",
    description: "Nota de qualidade Google (1-10) que mistura relevância, CTR esperado e experiência da página.",
    platforms: ["google"],
    category: "quality",
    format: "number",
    benchmark: { good: 7, warn: 4 }, // ≥7 bom, 4-6 ok, <4 ruim
    api: { google: "ad_group_criterion.quality_info.quality_score" },
    isAdvanced: true,
  },

  // ═══ GOOGLE — Vídeo (YouTube) ═══

  video_views: {
    id: "video_views",
    label: "Visualizações de Vídeo",
    shortLabel: "Views",
    description: "Total de visualizações qualificadas dos anúncios de vídeo (30s ou completo).",
    platforms: ["google"],
    category: "video",
    format: "number",
    api: { google: "metrics.video_views" },
  },

  video_view_rate: {
    id: "video_view_rate",
    label: "Taxa de Visualização",
    description: "% das pessoas que viram seu anúncio até ser contabilizado como view qualificado.",
    formula: "Views ÷ Impressões",
    platforms: ["google"],
    category: "video",
    format: "percent",
    decimals: 2,
    benchmark: { good: 0.25, warn: 0.10 },
    api: { google: "metrics.video_view_rate" },
  },

  cost_per_video_view: {
    id: "cost_per_video_view",
    abbreviation: "CPV",
    label: "Custo por Visualização",
    shortLabel: "CPV",
    description: "Custo médio por visualização qualificada de vídeo.",
    formula: "Investimento ÷ Views",
    platforms: ["google"],
    category: "cost",
    format: "currency",
    higherBetter: false,
    api: { google: "metrics.average_cpv" },
  },

  video_quartile_p25_rate: {
    id: "video_quartile_p25_rate",
    label: "Visualização 25%",
    description: "% das pessoas que assistiram ao menos 25% do vídeo. Indica retenção inicial.",
    platforms: ["google"],
    category: "video",
    format: "percent",
    decimals: 1,
    benchmark: { good: 0.40, warn: 0.20 },
    api: { google: "metrics.video_quartile_p25_rate" },
  },

  video_quartile_p50_rate: {
    id: "video_quartile_p50_rate",
    label: "Visualização 50%",
    description: "% que assistiu até a metade do vídeo.",
    platforms: ["google"],
    category: "video",
    format: "percent",
    decimals: 1,
    benchmark: { good: 0.25, warn: 0.10 },
    api: { google: "metrics.video_quartile_p50_rate" },
  },

  video_quartile_p75_rate: {
    id: "video_quartile_p75_rate",
    label: "Visualização 75%",
    description: "% que assistiu até 75% do vídeo. Audiência engajada.",
    platforms: ["google"],
    category: "video",
    format: "percent",
    decimals: 1,
    api: { google: "metrics.video_quartile_p75_rate" },
  },

  video_quartile_p100_rate: {
    id: "video_quartile_p100_rate",
    label: "Taxa de Conclusão",
    description: "% que assistiu o vídeo até o fim. Indicador máximo de qualidade do criativo.",
    platforms: ["google"],
    category: "video",
    format: "percent",
    decimals: 1,
    benchmark: { good: 0.15, warn: 0.05 },
    api: { google: "metrics.video_quartile_p100_rate" },
  },

  view_through_conversions: {
    id: "view_through_conversions",
    label: "Conv. por View-Through",
    description: "Conversões de quem viu o vídeo (sem clicar) e converteu depois. Mostra impacto branding.",
    platforms: ["google"],
    category: "conversion",
    format: "number",
    api: { google: "metrics.view_through_conversions" },
    isAdvanced: true,
  },

  engagements: {
    id: "engagements",
    label: "Engajamentos",
    description: "Interações com o anúncio (curtir, comentar, compartilhar, expansão). Display + YouTube.",
    platforms: ["google"],
    category: "engagement",
    format: "number",
    api: { google: "metrics.engagements" },
  },

  engagement_rate: {
    id: "engagement_rate",
    label: "Taxa de Engajamento",
    description: "% de pessoas que engajaram com o anúncio.",
    formula: "Engajamentos ÷ Impressões",
    platforms: ["google"],
    category: "performance",
    format: "percent",
    decimals: 2,
    api: { google: "metrics.engagement_rate" },
  },

  // ═══ META — Conversão e financeiro ═══

  results: {
    id: "results",
    label: "Resultados",
    description: "Resultado configurado no objetivo da campanha (conversões, leads, mensagens, etc).",
    platforms: ["meta"],
    category: "conversion",
    format: "number",
    api: { meta: "actions", metaActionType: "lead+purchase+onsite_conversion" }, // resolver decide
    isPrimary: true,
  },

  cost_per_result: {
    id: "cost_per_result",
    abbreviation: "CPR",
    label: "Custo por Resultado",
    shortLabel: "CPR",
    description: "Custo médio por resultado do objetivo da campanha. Quanto menor, mais eficiente.",
    formula: "Investimento ÷ Resultados",
    platforms: ["meta"],
    category: "cost",
    format: "currency",
    higherBetter: false,
    api: { computed: true },
    isPrimary: true,
  },

  link_clicks: {
    id: "link_clicks",
    label: "Cliques no Link",
    description: "Cliques que levaram o usuário ao seu site. Subset dos cliques totais.",
    platforms: ["meta"],
    category: "engagement",
    format: "number",
    api: { meta: "inline_link_clicks" },
  },

  landing_page_views: {
    id: "landing_page_views",
    label: "Visualizações do Site",
    description: "Pessoas que clicaram E carregaram seu site. Mede qualidade do tráfego (não bounce).",
    platforms: ["meta"],
    category: "engagement",
    format: "number",
    api: { meta: "actions", metaActionType: "landing_page_view" },
  },

  cost_per_landing_page_view: {
    id: "cost_per_landing_page_view",
    label: "Custo por Visita ao Site",
    description: "Custo médio por visita efetiva ao site (não só clique).",
    platforms: ["meta"],
    category: "cost",
    format: "currency",
    higherBetter: false,
    api: { computed: true },
  },

  actions_leads: {
    id: "actions_leads",
    label: "Leads",
    description: "Leads gerados via formulário Meta ou pixel (lead event).",
    platforms: ["meta"],
    category: "conversion",
    format: "number",
    api: { meta: "actions", metaActionType: "lead" },
  },

  cost_per_lead: {
    id: "cost_per_lead",
    abbreviation: "CPL",
    label: "Custo por Lead",
    shortLabel: "CPL",
    description: "Custo médio para gerar um lead.",
    platforms: ["meta"],
    category: "cost",
    format: "currency",
    higherBetter: false,
    api: { meta: "cost_per_action_type", metaActionType: "lead" },
  },

  actions_purchases: {
    id: "actions_purchases",
    label: "Compras",
    description: "Compras registradas pelo pixel ou conversion API.",
    platforms: ["meta"],
    category: "conversion",
    format: "number",
    api: { meta: "actions", metaActionType: "purchase" },
  },

  cost_per_purchase: {
    id: "cost_per_purchase",
    label: "Custo por Compra",
    description: "Custo médio para uma compra.",
    platforms: ["meta"],
    category: "cost",
    format: "currency",
    higherBetter: false,
    api: { meta: "cost_per_action_type", metaActionType: "purchase" },
  },

  purchase_value: {
    id: "purchase_value",
    label: "Vendas",
    shortLabel: "Vendas",
    description: "Valor total das compras atribuídas às campanhas.",
    platforms: ["meta"],
    category: "financial",
    format: "currency",
    api: { meta: "action_values", metaActionType: "purchase" },
  },

  purchase_roas: {
    id: "purchase_roas",
    label: "ROAS",
    description: "Retorno sobre investimento em compras. ROAS 3× = R$ 3 de venda pra cada R$ 1 gasto.",
    formula: "Vendas ÷ Investimento",
    platforms: ["meta"],
    category: "performance",
    format: "decimal",
    decimals: 2,
    suffix: "×",
    benchmark: { good: 2, warn: 1 },
    api: { meta: "purchase_roas" },
  },

  actions_conversations: {
    id: "actions_conversations",
    label: "Conversas",
    description: "Conversas iniciadas no WhatsApp/Messenger a partir do anúncio.",
    platforms: ["meta"],
    category: "conversion",
    format: "number",
    api: { meta: "actions", metaActionType: "onsite_conversion.messaging_conversation_started_7d" },
  },

  cost_per_conversation: {
    id: "cost_per_conversation",
    label: "Custo por Conversa",
    description: "Custo médio para iniciar uma conversa no WhatsApp/Messenger.",
    platforms: ["meta"],
    category: "cost",
    format: "currency",
    higherBetter: false,
    api: { meta: "cost_per_action_type", metaActionType: "onsite_conversion.messaging_conversation_started_7d" },
  },

  ticket_medio: {
    id: "ticket_medio",
    label: "Ticket Médio",
    description: "Valor médio de cada compra. Útil pra decidir se vale a pena ajustar mix de produtos.",
    formula: "Vendas ÷ Compras",
    platforms: ["meta"],
    category: "financial",
    format: "currency",
    api: { computed: true },
  },

  // ═══ META — Vídeo (Hook Rate, Hold Rate, ThruPlay, quartis) ═══

  video_3_sec_watched: {
    id: "video_3_sec_watched",
    label: "Visualizações 3 Seg.",
    description: "Quantas pessoas pararam o scroll e viram pelo menos 3 segundos do vídeo.",
    platforms: ["meta"],
    category: "video",
    format: "number",
    api: { meta: "actions", metaActionType: "video_view" }, // 3sec é o default video_view do Meta
  },

  hook_rate: {
    id: "hook_rate",
    label: "Taxa de Parada no Gancho",
    shortLabel: "Hook Rate",
    description: "% das pessoas que pararam o scroll nos primeiros 3 segundos. Indica força do gancho do criativo.",
    formula: "Visualizações 3 Seg. ÷ Impressões",
    platforms: ["meta"],
    category: "video",
    format: "percent",
    decimals: 2,
    benchmark: { good: 0.30, warn: 0.20 }, // ≥30% ótimo Reels, <20% morto
    api: { computed: true },
  },

  cost_per_3_sec_view: {
    id: "cost_per_3_sec_view",
    label: "Custo por Hook",
    shortLabel: "CP-Hook",
    description: "Quanto custa cada 'parada no scroll'. Compara força relativa de criativos.",
    formula: "Investimento ÷ Visualizações 3 Seg.",
    platforms: ["meta"],
    category: "cost",
    format: "currency",
    higherBetter: false,
    api: { meta: "cost_per_action_type", metaActionType: "video_view" },
  },

  video_p25_watched: {
    id: "video_p25_watched",
    label: "Visualizações 25%",
    description: "Pessoas que assistiram ao menos 25% do vídeo.",
    platforms: ["meta"],
    category: "video",
    format: "number",
    api: { meta: "video_p25_watched_actions" },
  },

  video_p50_watched: {
    id: "video_p50_watched",
    label: "Visualizações 50%",
    description: "Pessoas que assistiram ao menos metade do vídeo.",
    platforms: ["meta"],
    category: "video",
    format: "number",
    api: { meta: "video_p50_watched_actions" },
  },

  video_p75_watched: {
    id: "video_p75_watched",
    label: "Visualizações 75%",
    description: "Pessoas que assistiram ao menos 75% do vídeo. Audiência engajada.",
    platforms: ["meta"],
    category: "video",
    format: "number",
    api: { meta: "video_p75_watched_actions" },
  },

  video_p95_watched: {
    id: "video_p95_watched",
    label: "Visualizações 95%",
    description: "Quase completaram o vídeo (95%+).",
    platforms: ["meta"],
    category: "video",
    format: "number",
    api: { meta: "video_p95_watched_actions" },
  },

  video_p100_watched: {
    id: "video_p100_watched",
    label: "Visualizações Completas",
    description: "Pessoas que viram o vídeo do início ao fim.",
    platforms: ["meta"],
    category: "video",
    format: "number",
    api: { meta: "video_p100_watched_actions" },
  },

  hold_rate: {
    id: "hold_rate",
    label: "Taxa de Retenção",
    shortLabel: "Hold Rate",
    description: "% das pessoas que viram 3s e continuaram até 25%. Mede qualidade do conteúdo depois do gancho.",
    formula: "Visualizações 25% ÷ Visualizações 3 Seg.",
    platforms: ["meta"],
    category: "video",
    format: "percent",
    decimals: 2,
    benchmark: { good: 0.60, warn: 0.40 },
    api: { computed: true },
  },

  video_thruplay_watched: {
    id: "video_thruplay_watched",
    label: "ThruPlays",
    description: "Visualizações qualificadas pela Meta: 15s+ ou completo (o que vier primeiro).",
    platforms: ["meta"],
    category: "video",
    format: "number",
    api: { meta: "video_thruplay_watched_actions" },
  },

  thruplay_rate: {
    id: "thruplay_rate",
    label: "Taxa de ThruPlay",
    description: "% das impressões que viraram ThruPlay (view qualificada Meta).",
    formula: "ThruPlays ÷ Impressões",
    platforms: ["meta"],
    category: "video",
    format: "percent",
    decimals: 2,
    benchmark: { good: 0.15, warn: 0.05 },
    api: { computed: true },
  },

  cost_per_thruplay: {
    id: "cost_per_thruplay",
    label: "Custo por ThruPlay",
    shortLabel: "CP-TP",
    description: "Custo por visualização qualificada (ThruPlay).",
    platforms: ["meta"],
    category: "cost",
    format: "currency",
    higherBetter: false,
    api: { meta: "cost_per_thruplay" },
  },

  video_avg_time_watched: {
    id: "video_avg_time_watched",
    label: "Tempo Médio Assistido",
    description: "Quantos segundos em média cada impressão assistiu do vídeo.",
    platforms: ["meta"],
    category: "video",
    format: "duration",
    api: { meta: "video_avg_time_watched_actions" },
  },

  video_completion_rate: {
    id: "video_completion_rate",
    label: "Taxa de Conclusão",
    description: "% das pessoas que deram play e ficaram até o fim do vídeo.",
    formula: "Visualizações Completas ÷ Visualizações 3 Seg.",
    platforms: ["meta"],
    category: "video",
    format: "percent",
    decimals: 1,
    benchmark: { good: 0.20, warn: 0.05 },
    api: { computed: true },
  },
};

// ─── Helpers de filtragem ────────────────────────────────────────

export function getMetric(id: string): MetricDefinition | undefined {
  return METRIC_DEFINITIONS[id];
}

export function listMetrics(opts?: {
  platform?: "google" | "meta";
  category?: MetricCategory;
  onlyPrimary?: boolean;
  excludeAdvanced?: boolean;
}): MetricDefinition[] {
  return Object.values(METRIC_DEFINITIONS).filter((m) => {
    if (opts?.platform) {
      if (!m.platforms.includes(opts.platform) && !m.platforms.includes("both")) return false;
    }
    if (opts?.category && m.category !== opts.category) return false;
    if (opts?.onlyPrimary && !m.isPrimary) return false;
    if (opts?.excludeAdvanced && m.isAdvanced) return false;
    return true;
  });
}

// ─── Presets de KPI ──────────────────────────────────────────────
// Conjuntos default pra mostrar no dashboard. O usuário poderá customizar
// via "Organizar" e persistir em UserDashboardPreferences.

export const PRIMARY_KPIS_GOOGLE = [
  "spend",
  "revenue",
  "roas",
  "cost_per_conversion",
  "conversions",
  "clicks",
  "ctr",
  "impressions",
];

export const PRIMARY_KPIS_META = [
  "spend",
  "results",
  "cost_per_result",
  "purchase_roas",
  "reach",
  "frequency",
  "ctr",
  "link_clicks",
];

export const VIDEO_KPIS_META = [
  "hook_rate",
  "hold_rate",
  "thruplay_rate",
  "video_avg_time_watched",
  "cost_per_3_sec_view",
  "cost_per_thruplay",
];

export const VIDEO_KPIS_GOOGLE = [
  "video_views",
  "video_view_rate",
  "cost_per_video_view",
  "video_quartile_p25_rate",
  "video_quartile_p100_rate",
  "view_through_conversions",
];

// Curva de retenção Meta (pra plotar o funil de queda 100→4%)
export const RETENTION_CURVE_META = [
  { id: "video_3_sec_watched", label: "3 seg." },
  { id: "video_p25_watched", label: "25%" },
  { id: "video_p50_watched", label: "50%" },
  { id: "video_p75_watched", label: "75%" },
  { id: "video_p95_watched", label: "95%" },
  { id: "video_p100_watched", label: "100%" },
];

export const RETENTION_CURVE_GOOGLE = [
  { id: "video_quartile_p25_rate", label: "25%" },
  { id: "video_quartile_p50_rate", label: "50%" },
  { id: "video_quartile_p75_rate", label: "75%" },
  { id: "video_quartile_p100_rate", label: "100%" },
];
