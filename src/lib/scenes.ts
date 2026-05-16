// Acervo de cenas — constantes dos 7 temas clínicos.
// Mapeamento enum → label + subtítulo + cor. Cores vêm do briefing original.

import type { SceneTheme, SceneStatus } from "@prisma/client";

export const SCENE_THEMES: Record<
  SceneTheme,
  { label: string; subtitle: string; color: string; order: number }
> = {
  COMMUNICATION_FAILURE: {
    label: "Comunicação que Falha",
    subtitle: "Há amor. Mas não há linguagem, e o relacionamento afunda nisso.",
    color: "#1D7070",
    order: 1,
  },
  SILENT_DISTANCE: {
    label: "Distanciamento Silencioso",
    subtitle: "Dois corpos no mesmo espaço, dois mundos que já se afastaram.",
    color: "#3B3B8B",
    order: 2,
  },
  THE_CHOICE: {
    label: "A Escolha",
    subtitle: "O instante em que ficar e partir pesam igual.",
    color: "#6B3A00",
    order: 3,
  },
  CONTROL_ROMANTICIZED: {
    label: "Romantização do Controle",
    subtitle: "Quando a posse é confundida com amor.",
    color: "#8B2020",
    order: 4,
  },
  MASCULINE_VULNERABILITY: {
    label: "Vulnerabilidade Masculina",
    subtitle: "O homem que se permite sentir sem precisar explicar.",
    color: "#2D5016",
    order: 5,
  },
  IDEALIZATION: {
    label: "Idealização",
    subtitle: "Amar a imagem é mais fácil do que conhecer quem está ali.",
    color: "#5C4000",
    order: 6,
  },
  LOVE_AS_PERMANENCE: {
    label: "Amor como Permanência",
    subtitle: "O que sustenta um vínculo quando tudo o mais cede.",
    color: "#4A0070",
    order: 7,
  },
};

export const SCENE_THEME_KEYS = (
  Object.entries(SCENE_THEMES) as [SceneTheme, (typeof SCENE_THEMES)[SceneTheme]][]
)
  .sort(([, a], [, b]) => a.order - b.order)
  .map(([k]) => k);

export function themeMeta(theme: SceneTheme) {
  return SCENE_THEMES[theme];
}

// Status visual — "Com roteiro" é derivado (APPROVED + scriptText preenchido)
export type SceneVisualStatus = "PENDING" | "APPROVED" | "REJECTED" | "WITH_SCRIPT";

export function visualStatus(scene: {
  status: SceneStatus;
  scriptText?: string | null;
}): SceneVisualStatus {
  if (scene.status === "APPROVED" && scene.scriptText && scene.scriptText.trim().length > 0) {
    return "WITH_SCRIPT";
  }
  return scene.status;
}

export const SCENE_STATUS_LABEL: Record<SceneVisualStatus, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovada",
  REJECTED: "Reprovada",
  WITH_SCRIPT: "Com roteiro",
};

export const SCENE_STATUS_BG: Record<SceneVisualStatus, string> = {
  PENDING: "#EDE9E0",
  APPROVED: "#D1FAE5",
  REJECTED: "#FEE2E2",
  WITH_SCRIPT: "#E0E7FF",
};

export const SCENE_STATUS_FG: Record<SceneVisualStatus, string> = {
  PENDING: "#6B7280",
  APPROVED: "#065F46",
  REJECTED: "#991B1B",
  WITH_SCRIPT: "#3730A3",
};
