// Catálogo de métricas Meta disponíveis pra Camada 3 do dashboard.
//
// Cada entrada:
//   id     — chave estável (usada no JSON de ClientDashboardConfig.customMetrics)
//   label  — nome pro admin
//   desc   — descrição curta (aparece no seletor)
//   group  — categoria pra organização visual
//   unit   — como formatar (currency | number | percent | seconds | ratio)
//   source — de onde extrair (bate 1:1 com um campo do MetaFullSummary)

export type MetricUnit = "currency" | "number" | "percent" | "seconds" | "ratio";

export type MetricGroup =
  | "entrega"
  | "cliques"
  | "conversao"
  | "conversas"
  | "landing"
  | "ecommerce"
  | "servicos"
  | "instagram"
  | "video"
  | "taxas";

export type MetricDef = {
  id: string; // = campo em MetaFullSummary
  label: string;
  desc: string;
  group: MetricGroup;
  unit: MetricUnit;
};

export const METRIC_GROUP_LABEL: Record<MetricGroup, string> = {
  entrega: "Entrega",
  cliques: "Cliques & CTR",
  conversao: "Conversão",
  conversas: "Conversas",
  landing: "Landing page",
  ecommerce: "E-commerce (funil)",
  servicos: "Serviços",
  instagram: "Instagram / perfil",
  video: "Vídeo",
  taxas: "Taxas de conversão",
};

export const META_METRICS: MetricDef[] = [
  // Entrega
  { id: "spend",        label: "Investimento",  desc: "Total gasto no período", group: "entrega", unit: "currency" },
  { id: "impressions",  label: "Impressões",    desc: "Quantas vezes o anúncio apareceu", group: "entrega", unit: "number" },
  { id: "reach",        label: "Alcance",       desc: "Pessoas únicas que viram o anúncio", group: "entrega", unit: "number" },
  { id: "frequency",    label: "Frequência",    desc: "Média de vezes que cada pessoa viu", group: "entrega", unit: "ratio" },

  // Cliques
  { id: "clicks",       label: "Cliques totais",     desc: "Todos os cliques no anúncio", group: "cliques", unit: "number" },
  { id: "linkClicks",   label: "Cliques no link",    desc: "Só cliques que levaram pro site", group: "cliques", unit: "number" },
  { id: "ctr",          label: "CTR",                desc: "% de quem viu que clicou", group: "cliques", unit: "percent" },
  { id: "linkCtr",      label: "CTR do link",        desc: "% que clicou no link específico", group: "cliques", unit: "percent" },
  { id: "cpc",          label: "CPC",                desc: "Custo médio por clique", group: "cliques", unit: "currency" },
  { id: "linkCpc",      label: "CPC do link",        desc: "Custo médio por clique no link", group: "cliques", unit: "currency" },
  { id: "cpm",          label: "CPM",                desc: "Custo por 1.000 impressões", group: "cliques", unit: "currency" },

  // Conversão genérica
  { id: "results",       label: "Resultados",        desc: "Leads + compras (contextual)", group: "conversao", unit: "number" },
  { id: "costPerResult", label: "Custo por resultado", desc: "Investimento / resultados", group: "conversao", unit: "currency" },
  { id: "leads",         label: "Leads",             desc: "Formulários e Lead Ads", group: "conversao", unit: "number" },
  { id: "costPerLead",   label: "CPL",               desc: "Custo por lead", group: "conversao", unit: "currency" },
  { id: "purchases",     label: "Compras",           desc: "Transações confirmadas", group: "conversao", unit: "number" },
  { id: "costPerPurchase", label: "CPA (compra)",    desc: "Custo por compra", group: "conversao", unit: "currency" },
  { id: "purchaseValue", label: "Receita",           desc: "Valor total das compras", group: "conversao", unit: "currency" },
  { id: "purchaseRoas",  label: "ROAS",              desc: "Retorno sobre investimento", group: "conversao", unit: "ratio" },
  { id: "ticketMedio",   label: "Ticket médio",      desc: "Receita / número de compras", group: "conversao", unit: "currency" },

  // Conversas / mensagens
  { id: "conversations",       label: "Conversas iniciadas", desc: "Mensagens WhatsApp/Messenger", group: "conversas", unit: "number" },
  { id: "costPerConversation", label: "Custo por conversa",  desc: "Investimento / conversas",   group: "conversas", unit: "currency" },
  { id: "atendimentos",        label: "Atendimentos",        desc: "Contatos qualificados", group: "conversas", unit: "number" },
  { id: "costPerAtendimento",  label: "Custo por atendimento", desc: "Investimento / atendimento", group: "conversas", unit: "currency" },

  // Landing
  { id: "landingPageViews",       label: "Visualizações da LP", desc: "Quantas vezes a landing carregou", group: "landing", unit: "number" },
  { id: "costPerLandingPageView", label: "Custo por view da LP", desc: "Custo por carregamento",           group: "landing", unit: "currency" },

  // E-commerce (funil)
  { id: "viewContent",            label: "ViewContent",         desc: "Visualização de produto",           group: "ecommerce", unit: "number" },
  { id: "costPerViewContent",     label: "Custo por VC",        desc: "Custo por visualização de produto", group: "ecommerce", unit: "currency" },
  { id: "addToCart",              label: "AddToCart",           desc: "Adicionar ao carrinho",             group: "ecommerce", unit: "number" },
  { id: "costPerAddToCart",       label: "Custo por ATC",       desc: "Custo por add to cart",             group: "ecommerce", unit: "currency" },
  { id: "initiateCheckout",       label: "InitiateCheckout",    desc: "Iniciar checkout",                   group: "ecommerce", unit: "number" },
  { id: "costPerInitiateCheckout", label: "Custo por IC",       desc: "Custo por iniciar checkout",        group: "ecommerce", unit: "currency" },
  { id: "addPaymentInfo",         label: "Adicionar pagamento", desc: "Preencher meio de pagamento",        group: "ecommerce", unit: "number" },
  { id: "completeRegistration",   label: "Cadastro completo",   desc: "Cadastro finalizado",                group: "ecommerce", unit: "number" },

  // Serviços
  { id: "schedule",       label: "Agendamentos",  desc: "Schedule events do pixel",   group: "servicos", unit: "number" },
  { id: "subscriptions",  label: "Assinaturas",   desc: "Subscribe events",           group: "servicos", unit: "number" },
  { id: "startTrial",     label: "Início trial",  desc: "Free trial iniciado",        group: "servicos", unit: "number" },

  // Instagram / perfil
  { id: "profileVisits",        label: "Visitas ao perfil",  desc: "IG profile visits",         group: "instagram", unit: "number" },
  { id: "costPerProfileVisit",  label: "Custo por visita",   desc: "Custo por visita no perfil", group: "instagram", unit: "currency" },
  { id: "follows",              label: "Novos seguidores",   desc: "Follows adquiridos via ad", group: "instagram", unit: "number" },
  { id: "costPerFollow",        label: "Custo por follow",   desc: "Custo por novo seguidor",   group: "instagram", unit: "currency" },

  // Vídeo
  { id: "video3SecWatched",   label: "Views 3s",         desc: "Passou de 3 segundos", group: "video", unit: "number" },
  { id: "hookRate",           label: "Hook rate",        desc: "% que passou de 3s (calculado)", group: "video", unit: "percent" },
  { id: "holdRate",           label: "Hold rate",        desc: "% que passou de 25% do vídeo",   group: "video", unit: "percent" },
  { id: "thruPlayWatched",    label: "ThruPlays",        desc: "Assistiram 15s+ ou até o fim", group: "video", unit: "number" },
  { id: "thruPlayRate",       label: "ThruPlay rate",    desc: "% de ThruPlays sobre impressões", group: "video", unit: "percent" },
  { id: "costPerThruPlay",    label: "Custo por ThruPlay", desc: "Custo por vídeo assistido",   group: "video", unit: "currency" },
  { id: "videoAvgTimeWatched", label: "Tempo médio assistido", desc: "Segundos médios de audiência", group: "video", unit: "seconds" },
  { id: "videoCompletionRate", label: "Taxa de conclusão", desc: "% que assistiu 100%",        group: "video", unit: "percent" },

  // Taxas
  { id: "productPageConversionRate", label: "VC → ATC",        desc: "Add to cart / view content", group: "taxas", unit: "percent" },
  { id: "cartConversionRate",        label: "ATC → Checkout",  desc: "Initiate checkout / add to cart", group: "taxas", unit: "percent" },
  { id: "checkoutConversionRate",    label: "Checkout → Compra", desc: "Purchase / initiate checkout", group: "taxas", unit: "percent" },
];

export const METRIC_BY_ID: Record<string, MetricDef> = Object.fromEntries(
  META_METRICS.map((m) => [m.id, m]),
);

// Formata o valor conforme a unidade da métrica.
export function formatMetric(value: number, unit: MetricUnit, currency = "BRL"): string {
  if (!Number.isFinite(value)) return "—";
  switch (unit) {
    case "currency":
      return value.toLocaleString("pt-BR", {
        style: "currency",
        currency,
        maximumFractionDigits: value >= 1000 ? 0 : 2,
      });
    case "percent":
      return `${(value * 100).toFixed(2)}%`;
    case "ratio":
      return `${value.toFixed(2)}×`;
    case "seconds":
      return `${value.toFixed(0)}s`;
    case "number":
    default:
      return value.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
  }
}
