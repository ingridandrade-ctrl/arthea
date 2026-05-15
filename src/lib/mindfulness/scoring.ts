/**
 * Pontuação e classificação por faixa para FFMQ e DASS-21.
 *
 * Fontes verificadas:
 *   - PDF dos questionários (39 itens FFMQ, 21 itens DASS).
 *   - Planilha TABELAS_FFMQ_DASS_CAMM_Fund26.xlsx (faixas e itens reversos).
 *
 * FFMQ — 5 facetas. Itens reversos têm valor substituído por (6 − valor).
 * DASS-21 — 3 subescalas. Pontuações somadas direto (0–3 cada item).
 */

// Itens (1-indexed) por faceta do FFMQ
export const FFMQ_FACETS = {
  observe:   [1, 6, 11, 15, 20, 26, 31, 36],
  describe:  [2, 7, 12, 16, 22, 27, 32, 37],
  act_aware: [5, 8, 13, 18, 23, 28, 34, 38], // todos reversos
  nonjudge:  [3, 10, 14, 17, 25, 30, 35, 39], // todos reversos
  nonreact:  [4, 9, 19, 21, 24, 29, 33],
} as const;

export type FFMQFacet = keyof typeof FFMQ_FACETS;

// Itens reversos do FFMQ: nonjudge inteiro + act_aware inteiro + describe parcial
export const FFMQ_REVERSED: ReadonlySet<number> = new Set([
  3, 5, 8, 10, 12, 13, 14, 16, 17, 18, 22, 23, 25, 28, 30, 34, 35, 38, 39,
]);

export const FFMQ_LABELS: Record<FFMQFacet, string> = {
  observe: "Observar",
  describe: "Descrever",
  act_aware: "Agir com Atenção",
  nonjudge: "Não Julgar",
  nonreact: "Não Reagir",
};

export const FFMQ_DESCRIPTIONS: Record<FFMQFacet, string> = {
  observe: "Perceber experiências internas e externas no momento presente.",
  describe: "Conseguir colocar emoções e sensações em palavras.",
  act_aware: "Manter foco e perceber as ações, sem agir no automático.",
  nonjudge: "Não julgar a própria experiência interna como boa ou má.",
  nonreact: "Permitir que pensamentos e sentimentos venham e vão sem reagir.",
};

// Faixas FFMQ — definidas pela planilha de referência
const FFMQ_BANDS: Record<FFMQFacet, [number, number]> = {
  observe:   [27, 32], // <27 abaixo · 27–32 média · >32 acima
  describe:  [30, 32], // <30 abaixo · 30–32 média · >33 acima
  act_aware: [26, 28], // <26 abaixo · 26–28 média · >29 acima
  nonjudge:  [29, 32], // <29 abaixo · 29–32 média · >33 acima
  nonreact:  [22, 25], // <22 abaixo · 22–25 média · >26 acima
};

export type FFMQBand = "abaixo" | "media" | "acima";

export function ffmqBand(facet: FFMQFacet, score: number): FFMQBand {
  const [low, high] = FFMQ_BANDS[facet];
  if (score < low) return "abaixo";
  if (score <= high) return "media";
  return "acima";
}

export function ffmqMax(facet: FFMQFacet): number {
  return FFMQ_FACETS[facet].length * 5;
}

/**
 * Médias por faceta em duas amostras de referência publicadas em
 * Baer, R. A., Smith, G. T., Lykins, E., Button, D., Krietemeyer, J.,
 * Sauer, S., … Williams, J. M. G. (2008). Construct Validity of the
 * Five Facet Mindfulness Questionnaire in Meditating and Nonmeditating
 * Samples. Assessment, 15(3), 329–342. Tabela 4.
 *
 * São usadas APENAS para contextualizar visualmente a leitura — não
 * afetam o cálculo dos scores nem as faixas oficiais usadas pelos
 * instrumentos. Os dados brutos das respostas continuam disponíveis
 * item a item na aba "Respostas detalhadas".
 *
 *   • "nao_meditantes": amostra comunitária geral (n=259).
 *   • "meditantes":     amostra de praticantes regulares (n=174).
 */
export const FFMQ_NORMS: Record<FFMQFacet, { nao_meditantes: number; meditantes: number }> = {
  observe:   { nao_meditantes: 24.32, meditantes: 31.96 },
  describe:  { nao_meditantes: 24.63, meditantes: 31.84 },
  act_aware: { nao_meditantes: 24.57, meditantes: 28.08 },
  nonjudge:  { nao_meditantes: 23.85, meditantes: 32.44 },
  nonreact:  { nao_meditantes: 19.53, meditantes: 25.70 },
};

export type FFMQScores = Record<FFMQFacet, number> & { total: number };

export function scoreFFMQ(answers: Record<number, number>): FFMQScores {
  const out: Partial<FFMQScores> = {};
  let total = 0;
  for (const facet of Object.keys(FFMQ_FACETS) as FFMQFacet[]) {
    let sum = 0;
    for (const item of FFMQ_FACETS[facet]) {
      const raw = answers[item];
      if (typeof raw !== "number") continue;
      const v = FFMQ_REVERSED.has(item) ? 6 - raw : raw;
      sum += v;
    }
    out[facet] = sum;
    total += sum;
  }
  out.total = total;
  return out as FFMQScores;
}

// DASS-21 — Itens (1-indexed) por subescala
export const DASS_SUBSCALES = {
  depressao: [3, 5, 10, 13, 16, 17, 21],
  ansiedade: [2, 4, 7, 9, 15, 19, 20],
  estresse:  [1, 6, 8, 11, 12, 14, 18],
} as const;

export type DASSSubscale = keyof typeof DASS_SUBSCALES;

export const DASS_LABELS: Record<DASSSubscale, string> = {
  depressao: "Depressão",
  ansiedade: "Ansiedade",
  estresse: "Estresse",
};

export type DASSBand = "Normal" | "Leve" | "Moderado" | "Severo" | "Extremamente severo";

const DASS_BANDS: Record<DASSSubscale, [number, number, number, number]> = {
  // [normal_max, leve_max, moderado_max, severo_max]
  depressao: [4, 6, 10, 13],
  ansiedade: [3, 5, 7, 9],
  estresse:  [7, 9, 12, 16],
};

export function dassBand(sub: DASSSubscale, score: number): DASSBand {
  const [n, l, m, s] = DASS_BANDS[sub];
  if (score <= n) return "Normal";
  if (score <= l) return "Leve";
  if (score <= m) return "Moderado";
  if (score <= s) return "Severo";
  return "Extremamente severo";
}

export type DASSScores = Record<DASSSubscale, number>;

export function scoreDASS(answers: Record<number, number>): DASSScores {
  const out: Partial<DASSScores> = {};
  for (const sub of Object.keys(DASS_SUBSCALES) as DASSSubscale[]) {
    let sum = 0;
    for (const item of DASS_SUBSCALES[sub]) {
      const v = answers[item];
      if (typeof v === "number") sum += v;
    }
    out[sub] = sum;
  }
  return out as DASSScores;
}

/**
 * Validação de respostas completas. Garante que todos os itens vieram
 * preenchidos e dentro da escala esperada antes de salvar no banco.
 */
export function validateFFMQAnswers(answers: Record<number, number>): { ok: true } | { ok: false; error: string } {
  for (let i = 1; i <= 39; i++) {
    const v = answers[i];
    if (typeof v !== "number" || v < 1 || v > 5 || !Number.isInteger(v)) {
      return { ok: false, error: `Item ${i} inválido ou ausente (esperado 1–5).` };
    }
  }
  return { ok: true };
}

export function validateDASSAnswers(answers: Record<number, number>): { ok: true } | { ok: false; error: string } {
  for (let i = 1; i <= 21; i++) {
    const v = answers[i];
    if (typeof v !== "number" || v < 0 || v > 3 || !Number.isInteger(v)) {
      return { ok: false, error: `Item ${i} inválido ou ausente (esperado 0–3).` };
    }
  }
  return { ok: true };
}
