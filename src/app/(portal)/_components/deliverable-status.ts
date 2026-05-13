export type DeliverableStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "WAITING_REVIEW"
  | "APPROVED"
  | "REVISION";

export const STATUS_LABEL: Record<DeliverableStatus, string> = {
  PENDING: "Em preparação",
  IN_PROGRESS: "Em produção",
  WAITING_REVIEW: "Aguardando sua validação",
  APPROVED: "Aprovado ✓",
  REVISION: "Em revisão",
};

export const STATUS_BG: Record<DeliverableStatus, string> = {
  PENDING: "#EDE9E0",
  IN_PROGRESS: "#FEF3C7",
  WAITING_REVIEW: "#9bf0e0",
  APPROVED: "#D1FAE5",
  REVISION: "#FED7AA",
};

export const STATUS_FG: Record<DeliverableStatus, string> = {
  PENDING: "#6B7280",
  IN_PROGRESS: "#92400E",
  WAITING_REVIEW: "#0D4A4A",
  APPROVED: "#065F46",
  REVISION: "#9A3412",
};

// Nomes das fases por tipo de frente. Cada array é 1-indexed (índice 0 vazio
// pra que phase=1 mapeie pra index 1, mantendo o template legível).
export const PHASE_NAMES_BY_TYPE: Record<string, string[]> = {
  STRATEGY: [
    "",
    "Imersão e Posicionamento",
    "Construção e Conteúdo",
    "Rastreamento e Ads",
    "Entrega Final",
  ],
  PAID_TRAFFIC: [
    "",
    "Imersão & Estrutura",
    "Execução & Estratégia",
    "Crescimento & Refinamento",
  ],
  LANDING_PAGE: [
    "",
    "Briefing",
    "Wireframe",
    "Design",
    "Desenvolvimento",
    "Publicação",
  ],
  GMB: ["", "Setup da ficha", "Operação contínua"],
};

export function phaseNamesFor(type: string | null | undefined): string[] {
  if (!type) return PHASE_NAMES_BY_TYPE.STRATEGY;
  return PHASE_NAMES_BY_TYPE[type] || PHASE_NAMES_BY_TYPE.STRATEGY;
}

// Mantém o alias antigo apontando pra STRATEGY pra retro-compatibilidade.
// Componentes novos devem usar phaseNamesFor(engagement.type).
export const PHASE_NAMES = PHASE_NAMES_BY_TYPE.STRATEGY;
