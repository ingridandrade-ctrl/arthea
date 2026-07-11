import {
  Users,
  Eye,
  Repeat,
  Layers,
  MousePointerClick,
  Coins,
  MessageCircle,
  Wallet,
  Banknote,
} from "lucide-react";
import type { MetaFullSummary } from "./use-dashboard-data";

// Grade de KPIs do Meta — 9 métricas em tiles padronizados (5+4 no desktop),
// com o "mix de cards" das referências da Ingrid: a maioria branca com ícone
// em bolha, o resultado principal (Mensagens) em card ESCURO verde-petróleo
// e o Custo/mensagem com gradiente suave da marca.
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

function Delta({
  pct,
  lowerIsBetter = false,
  neutral = false,
  onDark = false,
}: {
  pct: number | null;
  lowerIsBetter?: boolean;
  neutral?: boolean;
  onDark?: boolean;
}) {
  if (pct === null) return null;
  const arrow = pct > 0 ? "↑" : pct < 0 ? "↓" : "→";
  let cls = onDark ? "text-white/60" : "text-muted-foreground";
  if (!neutral && Math.abs(pct) >= 1) {
    const improved = lowerIsBetter ? pct < 0 : pct > 0;
    if (onDark) {
      cls = improved ? "text-[#7FE0D0]" : "text-[#FFB4A8]";
    } else {
      cls = improved ? "text-success" : "text-destructive";
    }
  }
  return (
    <span className={`text-[11px] font-medium tabular-nums ${cls}`}>
      {arrow}{Math.abs(pct).toFixed(0)}%
    </span>
  );
}

type CellVariant = "light" | "dark" | "gradient";

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
    icon: any;
    pct: number | null;
    lowerIsBetter?: boolean;
    neutral?: boolean;
    variant: CellVariant;
  }[] = [
    { label: "Alcance", value: numShort(s.reach), icon: Users, pct: deltaPct(s.reach, p?.reach), variant: "light" },
    { label: "Impressões", value: numShort(s.impressions), icon: Eye, pct: deltaPct(s.impressions, p?.impressions), variant: "light" },
    { label: "Frequência", value: `${s.frequency.toFixed(1)}×`, icon: Repeat, pct: deltaPct(s.frequency, p?.frequency), lowerIsBetter: true, variant: "light" },
    { label: "CPM", value: s.cpm > 0 ? money(s.cpm) : "—", icon: Layers, pct: deltaPct(s.cpm, p?.cpm), lowerIsBetter: true, variant: "light" },
    { label: "CTR", value: `${(s.ctr * 100).toFixed(2)}%`, icon: MousePointerClick, pct: deltaPct(s.ctr, p?.ctr), variant: "light" },
    { label: "CPC", value: s.cpc > 0 ? money(s.cpc) : "—", icon: Coins, pct: deltaPct(s.cpc, p?.cpc), lowerIsBetter: true, variant: "light" },
    { label: "Mensagens", value: s.conversations > 0 ? num(s.conversations) : "—", icon: MessageCircle, pct: deltaPct(s.conversations, p?.conversations), variant: "dark" },
    { label: "Custo / mensagem", value: s.costPerConversation > 0 ? money(s.costPerConversation) : "—", icon: Wallet, pct: deltaPct(s.costPerConversation, p?.costPerConversation), lowerIsBetter: true, variant: "gradient" },
    { label: "Investimento", value: money(s.spend), icon: Banknote, pct: deltaPct(s.spend, p?.spend), neutral: true, variant: "light" },
  ];

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          Visão geral · Meta Ads
        </span>
        <span className="text-[11px] text-muted-foreground">
          {periodLabel}
          {p && compareLabel ? ` · ${compareLabel}` : ""}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
        {cells.map((c) => {
          const Icon = c.icon;
          const dark = c.variant === "dark";
          const grad = c.variant === "gradient";
          return (
            <div
              key={c.label}
              className={
                dark
                  ? "rounded-xl px-4 py-3.5 bg-[#0D3B3E] shadow-[0_8px_24px_-10px_rgb(13_59_62_/_0.5)]"
                  : grad
                    ? "rounded-xl px-4 py-3.5 bg-gradient-to-br from-brand-soft via-white to-white border border-brand/15 shadow-[0_1px_2px_rgb(0_0_0_/_0.04),0_4px_12px_-6px_rgb(0_0_0_/_0.06)]"
                    : "rounded-xl px-4 py-3.5 bg-card border border-black/5 shadow-[0_1px_2px_rgb(0_0_0_/_0.04),0_4px_12px_-6px_rgb(0_0_0_/_0.06)]"
              }
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                      dark ? "bg-white/10 text-[#7FE0D0]" : "bg-brand/8 text-brand"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" strokeWidth={1.9} />
                  </span>
                  <span
                    className={`text-[10.5px] font-semibold uppercase tracking-[0.06em] truncate ${
                      dark ? "text-white/70" : "text-muted-foreground"
                    }`}
                  >
                    {c.label}
                  </span>
                </div>
                <Delta pct={c.pct} lowerIsBetter={c.lowerIsBetter} neutral={c.neutral} onDark={dark} />
              </div>
              <div
                className={`text-[22px] font-semibold tracking-[-0.02em] tabular-nums leading-none mt-2.5 ${
                  dark ? "text-white" : "text-foreground"
                }`}
              >
                {c.value}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
