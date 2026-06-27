// Templates de entregáveis padronizados por tipo de frente.
// Quando o admin clicar "Aplicar template Tráfego Pago" na frente de um
// cliente, esses entregáveis nascem prontos com kinds e textos-base.
// Os textos podem ser editados depois de criados.

import type { EngagementType } from "@prisma/client";

export type TemplateDeliverable = {
  order: number;
  title: string;
  description: string;
  category:
    | "POSITIONING"
    | "CONTENT"
    | "TRACKING"
    | "DELIVERY"
    | "CAMPAIGN_SETUP"
    | "CREATIVE"
    | "REPORT"
    | "OPTIMIZATION"
    | "BRIEFING"
    | "WIREFRAME"
    | "DESIGN"
    | "DEVELOPMENT"
    | "LAUNCH"
    | "PROFILE_SETUP"
    | "POST"
    | "REVIEW_RESPONSE";
  kind: "TASK" | "FORM" | "DOCUMENT";
  phase: number;
};

export type EngagementTemplate = {
  label: string;
  description: string;
  totalPhases: number;
  deliverables: TemplateDeliverable[];
};

// ─── Tráfego Pago — Fase 1 (próximas fases entram aqui depois) ───
const PAID_TRAFFIC_PHASE_1: TemplateDeliverable[] = [
  {
    order: 1,
    phase: 1,
    title: "Formulário de boas-vindas e onboarding",
    description:
      "Preencha o formulário pra gente conhecer sua marca, seu cliente e seus desafios. As respostas viram base pra tudo que vem depois.",
    category: "POSITIONING",
    kind: "FORM",
  },
  {
    order: 2,
    phase: 1,
    title: "Acesso às contas de anúncio",
    description:
      "Configuramos os acessos necessários (Meta Business Manager, Google Ads, GTM, GA4) pra começar a operação.",
    category: "TRACKING",
    kind: "TASK",
  },
  {
    order: 3,
    phase: 1,
    title: "Estudos de estratégia de marca e comunicação",
    description:
      "Imersão profunda no posicionamento da marca, no público e na concorrência — pra construir a estratégia certa.",
    category: "POSITIONING",
    kind: "TASK",
  },
  {
    order: 4,
    phase: 1,
    title: "Entregável: Quem chega até você — um mapa do seu público",
    description:
      "Mapeamento de quem é o cliente da sua marca: dores, desejos, comportamentos e o que motiva a decisão.",
    category: "POSITIONING",
    kind: "DOCUMENT",
  },
  {
    order: 5,
    phase: 1,
    title: "Entregável: Pesquisa Mercado",
    description:
      "Análise da concorrência e do contexto do mercado, com insights pra posicionar a marca com diferenciação real.",
    category: "POSITIONING",
    kind: "DOCUMENT",
  },
  {
    order: 6,
    phase: 1,
    title: "Entregável: Posicionamento e Voz da Marca",
    description:
      "Narrativa, tom de voz e direcionamento estratégico que reforçam a identidade da marca em cada anúncio.",
    category: "POSITIONING",
    kind: "DOCUMENT",
  },
];

// ─── Tráfego Pago — Fase 2: Execução & Estratégia ───
// "Até 10 dias úteis após Fase 1" — setup técnico + materiais estratégicos
// pro cliente revisar antes da ativação.
const PAID_TRAFFIC_PHASE_2: TemplateDeliverable[] = [
  {
    order: 1,
    phase: 2,
    title: "Setup de rastreamento completo",
    description:
      "Instalação e validação do Pixel Meta, API de Conversões, GTM e GA4 — pra cada clique ser rastreado, atribuído e otimizado pelo algoritmo.",
    category: "TRACKING",
    kind: "TASK",
  },
  {
    order: 2,
    phase: 2,
    title: "Estruturação de públicos",
    description:
      "Configuração das audiências na Meta: públicos frios (prospecção), quentes (engajamento recente) e remarketing (visitantes/compradores).",
    category: "CAMPAIGN_SETUP",
    kind: "TASK",
  },
  {
    order: 3,
    phase: 2,
    title: "Entregável: Direcionamento criativo e copy",
    description:
      "Briefing criativo com referências visuais e sugestões de copy pra anúncios. Você revisa antes da equipe produzir as peças.",
    category: "CREATIVE",
    kind: "DOCUMENT",
  },
  {
    order: 4,
    phase: 2,
    title: "Entregável: Estratégia de campanhas",
    description:
      "Plano completo: objetivos, orçamento, formatos, jornada do cliente e os critérios de sucesso. Aprovação antes do go-live.",
    category: "CAMPAIGN_SETUP",
    kind: "DOCUMENT",
  },
  {
    order: 5,
    phase: 2,
    title: "Ativação das primeiras campanhas",
    description:
      "Subida das campanhas na Meta com tudo aprovado. A partir daqui as métricas começam a aparecer no seu dashboard de Tráfego.",
    category: "CAMPAIGN_SETUP",
    kind: "TASK",
  },
];

const PAID_TRAFFIC_TEMPLATE: EngagementTemplate = {
  label: "Tráfego Pago",
  description:
    "Modelo padrão Arthea pra frente de tráfego pago (Fases 1 e 2). Fase 3 (Crescimento contínuo) entra em onda futura quando modelarmos rituais recorrentes.",
  totalPhases: 3,
  deliverables: [...PAID_TRAFFIC_PHASE_1, ...PAID_TRAFFIC_PHASE_2],
};

export const ENGAGEMENT_TEMPLATES: Partial<Record<EngagementType, EngagementTemplate>> = {
  PAID_TRAFFIC: PAID_TRAFFIC_TEMPLATE,
  // STRATEGY, LANDING_PAGE, GMN virão depois — pra cada uma vamos modelar
  // junto, igual fizemos com a Perso pra Tráfego Pago.
};

export function getTemplate(type: EngagementType): EngagementTemplate | null {
  return ENGAGEMENT_TEMPLATES[type] ?? null;
}

// Retorna as fases que o template define, com nome derivado da convenção
// PHASE_NAMES_BY_TYPE (em deliverable-status). Útil pra UI montar menu de
// "Aplicar só a Fase X".
export function templatePhases(type: EngagementType): { phase: number; count: number }[] {
  const t = ENGAGEMENT_TEMPLATES[type];
  if (!t) return [];
  const counts = new Map<number, number>();
  for (const d of t.deliverables) {
    counts.set(d.phase, (counts.get(d.phase) || 0) + 1);
  }
  return Array.from(counts.entries())
    .sort(([a], [b]) => a - b)
    .map(([phase, count]) => ({ phase, count }));
}
