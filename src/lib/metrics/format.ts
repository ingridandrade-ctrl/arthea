// Formatação e classificação de valores de métricas.
//
// Toda renderização de KPI no dashboard/PDF/relatório usa essas funções pra
// garantir consistência (separador de milhares, decimais, sufixos, semáforo).

import type { MetricDefinition } from "./definitions";

export type MetricTone = "good" | "warn" | "danger" | "neutral";

/**
 * Formata um valor numérico conforme a definição da métrica.
 * Trata null/undefined retornando "—".
 */
export function formatMetric(
  value: number | null | undefined,
  metric: MetricDefinition,
  opts?: { currency?: string },
): string {
  if (value == null || !Number.isFinite(value)) return "—";

  const currency = opts?.currency || "BRL";
  const dec = metric.decimals;

  switch (metric.format) {
    case "currency":
      return value.toLocaleString("pt-BR", {
        style: "currency",
        currency,
        maximumFractionDigits: dec ?? (value >= 1000 ? 0 : 2),
        minimumFractionDigits: dec ?? (value >= 1000 ? 0 : 2),
      });

    case "number":
      return value.toLocaleString("pt-BR", {
        maximumFractionDigits: dec ?? 0,
        minimumFractionDigits: dec ?? 0,
      });

    case "percent":
      return (
        (value * 100).toLocaleString("pt-BR", {
          maximumFractionDigits: dec ?? 1,
          minimumFractionDigits: dec ?? 1,
        }) + "%"
      );

    case "decimal":
      return (
        value.toLocaleString("pt-BR", {
          maximumFractionDigits: dec ?? 2,
          minimumFractionDigits: dec ?? 2,
        }) + (metric.suffix || "")
      );

    case "compact":
      if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
      if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
      return value.toLocaleString("pt-BR");

    case "duration":
      // value em segundos
      if (value < 60) return `${value.toFixed(1)}s`;
      const m = Math.floor(value / 60);
      const s = Math.round(value - m * 60);
      return `${m}m ${s.toString().padStart(2, "0")}s`;

    default:
      return String(value);
  }
}

/**
 * Classifica o valor em tom (semáforo). Usado pra colorir KPI cards e
 * células de tabela conforme regra de benchmark.
 */
export function classifyMetric(
  value: number | null | undefined,
  metric: MetricDefinition,
): MetricTone {
  if (value == null || !Number.isFinite(value) || !metric.benchmark) return "neutral";

  const { good, warn } = metric.benchmark;
  const higherBetter = metric.higherBetter !== false;

  if (higherBetter) {
    if (value >= good) return "good";
    if (value >= warn) return "warn";
    return "danger";
  } else {
    // Menor é melhor — exemplo: CPC, CPM, Frequência (com benchmark inverso)
    // Convenção: pra "lower better" a interpretação dos números é:
    //   - frequência: good=3 (≤3 é bom), warn=5 (3-5 atenção, >5 crítico)
    //   - cpc/cpa: como benchmark depende do nicho, usa good/warn como tetos
    if (value <= good) return "good";
    if (value <= warn) return "warn";
    return "danger";
  }
}

/**
 * Calcula a variação percentual entre dois valores (current vs previous).
 * Retorna null se previous for 0 ou ausente. Resultado é decimal (0.15 = 15%).
 */
export function pctChange(current: number, previous: number | null | undefined): number | null {
  if (previous == null || previous === 0) return null;
  return (current - previous) / Math.abs(previous);
}

/**
 * Formata uma variação percentual com sinal e sufixo %.
 * Ex: 0.157 → "+15,7%"
 */
export function formatPctChange(delta: number | null): string {
  if (delta == null) return "—";
  const pct = delta * 100;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toLocaleString("pt-BR", { maximumFractionDigits: 1, minimumFractionDigits: 1 })}%`;
}

/**
 * Tom da variação considerando se a métrica é "maior=melhor" ou não.
 * Ex: delta +15% num CPC (lower better) é tom "danger", num ROAS é "good".
 */
export function classifyDelta(
  delta: number | null,
  metric: MetricDefinition,
  threshold = 0.05, // ±5% considera estável
): MetricTone {
  if (delta == null) return "neutral";
  if (Math.abs(delta) < threshold) return "neutral";
  const positive = delta > 0;
  const higherBetter = metric.higherBetter !== false;
  if (positive === higherBetter) return "good";
  return "danger";
}
