import type { MetaFullSummary } from "./use-dashboard-data";

const money = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: v >= 1000 ? 0 : 2 });

// Resumo específico de e-commerce: ROAS, AOV, receita atribuída.
// Complementa os KPI cards da Camada 1 quando businessType=ECOMMERCE.
export function ResumoEcommerce({ summary }: { summary: MetaFullSummary }) {
  const items = [
    {
      label: "ROAS",
      value: summary.purchaseRoas > 0 ? `${summary.purchaseRoas.toFixed(2)}×` : "—",
      sub: summary.purchaseRoas >= 3 ? "saudável (DTC 3-5×)" : "abaixo do saudável",
      tone: summary.purchaseRoas >= 3 ? "ok" : "warn",
    },
    {
      label: "AOV (ticket)",
      value: summary.ticketMedio > 0 ? money(summary.ticketMedio) : "—",
      sub: `${summary.purchases} compras`,
      tone: "neutral",
    },
    {
      label: "Receita atribuída",
      value: summary.purchaseValue > 0 ? money(summary.purchaseValue) : "—",
      sub: `sobre ${money(summary.spend)} de investimento`,
      tone: "neutral",
    },
    {
      label: "CPA",
      value: summary.costPerPurchase > 0 ? money(summary.costPerPurchase) : "—",
      sub: "custo por compra",
      tone: "neutral",
    },
  ] as const;

  return (
    <div className="bg-card rounded-2xl border border-black/5 shadow-[0_1px_2px_rgb(0_0_0_/_0.03),0_8px_24px_-16px_rgb(0_0_0_/_0.08)] p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-[15px] font-semibold text-foreground tracking-tight">
            E-commerce · resultado direto
          </h3>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Vendas atribuídas via pixel Meta
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {items.map((it) => (
          <div
            key={it.label}
            className="bg-surface rounded-2xl p-4"
          >
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
