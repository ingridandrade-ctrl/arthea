// Rules engine que olha o summary do Meta e propõe candidatos de análise.
//
// Cada regra é uma função que recebe o contexto (summary agregado + lista de
// ads com métricas por criativo) e retorna zero ou mais `InsightCandidate`.
// Nenhum insight é persistido aqui — só sugestão. Quem persiste (com status
// PENDING) é o endpoint /api/portal/insights/generate.
//
// A UI de curadoria mostra esses candidatos pra o admin aprovar, editar ou
// descartar; só os APPROVED viram análise visível pro cliente.

import type { InsightCategory, InsightSeverity } from "@prisma/client";
import type { MetaFullSummary } from "@/lib/meta/resolvers";

export type InsightCandidate = {
  category: InsightCategory;
  severity: InsightSeverity;
  title: string;
  body: string;
  sourceMetric: string;
  meta?: Record<string, unknown>;
};

export type AdForInsight = {
  adId: string;
  adName: string;
  hookRate: number;
  holdRate: number;
  thruPlayRate: number;
  video3SecWatched: number;
  spend: number;
  costPerResult: number;
  results: number;
};

export type InsightContext = {
  summary: MetaFullSummary;
  ads: AdForInsight[];
  currency: string;
};

const money = (v: number, cur = "BRL") =>
  v.toLocaleString("pt-BR", { style: "currency", currency: cur, maximumFractionDigits: 2 });

// ─── Regras ──────────────────────────────────────────────────────

function ruleHighFrequency(ctx: InsightContext): InsightCandidate | null {
  const freq = ctx.summary.frequency;
  if (freq < 3.5) return null;
  const critical = freq >= 5;
  return {
    category: "HEALTH",
    severity: critical ? "WARN" : "INFO",
    title: critical
      ? `Frequência crítica (${freq.toFixed(1)}×)`
      : `Frequência subindo (${freq.toFixed(1)}×)`,
    body: critical
      ? `A audiência tá vendo o mesmo anúncio ${freq.toFixed(1)} vezes em média. Fadiga alta — rode novos criativos ou amplie a segmentação.`
      : `A frequência tá em ${freq.toFixed(1)}×. Ainda dá, mas acima de 5× vira problema. Prepare novos criativos.`,
    sourceMetric: `frequency=${freq.toFixed(2)}`,
    meta: { frequency: freq },
  };
}

function ruleHighCpm(ctx: InsightContext): InsightCandidate | null {
  const cpm = ctx.summary.cpm;
  if (cpm <= 40) return null;
  const critical = cpm > 70;
  return {
    category: "HEALTH",
    severity: critical ? "WARN" : "INFO",
    title: `CPM ${critical ? "muito acima" : "acima"} da média (${money(cpm, ctx.currency)})`,
    body: `O custo por 1.000 impressões tá em ${money(cpm, ctx.currency)}. Isso pode indicar segmentação estreita demais, criativo com pouca performance de entrega ou concorrência alta no leilão. Vale revisar audiência e criativo.`,
    sourceMetric: `cpm=${cpm.toFixed(2)}`,
    meta: { cpm },
  };
}

function ruleLowCtr(ctx: InsightContext): InsightCandidate | null {
  const ctr = ctx.summary.ctr * 100;
  if (ctr >= 1.5) return null;
  return {
    category: "HEALTH",
    severity: "WARN",
    title: `CTR abaixo do saudável (${ctr.toFixed(2)}%)`,
    body: `A taxa de clique tá em ${ctr.toFixed(2)}%. O mínimo saudável em Meta é 1,5%. Criativo ou copy não estão engajando — vale testar nova abordagem visual e headline.`,
    sourceMetric: `ctr=${ctr.toFixed(3)}%`,
    meta: { ctr },
  };
}

function ruleWeakHookVideos(ctx: InsightContext): InsightCandidate | null {
  const weak = ctx.ads.filter((a) => a.video3SecWatched > 100 && a.hookRate < 0.25);
  if (weak.length === 0) return null;
  const list = weak.slice(0, 3).map((a) => a.adName).join(", ");
  return {
    category: "VIDEO",
    severity: "WARN",
    title: `${weak.length} vídeo${weak.length > 1 ? "s" : ""} com hook rate baixo`,
    body: `${list}${weak.length > 3 ? " …e outros" : ""} estão abaixo de 25% no hook. Refaça o primeiro 3s — ele precisa segurar mais gente pra o resto do vídeo funcionar.`,
    sourceMetric: `weak_hook_ads=${weak.length}`,
    meta: {
      adIds: weak.map((a) => a.adId),
      threshold: 0.25,
    },
  };
}

function ruleStrongVideo(ctx: InsightContext): InsightCandidate | null {
  const strong = ctx.ads
    .filter((a) => a.video3SecWatched > 200 && a.hookRate >= 0.5 && a.holdRate >= 0.5)
    .sort((a, b) => b.hookRate - a.hookRate);
  if (strong.length === 0) return null;
  const winner = strong[0];
  return {
    category: "CREATIVE",
    severity: "OK",
    title: `"${winner.adName}" está performando muito bem`,
    body: `Hook ${(winner.hookRate * 100).toFixed(0)}% e hold ${(winner.holdRate * 100).toFixed(0)}% — bem acima da média. Considere escalar o investimento deste criativo e usar como referência pra próximos.`,
    sourceMetric: `winning_ad=${winner.adId}`,
    meta: {
      adId: winner.adId,
      hookRate: winner.hookRate,
      holdRate: winner.holdRate,
    },
  };
}

function ruleCreativeFatigue(ctx: InsightContext): InsightCandidate | null {
  if (ctx.ads.length < 4) return null;
  // Se poucos criativos concentram muito gasto (>70%), sinal de fadiga vindo
  const totalSpend = ctx.ads.reduce((s, a) => s + a.spend, 0);
  if (totalSpend === 0) return null;
  const sorted = [...ctx.ads].sort((a, b) => b.spend - a.spend);
  const topTwoShare = (sorted[0].spend + sorted[1].spend) / totalSpend;
  if (topTwoShare < 0.7) return null;
  return {
    category: "CREATIVE",
    severity: "INFO",
    title: `${(topTwoShare * 100).toFixed(0)}% do investimento em 2 criativos`,
    body: `Poucos criativos concentram quase todo o gasto — o algoritmo elegeu esses, mas eles vão fadigar em breve. Coloque 3–4 novos criativos no ar pra ter substitutos prontos.`,
    sourceMetric: `top2_share=${topTwoShare.toFixed(2)}`,
    meta: {
      topAdIds: sorted.slice(0, 2).map((a) => a.adId),
      share: topTwoShare,
    },
  };
}

function ruleHighCostPerResult(ctx: InsightContext): InsightCandidate | null {
  const s = ctx.summary;
  if (s.results < 10) return null;
  // Compara o CPR dos ads: se o mais caro é 3x+ mais que o mais barato, sugere reallocar
  const adsWithCpr = ctx.ads.filter((a) => a.results >= 3 && a.costPerResult > 0);
  if (adsWithCpr.length < 2) return null;
  const cheapest = adsWithCpr.reduce((a, b) => (a.costPerResult < b.costPerResult ? a : b));
  const priciest = adsWithCpr.reduce((a, b) => (a.costPerResult > b.costPerResult ? a : b));
  const ratio = priciest.costPerResult / cheapest.costPerResult;
  if (ratio < 2.5) return null;
  return {
    category: "BUDGET",
    severity: "INFO",
    title: `"${cheapest.adName}" traz resultado ${ratio.toFixed(1)}× mais barato que "${priciest.adName}"`,
    body: `"${cheapest.adName}" está em ${money(cheapest.costPerResult, ctx.currency)} por resultado, enquanto "${priciest.adName}" está em ${money(priciest.costPerResult, ctx.currency)}. Vale realocar orçamento do mais caro pro mais barato — ou pausar o mais caro se a diferença persistir.`,
    sourceMetric: `cpr_ratio=${ratio.toFixed(2)}`,
    meta: {
      cheapestAdId: cheapest.adId,
      priciestAdId: priciest.adId,
      cheapestCpr: cheapest.costPerResult,
      priciestCpr: priciest.costPerResult,
    },
  };
}

// ─── Runner ─────────────────────────────────────────────────────

const RULES = [
  ruleHighFrequency,
  ruleHighCpm,
  ruleLowCtr,
  ruleWeakHookVideos,
  ruleStrongVideo,
  ruleCreativeFatigue,
  ruleHighCostPerResult,
];

export function generateInsights(ctx: InsightContext): InsightCandidate[] {
  const out: InsightCandidate[] = [];
  for (const rule of RULES) {
    try {
      const r = rule(ctx);
      if (r) out.push(r);
    } catch {
      // Uma regra quebrada não deve derrubar as outras.
    }
  }
  return out;
}
