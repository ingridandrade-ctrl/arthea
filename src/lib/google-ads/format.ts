// Conversões de valores brutos do Google Ads API pra unidades amigáveis.

/**
 * Google Ads expressa valores monetários em "micros": R$ 1,00 = 1.000.000.
 * Esta função converte pra Number normal.
 */
export function microsToValue(micros: number | string | null | undefined): number {
  if (micros == null) return 0;
  const n = typeof micros === "string" ? Number(micros) : micros;
  if (!Number.isFinite(n)) return 0;
  return n / 1_000_000;
}

/** Formata valor em micros como BRL (R$ 1.234,56). */
export function microsToBRL(micros: number | string | null | undefined): string {
  return microsToValue(micros).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Date ranges aceitos pelo GAQL via cláusula `segments.date DURING ...`.
 * Mapeia os labels do nosso app pros literais da Google Ads API.
 */
export type DateRangeKey =
  | "LAST_7_DAYS"
  | "LAST_14_DAYS"
  | "LAST_30_DAYS"
  | "THIS_MONTH"
  | "LAST_MONTH"
  | "THIS_WEEK_MON_SUN"
  | "LAST_BUSINESS_WEEK";

const VALID_RANGES = new Set<DateRangeKey>([
  "LAST_7_DAYS",
  "LAST_14_DAYS",
  "LAST_30_DAYS",
  "THIS_MONTH",
  "LAST_MONTH",
  "THIS_WEEK_MON_SUN",
  "LAST_BUSINESS_WEEK",
]);

export function parseDateRange(raw: string | null | undefined): DateRangeKey {
  if (raw && VALID_RANGES.has(raw as DateRangeKey)) return raw as DateRangeKey;
  return "LAST_30_DAYS";
}

export function dateRangeLabel(key: DateRangeKey): string {
  switch (key) {
    case "LAST_7_DAYS":
      return "últimos 7 dias";
    case "LAST_14_DAYS":
      return "últimos 14 dias";
    case "LAST_30_DAYS":
      return "últimos 30 dias";
    case "THIS_MONTH":
      return "este mês";
    case "LAST_MONTH":
      return "mês passado";
    case "THIS_WEEK_MON_SUN":
      return "esta semana (seg–dom)";
    case "LAST_BUSINESS_WEEK":
      return "semana útil passada";
  }
}
