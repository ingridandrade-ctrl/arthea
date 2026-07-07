import type { MetaFullSummary } from "./use-dashboard-data";
import { PillChart } from "./pill-chart";

const nfBR = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const fmt = (v: number) => nfBR.format(Math.round(v));
const fmtK = (v: number) => (v >= 10000 ? `${(v / 1000).toFixed(1).replace(".", ",")} mil` : nfBR.format(Math.round(v)));

// Funil típico do perfil Serviços: Impressões → Cliques → Conversas → Qualificados
// "Qualificados" ainda não vem do Meta — placeholder em 0 até integrarmos com CRM.
export function FunilServicos({ summary }: { summary: MetaFullSummary }) {
  const impressions = summary.impressions;
  const clicks = summary.clicks;
  const conversations = summary.conversations + summary.leads; // WhatsApp + form
  const qualified = 0; // TODO: puxar do CRM depois

  const clicksPct = impressions > 0 ? (clicks / impressions) * 100 : 0;
  const convPct = clicks > 0 ? (conversations / clicks) * 100 : 0;

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-[15px] font-semibold text-foreground tracking-tight">
            Funil da conversa
          </h3>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Do anúncio até o contato qualificado
          </p>
        </div>
        <span className="text-[10px] uppercase tracking-[0.1em] text-brand bg-brand/8 border border-brand/12 px-2 py-1 rounded-md font-semibold">
          Serviços
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
            label: "Cliques",
            sub: `${fmt(clicks)} · ${clicksPct.toFixed(1)}%`,
            value: clicks,
          },
          {
            label: "Conversas",
            sub: `${fmt(conversations)} · ${convPct.toFixed(1)}%`,
            value: Math.max(conversations, impressions * 0.001),
            highlight: true,
            callout: fmt(conversations),
          },
          {
            label: "Qualificados",
            sub: qualified > 0 ? `${fmt(qualified)}` : "manual · CRM",
            value: Math.max(qualified, impressions * 0.0004),
          },
        ]}
      />
    </div>
  );
}
