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

export const PHASE_NAMES = [
  "",
  "Imersão e Posicionamento",
  "Construção e Conteúdo",
  "Rastreamento e Ads",
  "Entrega Final",
];
