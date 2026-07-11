import type { MetaFullSummary } from "./use-dashboard-data";
import { PillChart } from "./pill-chart";

const nfBR = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const fmt = (v: number) => nfBR.format(Math.round(v));
const fmtK = (v: number) => (v >= 10000 ? `${(v / 1000).toFixed(1).replace(".", ",")} mil` : nfBR.format(Math.round(v)));

// Funil típico de infoproduto: Impressões -> Cliques LP -> Cadastros -> Checkout -> Compra.
// A visualização de LP vem de landingPageViews (fb_pixel_view_content da LP)
// ou landing_page_view. Cadastros = leads. Checkout = initiate_checkout ou
// complete_registration. Compras = purchases.
export function FunilInfoproduto({ summary }: { summary: MetaFullSummary }) {
  const impressions = summary.impressions;
  const lpViews = summary.landingPageViews || summary.linkClicks;
  const leads = summary.leads;
  const checkout = summary.initiateCheckout || summary.completeRegistration;
  const purchases = summary.purchases;

  const leadPct = lpViews > 0 ? (leads / lpViews) * 100 : 0;
  const checkoutPct = leads > 0 ? (checkout / leads) * 100 : 0;
  const purchasePct = checkout > 0 ? (purchases / checkout) * 100 : 0;

  return (
    <div className="bg-card rounded-2xl border border-black/5 shadow-[0_1px_2px_rgb(0_0_0_/_0.03),0_8px_24px_-16px_rgb(0_0_0_/_0.08)] p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-[15px] font-semibold text-foreground tracking-tight">
            Funil do lançamento
          </h3>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Impressão → Cadastro → Checkout → Compra
          </p>
        </div>
        <span className="text-[10px] uppercase tracking-[0.1em] text-brand bg-brand/8 border border-brand/12 px-2.5 py-1 rounded-full font-semibold">
          Infoproduto
        </span>
      </div>

      <PillChart
        cols={[
          {
            label: "Impressões",
            sub: fmtK(impressions),
            value: impressions,
          },
          {
            label: "Cliques LP",
            sub: `${fmt(lpViews)}${impressions > 0 ? ` · ${((lpViews / impressions) * 100).toFixed(1)}%` : ""}`,
            value: lpViews,
          },
          {
            label: "Cadastros",
            sub: `${fmt(leads)}${leadPct > 0 ? ` · ${leadPct.toFixed(1)}%` : ""}`,
            value: Math.max(leads, impressions * 0.001),
            highlight: true,
            callout: fmt(leads),
          },
          {
            label: "Checkout",
            sub: checkout > 0 ? `${fmt(checkout)} · ${checkoutPct.toFixed(1)}%` : "—",
            value: Math.max(checkout, impressions * 0.0006),
          },
          {
            label: "Compra",
            sub: purchases > 0 ? `${fmt(purchases)} · ${purchasePct.toFixed(1)}%` : "—",
            value: Math.max(purchases, impressions * 0.0003),
          },
        ]}
      />
    </div>
  );
}
