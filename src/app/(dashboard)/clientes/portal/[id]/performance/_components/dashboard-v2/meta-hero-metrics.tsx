import type { MetaFullSummary } from "./use-dashboard-data";

// Faixa introdutória do Meta — as 9 métricas que a Ingrid definiu:
// Investimento total como herói gigante + Alcance, Impressões, Frequência,
// CPM, CTR, CPC, Mensagens e Custo por mensagem em tiles.
// Custo por mensagem vem do cost_per_action_type OFICIAL do Meta
// (resolvido em lib/meta/resolvers.ts), não de divisão nossa.
// Com `previous`, cada tile ganha o delta chip vs o período de comparação.

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

// Variação percentual vs período anterior. null = sem base de comparação.
function deltaPct(cur: number, prev: number | undefined | null): number | null {
  if (prev === undefined || prev === null || prev <= 0 || !Number.isFinite(cur)) return null;
  return ((cur - prev) / prev) * 100;
}

// Chip de delta: verde quando melhorou, vermelho quando piorou, cinza quando
// estável (<1%). Em métricas de custo (CPM, CPC, custo/msg) e frequência,
// CAIR é bom.
function DeltaChip({
  pct,
  lowerIsBetter = false,
  neutral = false,
}: {
  pct: number | null;
  lowerIsBetter?: boolean;
  neutral?: boolean;
}) {
  if (pct === null) return null;
  const arrow = pct > 0 ? "▲" : pct < 0 ? "▼" : "—";
  const label = `${arrow} ${Math.abs(pct).toFixed(0)}%`;
  let cls = "bg-muted text-muted-foreground";
  if (!neutral && Math.abs(pct) >= 1) {
    const improved = lowerIsBetter ? pct < 0 : pct > 0;
    cls = improved ? "bg-success/12 text-success" : "bg-destructive/10 text-destructive";
  }
  return (
    <span
      className={`inline-flex items-center text-[9.5px] font-bold px-1.5 py-0.5 rounded-full tabular-nums ${cls}`}
    >
      {label}
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

  const tiles: {
    label: string;
    value: string;
    sub: string;
    pct: number | null;
    lowerIsBetter?: boolean;
    hi?: boolean;
  }[] = [
    {
      label: "Alcance",
      value: numShort(s.reach),
      sub: "pessoas únicas",
      pct: deltaPct(s.reach, p?.reach),
    },
    {
      label: "Impressões",
      value: numShort(s.impressions),
      sub: "exibições",
      pct: deltaPct(s.impressions, p?.impressions),
    },
    {
      label: "Frequência",
      value: `${s.frequency.toFixed(1)}×`,
      sub: "média por pessoa",
      pct: deltaPct(s.frequency, p?.frequency),
      lowerIsBetter: true,
    },
    {
      label: "CPM",
      value: s.cpm > 0 ? money(s.cpm) : "—",
      sub: "custo por mil",
      pct: deltaPct(s.cpm, p?.cpm),
      lowerIsBetter: true,
    },
    {
      label: "CTR",
      value: `${(s.ctr * 100).toFixed(2)}%`,
      sub: `${num(s.clicks)} cliques`,
      pct: deltaPct(s.ctr, p?.ctr),
    },
    {
      label: "CPC",
      value: s.cpc > 0 ? money(s.cpc) : "—",
      sub: "custo por clique",
      pct: deltaPct(s.cpc, p?.cpc),
      lowerIsBetter: true,
    },
    {
      label: "Mensagens",
      value: s.conversations > 0 ? num(s.conversations) : "—",
      sub: "conversas iniciadas",
      pct: deltaPct(s.conversations, p?.conversations),
      hi: true,
    },
    {
      label: "Custo por mensagem",
      value: s.costPerConversation > 0 ? money(s.costPerConversation) : "—",
      sub: "custo oficial Meta",
      pct: deltaPct(s.costPerConversation, p?.costPerConversation),
      lowerIsBetter: true,
      hi: true,
    },
  ];

  const spendPct = deltaPct(s.spend, p?.spend);

  return (
    <div className="relative bg-card rounded-3xl border border-black/[0.04] shadow-[0_16px_48px_-20px_rgb(13_74_74_/_0.18)] p-7 md:p-8 mb-5 overflow-hidden">
      {/* brilho sutil no canto — profundidade, sem virar halo */}
      <div
        className="absolute -top-24 -right-16 w-[360px] h-[360px] pointer-events-none opacity-50"
        style={{
          background:
            "radial-gradient(circle at 40% 40%, rgb(29 112 112 / 0.10), transparent 65%)",
          filter: "blur(12px)",
        }}
      />

      <div className="relative grid grid-cols-1 lg:grid-cols-[minmax(280px,1fr)_2.1fr] gap-8 items-center">
        {/* Herói — Investimento total */}
        <div>
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
            Investimento total
          </p>
          <div className="text-[56px] md:text-[68px] font-semibold tracking-[-0.04em] leading-none text-foreground mt-3 tabular-nums">
            {money(s.spend)}
          </div>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <p className="text-[13px] text-muted-foreground">
              {periodLabel} · Meta Ads
            </p>
            {spendPct !== null && (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full tabular-nums">
                {spendPct > 0 ? "▲" : spendPct < 0 ? "▼" : "—"}{" "}
                {Math.abs(spendPct).toFixed(0)}%
                {compareLabel ? ` ${compareLabel}` : " vs período anterior"}
              </span>
            )}
          </div>
        </div>

        {/* As 8 métricas em tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {tiles.map((t) => (
            <div
              key={t.label}
              className={
                t.hi
                  ? "relative rounded-2xl p-4 bg-brand-soft ring-1 ring-brand/20"
                  : "relative rounded-2xl p-4 bg-cream"
              }
            >
              <div className="flex items-start justify-between gap-1">
                <div
                  className={`text-[10px] uppercase tracking-[0.08em] font-semibold ${
                    t.hi ? "text-brand" : "text-muted-foreground"
                  }`}
                >
                  {t.label}
                </div>
                <DeltaChip pct={t.pct} lowerIsBetter={t.lowerIsBetter} />
              </div>
              <div className="text-[26px] font-semibold text-foreground leading-none mt-1.5 tabular-nums tracking-[-0.02em]">
                {t.value}
              </div>
              <div className="text-[10.5px] text-muted-foreground mt-1.5 leading-tight">
                {t.sub}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
