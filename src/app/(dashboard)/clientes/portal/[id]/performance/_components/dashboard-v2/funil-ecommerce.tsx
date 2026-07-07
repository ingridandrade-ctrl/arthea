import type { MetaFullSummary } from "./use-dashboard-data";
import { PillChart } from "./pill-chart";

const nfBR = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const fmt = (v: number) => nfBR.format(Math.round(v));
const fmtK = (v: number) => (v >= 10000 ? `${(v / 1000).toFixed(1).replace(".", ",")} mil` : nfBR.format(Math.round(v)));

// Funil e-commerce padrão: ViewContent -> AddToCart -> InitiateCheckout -> Purchase.
// Todos vêm do pixel Meta.
export function FunilEcommerce({ summary }: { summary: MetaFullSummary }) {
  const vc = summary.viewContent;
  const atc = summary.addToCart;
  const ic = summary.initiateCheckout;
  const purchase = summary.purchases;

  const atcPct = vc > 0 ? (atc / vc) * 100 : 0;
  const icPct = atc > 0 ? (ic / atc) * 100 : 0;
  const purchasePct = ic > 0 ? (purchase / ic) * 100 : 0;

  // Se o pixel não tá completo, sinaliza
  const missing = vc === 0 && atc === 0 && purchase > 0;

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-[15px] font-semibold text-foreground tracking-tight">
            Funil de compra
          </h3>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            ViewContent → AddToCart → InitiateCheckout → Purchase
          </p>
        </div>
        <span className="text-[10px] uppercase tracking-[0.1em] text-brand bg-brand/8 border border-brand/12 px-2 py-1 rounded-md font-semibold">
          E-commerce
        </span>
      </div>

      {missing && (
        <div className="text-[11.5px] text-warning bg-warning/12 border border-warning/25 rounded-lg px-3 py-2 mb-3">
          Pixel Meta não está enviando os eventos de funil (ViewContent, AddToCart). Só compras estão chegando.
        </div>
      )}

      <PillChart
        cols={[
          {
            label: "ViewContent",
            sub: fmtK(vc),
            value: vc,
            highlight: true,
            callout: "100%",
          },
          {
            label: "AddToCart",
            sub: `${fmt(atc)}${atcPct > 0 ? ` · ${atcPct.toFixed(1)}%` : ""}`,
            value: atc,
          },
          {
            label: "InitiateCheckout",
            sub: `${fmt(ic)}${icPct > 0 ? ` · ${icPct.toFixed(1)}%` : ""}`,
            value: ic,
          },
          {
            label: "Purchase",
            sub: `${fmt(purchase)}${purchasePct > 0 ? ` · ${purchasePct.toFixed(1)}%` : ""}`,
            value: purchase,
          },
        ]}
      />
    </div>
  );
}
