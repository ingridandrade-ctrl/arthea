import type { MetaFullSummary } from "./use-dashboard-data";

// Faixa introdutória do Meta — as 9 métricas que a Ingrid definiu:
// Investimento total como herói gigante + Alcance, Impressões, Frequência,
// CPM, CTR, CPC, Mensagens e Custo por mensagem em tiles.
// Custo por mensagem vem do cost_per_action_type OFICIAL do Meta
// (resolvido em lib/meta/resolvers.ts), não de divisão nossa.

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

export function MetaHeroMetrics({
  summary,
  periodLabel,
}: {
  summary: MetaFullSummary;
  periodLabel: string;
}) {
  const s = summary;

  const tiles: {
    label: string;
    value: string;
    sub: string;
    hi?: boolean;
  }[] = [
    { label: "Alcance", value: numShort(s.reach), sub: "pessoas únicas" },
    { label: "Impressões", value: numShort(s.impressions), sub: "exibições" },
    { label: "Frequência", value: `${s.frequency.toFixed(1)}×`, sub: "média por pessoa" },
    { label: "CPM", value: s.cpm > 0 ? money(s.cpm) : "—", sub: "custo por mil" },
    { label: "CTR", value: `${(s.ctr * 100).toFixed(2)}%`, sub: `${num(s.clicks)} cliques` },
    { label: "CPC", value: s.cpc > 0 ? money(s.cpc) : "—", sub: "custo por clique" },
    {
      label: "Mensagens",
      value: s.conversations > 0 ? num(s.conversations) : "—",
      sub: "conversas iniciadas",
      hi: true,
    },
    {
      label: "Custo por mensagem",
      value: s.costPerConversation > 0 ? money(s.costPerConversation) : "—",
      sub: "custo oficial Meta",
      hi: true,
    },
  ];

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
          <p className="text-[13px] text-muted-foreground mt-3">
            {periodLabel} · Meta Ads
          </p>
        </div>

        {/* As 8 métricas em tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {tiles.map((t) => (
            <div
              key={t.label}
              className={
                t.hi
                  ? "rounded-2xl p-4 bg-brand-soft ring-1 ring-brand/20"
                  : "rounded-2xl p-4 bg-cream"
              }
            >
              <div
                className={`text-[10px] uppercase tracking-[0.08em] font-semibold ${
                  t.hi ? "text-brand" : "text-muted-foreground"
                }`}
              >
                {t.label}
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
