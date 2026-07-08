import type { MetaFullSummary } from "./use-dashboard-data";

// Stats strip do Meta — as 9 métricas definidas pela Ingrid, em células
// iguais divididas por hairlines (estilo Framer: contido, preciso, denso
// na medida). Ordem dela: Alcance, Impressões, Frequência, CPM, CTR, CPC,
// Mensagens, Custo por mensagem, Investimento total.
// Custo por mensagem vem do cost_per_action_type OFICIAL do Meta.

const nfBR = new Intl.NumberFormat("pt-BR");
const num = (v: number) => nfBR.format(Math.round(v));
const numShort = (v: number) => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(".", ",")}M`;
  if (v >= 10_000) return `${(v / 1_000).toFixed(1).replace(".", ",")}k`;
  return nfBR.format(Math.round(v));
};
const money = (v: number) =>
  v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: v >= 1000 ? 0 : 2,
  });

function deltaPct(cur: number, prev: number | undefined | null): number | null {
  if (prev === undefined || prev === null || prev <= 0 || !Number.isFinite(cur)) return null;
  return ((cur - prev) / prev) * 100;
}

// Delta discreto: setinha + % na cor certa. Em custos e frequência, cair é bom.
function Delta({
  pct,
  lowerIsBetter = false,
  neutral = false,
}: {
  pct: number | null;
  lowerIsBetter?: boolean;
  neutral?: boolean;
}) {
  if (pct === null) return null;
  const arrow = pct > 0 ? "↑" : pct < 0 ? "↓" : "→";
  let cls = "text-muted-foreground";
  if (!neutral && Math.abs(pct) >= 1) {
    const improved = lowerIsBetter ? pct < 0 : pct > 0;
    cls = improved ? "text-success" : "text-destructive";
  }
  return (
    <span className={`text-[11px] font-medium tabular-nums ${cls}`}>
      {arrow}{Math.abs(pct).toFixed(0)}%
    </span>
  );
}

export function MetaHeroMetrics({
  summary,
  previous,
  periodLabel,
  compareLabel,
}: {
  summary: MetaFullSummary;
  previous?: MetaFullSummary | null;
  periodLabel: string;
  compareLabel?: string;
}) {
  const s = summary;
  const p = previous ?? null;

  const cells: {
    label: string;
    value: string;
    pct: number | null;
    lowerIsBetter?: boolean;
    hi?: boolean;
  }[] = [
    { label: "Alcance", value: numShort(s.reach), pct: deltaPct(s.reach, p?.reach) },
    { label: "Impressões", value: numShort(s.impressions), pct: deltaPct(s.impressions, p?.impressions) },
    { label: "Frequência", value: `${s.frequency.toFixed(1)}×`, pct: deltaPct(s.frequency, p?.frequency), lowerIsBetter: true },
    { label: "CPM", value: s.cpm > 0 ? money(s.cpm) : "—", pct: deltaPct(s.cpm, p?.cpm), lowerIsBetter: true },
    { label: "CTR", value: `${(s.ctr * 100).toFixed(2)}%`, pct: deltaPct(s.ctr, p?.ctr) },
    { label: "CPC", value: s.cpc > 0 ? money(s.cpc) : "—", pct: deltaPct(s.cpc, p?.cpc), lowerIsBetter: true },
    { label: "Mensagens", value: s.conversations > 0 ? num(s.conversations) : "—", pct: deltaPct(s.conversations, p?.conversations), hi: true },
    { label: "Custo / mensagem", value: s.costPerConversation > 0 ? money(s.costPerConversation) : "—", pct: deltaPct(s.costPerConversation, p?.costPerConversation), lowerIsBetter: true, hi: true },
    { label: "Investimento", value: money(s.spend), pct: deltaPct(s.spend, p?.spend), hi: false },
  ];

  return (
    <div className="mb-6">
      {/* Header da seção — direto no canvas, estilo Power BI */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          Visão geral · Meta Ads
        </span>
        <span className="text-[11px] text-muted-foreground">
          {periodLabel}
          {p && compareLabel ? ` · ${compareLabel}` : ""}
        </span>
      </div>

      {/* Grade de tiles padronizados — 5 + 4 no desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
        {cells.map((c) => (
          <div
            key={c.label}
            className="bg-card rounded-xl border border-black/5 shadow-[0_1px_2px_rgb(0_0_0_/_0.04),0_4px_12px_-6px_rgb(0_0_0_/_0.06)] px-4 py-3.5"
          >
            <div className="flex items-center gap-1.5">
              {c.hi && <span className="w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0" />}
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.07em] text-muted-foreground truncate">
                {c.label}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-2 mt-1.5">
              <span className="text-[22px] font-semibold text-foreground tracking-[-0.02em] tabular-nums leading-none">
                {c.value}
              </span>
              <Delta pct={c.pct} lowerIsBetter={c.lowerIsBetter} neutral={c.label === "Investimento"} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
