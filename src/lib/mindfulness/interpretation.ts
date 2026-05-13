import {
  ffmqBand,
  FFMQ_LABELS,
  type FFMQFacet,
  type FFMQScores,
  dassBand,
  DASS_LABELS,
  type DASSSubscale,
  type DASSScores,
} from "./scoring";

const FACETS: FFMQFacet[] = ["observe", "describe", "act_aware", "nonjudge", "nonreact"];
const SUBSCALES: DASSSubscale[] = ["depressao", "ansiedade", "estresse"];

const firstName = (full: string) => (full?.split(" ")[0] || "a participante").trim();

export function interpretFFMQ(scores: FFMQScores, nome: string): string {
  const fn = firstName(nome);
  const low = FACETS.filter((f) => ffmqBand(f, scores[f]) === "abaixo").map((f) => FFMQ_LABELS[f]);
  const high = FACETS.filter((f) => ffmqBand(f, scores[f]) === "acima").map((f) => FFMQ_LABELS[f]);

  const parts: string[] = [];
  if (low.length > 0) {
    parts.push(
      `${fn} apresenta pontuação abaixo da média em ${listToBR(low)}, indicando espaço de desenvolvimento ${low.length === 1 ? "nessa faceta" : "nessas facetas"} durante as aulas.`,
    );
  }
  if (high.length > 0) {
    parts.push(
      `Pontuação acima da média em ${listToBR(high)} sugere recursos já disponíveis que podem ser mobilizados como base da prática.`,
    );
  }
  if (low.length === 0 && high.length === 0) {
    parts.push(`${fn} apresenta perfil equilibrado, com pontuações dentro da média em todas as cinco facetas.`);
  }
  return parts.join(" ");
}

export function interpretDASS(scores: DASSScores, nome: string): string {
  const fn = firstName(nome);
  const lower: Record<DASSSubscale, string> = { depressao: "depressão", ansiedade: "ansiedade", estresse: "estresse" };
  const elevated = SUBSCALES.filter((s) => dassBand(s, scores[s]) !== "Normal");

  if (elevated.length === 0) {
    return `${fn} apresenta indicadores dentro da faixa normal nas três subescalas — perfil favorável à participação no programa.`;
  }

  const details = elevated.map((s) => `${lower[s]} (${dassBand(s, scores[s]).toLowerCase()})`);
  return `${fn} apresenta indicadores elevados em ${listToBR(details)} — considere a adequação das práticas e o ritmo das sessões às necessidades emocionais presentes.`;
}

export type CollectiveData = {
  ffmqScores: FFMQScores[];
  dassScores: DASSScores[];
  meditacaoPrevia: boolean[];
};

export function generateCollectiveInsights(data: CollectiveData): string[] {
  const insights: string[] = [];
  const n = data.ffmqScores.length;

  if (n === 0) {
    return ["Aguardando respostas das participantes para gerar padrões coletivos."];
  }

  const half = Math.ceil(n / 2);

  // FFMQ: facetas onde a maioria está abaixo da média
  const lowFacets = FACETS.filter((f) => data.ffmqScores.filter((s) => ffmqBand(f, s[f]) === "abaixo").length >= half);
  if (lowFacets.length > 0) {
    insights.push(
      `A maioria das participantes apresenta pontuação abaixo da média em ${listToBR(lowFacets.map((f) => FFMQ_LABELS[f]))} — ${lowFacets.length === 1 ? "essa faceta pode ser priorizada" : "essas facetas podem ser priorizadas"} nas práticas formais das aulas.`,
    );
  }

  // FFMQ: facetas onde a maioria está acima da média
  const highFacets = FACETS.filter((f) => data.ffmqScores.filter((s) => ffmqBand(f, s[f]) === "acima").length >= half);
  if (highFacets.length > 0) {
    insights.push(
      `O grupo demonstra recursos compartilhados em ${listToBR(highFacets.map((f) => FFMQ_LABELS[f]))}, que podem ser evocados como ancoragem nas práticas coletivas.`,
    );
  }

  // DASS-21: subescalas elevadas na maioria
  if (data.dassScores.length > 0) {
    const halfDASS = Math.ceil(data.dassScores.length / 2);
    const lowerLabels: Record<DASSSubscale, string> = { depressao: "depressão", ansiedade: "ansiedade", estresse: "estresse" };
    const elevatedSubs = SUBSCALES.filter(
      (s) => data.dassScores.filter((sc) => dassBand(s, sc[s]) !== "Normal").length >= halfDASS,
    );
    if (elevatedSubs.length > 0) {
      insights.push(
        `Indicadores elevados de ${listToBR(elevatedSubs.map((s) => lowerLabels[s]))} aparecem em mais da metade do grupo — recomenda-se atenção ao ritmo e à regulação emocional nas sessões.`,
      );
    }
  }

  // Prática prévia de meditação
  const withMed = data.meditacaoPrevia.filter(Boolean).length;
  if (withMed === 0 && n > 0) {
    insights.push(
      "Nenhuma participante tem prática de meditação anterior — as aulas podem partir de fundamentos básicos sem assumir familiaridade prévia com técnicas contemplativas.",
    );
  } else if (withMed === n) {
    insights.push(
      "Todas as participantes já têm experiência com meditação, permitindo uma introdução mais aprofundada aos fundamentos teóricos do mindfulness.",
    );
  } else {
    insights.push(
      "O grupo misto — algumas com prática anterior, outras sem — sugere uma abordagem que acolha diferentes pontos de entrada sem criar hierarquias de experiência.",
    );
  }

  return insights;
}

function listToBR(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} e ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} e ${items[items.length - 1]}`;
}
