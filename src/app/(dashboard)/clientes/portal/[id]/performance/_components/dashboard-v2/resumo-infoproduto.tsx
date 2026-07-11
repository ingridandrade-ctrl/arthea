import type { MetaFullSummary } from "./use-dashboard-data";

const money = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: v >= 1000 ? 0 : 2 });
const nfBR = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const fmt = (v: number) => nfBR.format(Math.round(v));

// Resumo específico de infoproduto: leads captados, custo por lead,
// vendas do lançamento e ROAS.
export function ResumoInfoproduto({ summary }: { summary: MetaFullSummary }) {
  const items = [
    {
      label: "Leads",
      value: summary.leads > 0 ? fmt(summary.leads) : "0",
      sub: "cadastros na LP",
      tone: "neutral",
    },
    {
      label: "CPL",
      value: summary.costPerLead > 0 ? money(summary.costPerLead) : "—",
      sub: "custo por lead",
      tone: summary.costPerLead > 0 && summary.costPerLead < 15 ? "ok" : "neutral",
    },
    {
      label: "Vendas",
      value: summary.purchases > 0 ? fmt(summary.purchases) : "0",
      sub: summary.costPerPurchase > 0 ? `CPA ${money(summary.costPerPurchase)}` : "sem compras",
      tone: "neutral",
    },
    {
      label: "ROAS lançamento",
      value: summary.purchaseRoas > 0 ? `${summary.purchaseRoas.toFixed(2)}×` : "—",
      sub: summary.purchaseValue > 0 ? money(summary.purchaseValue) + " atribuídos" : "sem receita atribuída",
      tone: summary.purchaseRoas >= 3 ? "ok" : summary.purchaseRoas > 0 ? "warn" : "neutral",
    },
  ] as const;

  return (
    <div className="bg-card rounded-2xl border border-black/5 shadow-[0_1px_2px_rgb(0_0_0_/_0.03),0_8px_24px_-16px_rgb(0_0_0_/_0.08)] p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-[15px] font-semibold text-foreground tracking-tight">
            Infoproduto · resultado do lançamento
          </h3>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Lead → checkout → compra
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {items.map((it) => (
          <div key={it.label} className="bg-surface rounded-2xl p-4">
            <div className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground font-semibold">
              {it.label}
            </div>
            <div className="text-[28px] font-semibold text-foreground leading-none mt-1 tabular-nums tracking-[-0.025em]">
              {it.value}
            </div>
            <div className={`text-[10.5px] mt-1.5 leading-tight ${
              it.tone === "ok" ? "text-success" : it.tone === "warn" ? "text-warning" : "text-muted-foreground"
            }`}>
              {it.sub}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
