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

const PAID_TRAFFIC_TEMPLATE: EngagementTemplate = {
  label: "Tráfego Pago",
  description:
    "Modelo padrão Arthea pra frente de tráfego pago (Fase 1 — Imersão & Estrutura). Próximas fases serão definidas em ondas futuras.",
  totalPhases: 3,
  deliverables: [...PAID_TRAFFIC_PHASE_1],
};

export const ENGAGEMENT_TEMPLATES: Partial<Record<EngagementType, EngagementTemplate>> = {
  PAID_TRAFFIC: PAID_TRAFFIC_TEMPLATE,
  // STRATEGY, LANDING_PAGE, GMB virão depois — pra cada uma vamos modelar
  // junto, igual fizemos com a Perso pra Tráfego Pago.
};

export function getTemplate(type: EngagementType): EngagementTemplate | null {
  return ENGAGEMENT_TEMPLATES[type] ?? null;
}
