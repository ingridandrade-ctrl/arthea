// Mapa de objetivos Meta e suas métricas relevantes.
//
// Cada campanha Meta tem 1 objetivo (OUTCOME_TRAFFIC, OUTCOME_SALES, etc).
// Esse mapa diz, pra cada objetivo:
//   - Label e descrição em PT-BR
//   - Grupo canônico (vários objetivos legacy + outcome viram um só)
//   - Métricas relevantes pra mostrar no dashboard (não força ROAS num
//     bloco de Engajamento, por exemplo)
//   - Métrica-chave pra ranking de criativos (ad mais bem-sucedido)
//   - Benchmarks contextuais

export type ObjectiveGroup =
  | "awareness"     // Reconhecimento (reach, freq, CPM)
  | "traffic"       // Tráfego (link clicks, LPV, CPC link)
  | "engagement"    // Engajamento (reactions, comments, shares, video views)
  | "video"         // Visualizações de vídeo (Hook, Hold, ThruPlay)
  | "leads"         // Leads (form, custo por lead)
  | "messages"      // Mensagens (conversas WhatsApp/Messenger)
  | "app"           // App installs
  | "sales";        // Vendas (ROAS, compras, receita)

export type ObjectiveDefinition = {
  group: ObjectiveGroup;
  label: string;
  description: string;
  emoji: string;
  // IDs das métricas que aparecem como tiles no bloco do objetivo.
  // Cada uma é um campo de MetaFullSummary OU custom string que o renderer entende.
  primaryMetrics: string[];
  secondaryMetrics: string[];
  // Métrica usada pra rankear criativos / campanhas dentro do bloco
  rankBy: keyof MetaSummaryShape;
  // Métrica usada como "headline" no bloco (vai aparecer maior)
  headlineMetric: keyof MetaSummaryShape;
  headlineLabel: string;
};

// Subset de MetaFullSummary que usamos no ranking
type MetaSummaryShape = {
  profileVisits: number;
  costPerProfileVisit: number;
  follows: number;
  costPerFollow: number;
  spend: number;
  impressions: number;
  reach: number;
  frequency: number;
  clicks: number;
  linkClicks: number;
  ctr: number;
  linkCtr: number;
  cpc: number;
  linkCpc: number;
  cpm: number;
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
  viewContent: number;
  addToCart: number;
  initiateCheckout: number;
  hookRate: number;
  holdRate: number;
  thruPlayRate: number;
  costPer3SecView: number;
  costPerThruPlay: number;
  videoAvgTimeWatched: number;
  video3SecWatched: number;
  videoP100Watched: number;
  pageEngagement: number;
};

export const OBJECTIVE_DEFINITIONS: Record<ObjectiveGroup, ObjectiveDefinition> = {
  awareness: {
    group: "awareness",
    label: "Reconhecimento",
    description: "Você quer ser visto pelo público certo",
    emoji: "👁️",
    primaryMetrics: ["reach", "impressions", "frequency", "cpm"],
    secondaryMetrics: ["ctr", "clicks"],
    rankBy: "reach",
    headlineMetric: "reach",
    headlineLabel: "Alcance",
  },
  traffic: {
    group: "traffic",
    label: "Tráfego",
    description: "Você quer levar gente pro site, WhatsApp ou perfil",
    emoji: "🎯",
    primaryMetrics: ["linkClicks", "linkCtr", "linkCpc", "landingPageViews", "profileVisits"],
    secondaryMetrics: ["clicks", "ctr", "cpc", "impressions", "costPerProfileVisit"],
    rankBy: "linkClicks",
    headlineMetric: "linkClicks",
    headlineLabel: "Cliques no link",
  },
  engagement: {
    group: "engagement",
    label: "Engajamento",
    description: "Você quer curtidas, seguidores, comentários e compartilhamentos",
    emoji: "💬",
    primaryMetrics: ["pageEngagement", "follows", "profileVisits", "reach"],
    secondaryMetrics: ["impressions", "frequency", "costPerFollow", "ctr"],
    rankBy: "pageEngagement",
    headlineMetric: "pageEngagement",
    headlineLabel: "Engajamento da página",
  },
  video: {
    group: "video",
    label: "Vídeo",
    description: "Você quer views e atenção dos seus vídeos",
    emoji: "🎬",
    primaryMetrics: ["video3SecWatched", "hookRate", "holdRate", "thruPlayRate"],
    secondaryMetrics: ["costPer3SecView", "costPerThruPlay", "videoAvgTimeWatched"],
    rankBy: "video3SecWatched",
    headlineMetric: "video3SecWatched",
    headlineLabel: "Visualizações 3s",
  },
  leads: {
    group: "leads",
    label: "Leads",
    description: "Você quer dados de quem tem interesse",
    emoji: "📝",
    primaryMetrics: ["leads", "costPerLead", "linkClicks", "landingPageViews"],
    secondaryMetrics: ["linkCtr", "linkCpc"],
    rankBy: "leads",
    headlineMetric: "leads",
    headlineLabel: "Leads",
  },
  messages: {
    group: "messages",
    label: "Conversas",
    description: "Você quer pessoas falando no WhatsApp/Messenger",
    emoji: "💬",
    primaryMetrics: ["conversations", "costPerConversation", "linkClicks", "linkCpc"],
    secondaryMetrics: ["impressions", "ctr", "reach"],
    rankBy: "conversations",
    headlineMetric: "conversations",
    headlineLabel: "Conversas iniciadas",
  },
  app: {
    group: "app",
    label: "App",
    description: "Você quer instalações ou eventos no app",
    emoji: "📱",
    primaryMetrics: ["results", "costPerResult", "linkClicks", "linkCpc"],
    secondaryMetrics: ["impressions", "ctr"],
    rankBy: "results",
    headlineMetric: "results",
    headlineLabel: "Eventos",
  },
  sales: {
    group: "sales",
    label: "Vendas",
    description: "Você quer compras e receita",
    emoji: "💰",
    primaryMetrics: ["purchaseValue", "purchaseRoas", "purchases", "costPerPurchase"],
    secondaryMetrics: ["ticketMedio", "addToCart", "initiateCheckout"],
    rankBy: "purchaseValue",
    headlineMetric: "purchaseRoas",
    headlineLabel: "ROAS",
  },
};

/**
 * Traduz o valor de `objective` retornado pelo Meta API pra um grupo canônico.
 *
 * Meta tem ~20 valores históricos (REACH, BRAND_AWARENESS, LINK_CLICKS,
 * POST_ENGAGEMENT, VIDEO_VIEWS, MESSAGES, LEAD_GENERATION, CONVERSIONS,
 * PRODUCT_CATALOG_SALES, etc.) + os novos OUTCOME_* (Outcome Driven
 * Ad Experience, ODAX, lançado em 2022). Todos mapeiam pra um dos
 * grupos canônicos acima.
 */
export function mapObjectiveToGroup(objective: string | null | undefined): ObjectiveGroup {
  if (!objective) return "traffic"; // default safe
  const o = objective.toUpperCase();

  // ODAX / Outcome-based (2022+)
  if (o === "OUTCOME_AWARENESS") return "awareness";
  if (o === "OUTCOME_TRAFFIC") return "traffic";
  if (o === "OUTCOME_ENGAGEMENT") return "engagement";
  if (o === "OUTCOME_LEADS") return "leads";
  if (o === "OUTCOME_APP_PROMOTION") return "app";
  if (o === "OUTCOME_SALES") return "sales";

  // Legacy values
  if (["REACH", "BRAND_AWARENESS"].includes(o)) return "awareness";
  if (["LINK_CLICKS", "WEBSITE_CLICKS", "TRAFFIC"].includes(o)) return "traffic";
  if (["POST_ENGAGEMENT", "PAGE_LIKES", "EVENT_RESPONSES", "ENGAGEMENT"].includes(o)) return "engagement";
  if (o === "VIDEO_VIEWS") return "video";
  if (o === "MESSAGES") return "messages";
  if (["LEAD_GENERATION", "LEAD_GEN"].includes(o)) return "leads";
  if (["APP_INSTALLS", "MOBILE_APP_INSTALLS", "MOBILE_APP_ENGAGEMENT"].includes(o)) return "app";
  if (["CONVERSIONS", "PRODUCT_CATALOG_SALES", "STORE_VISITS", "SALES"].includes(o)) return "sales";

  return "traffic";
}
