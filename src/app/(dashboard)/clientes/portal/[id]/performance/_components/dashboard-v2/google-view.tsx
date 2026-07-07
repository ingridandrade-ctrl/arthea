"use client";

import type { BusinessType } from "@prisma/client";
import { Wallet, Eye, MousePointerClick, Coins, Search } from "lucide-react";
import { KpiCard } from "./kpi-card";
import { useGoogleData, bucketByChannel } from "./use-google-data";
import type { DateRange } from "./top-bar";

const nfBR = new Intl.NumberFormat("pt-BR");
const money = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: v >= 1000 ? 0 : 2 });
const moneyShort = (v: number) => {
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(1).replace(".", ",")}k`;
  return money(v);
};
const num = (v: number) => nfBR.format(Math.round(v));

// View da aba Google Ads no dashboard v2. Segue a mesma estrutura de 3 camadas
// mas com métricas nativas do Google (impressões, conversões, ROAS, campanhas
// por channelType). Insights curados são universais — reaproveita o card.
export function GoogleView({
  engagementId,
  businessType,
  dateRange,
}: {
  engagementId: string;
  businessType: BusinessType;
  dateRange: DateRange;
}) {
  const { google, loading, error } = useGoogleData(engagementId, dateRange);

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-2xl p-4 text-[13px]">
        {error}
      </div>
    );
  }

  if (loading && !google) {
    return (
      <div className="bg-card rounded-3xl border border-black/[0.04] shadow-[0_12px_32px_-16px_rgb(13_74_74_/_0.12)] p-16 text-center text-muted-foreground text-[13px]">
        Carregando dados Google Ads…
      </div>
    );
  }

  if (google?.note) {
    return (
      <div className="bg-warning/10 border border-warning/30 rounded-2xl p-4 text-[13px] text-foreground">
        {google.note}
      </div>
    );
  }

  if (google?.error) {
    return (
      <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-2xl p-4 text-[13px]">
        {google.error}
      </div>
    );
  }

  const s = google?.summary;
  if (!s) return null;

  const buckets = bucketByChannel(google.campaigns);
  const topTerms = [...google.searchTerms].sort((a, b) => b.conversions - a.conversions).slice(0, 5);

  return (
    <>
      {/* Camada 1 — KPIs core universais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <KpiCard
          icon={<Wallet className="w-3.5 h-3.5" strokeWidth={1.9} />}
          label="Investimento"
          value={moneyShort(s.cost)}
        />
        <KpiCard
          icon={<Eye className="w-3.5 h-3.5" strokeWidth={1.9} />}
          label="Impressões"
          value={num(s.impressions)}
        />
        <KpiCard
          icon={<MousePointerClick className="w-3.5 h-3.5" strokeWidth={1.9} />}
          label="CTR"
          value={(s.ctr * 100).toFixed(2)}
          unit="%"
          compareText={`${num(s.clicks)} cliques`}
        />
        <KpiCard
          icon={<Coins className="w-3.5 h-3.5" strokeWidth={1.9} />}
          label="CPC médio"
          value={money(s.averageCpc)}
          compareText={s.roas > 0 ? `ROAS ${s.roas.toFixed(2)}×` : `${num(s.conversions)} conversões`}
        />
      </div>

      {/* Resumo de conversão */}
      <div className="bg-card rounded-3xl border border-black/[0.04] shadow-[0_12px_32px_-16px_rgb(13_74_74_/_0.12)] p-6 mb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-[15px] font-semibold text-foreground tracking-tight">
              Conversão · Google Ads
            </h3>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              {businessType === "ECOMMERCE"
                ? "Vendas atribuídas + receita"
                : businessType === "INFOPRODUCT"
                  ? "Leads e vendas do lançamento"
                  : "Contatos qualificados via Search"}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          <ConvTile
            label="Conversões"
            value={num(s.conversions)}
            sub={s.costPerConversion > 0 ? `${money(s.costPerConversion)} cada` : "—"}
          />
          <ConvTile
            label="Custo/conv."
            value={s.costPerConversion > 0 ? money(s.costPerConversion) : "—"}
            sub="média ponderada"
          />
          <ConvTile
            label="Receita"
            value={s.conversionsValue > 0 ? moneyShort(s.conversionsValue) : "—"}
            sub={s.roas > 0 ? `ROAS ${s.roas.toFixed(2)}×` : "sem tracking de valor"}
            tone={s.roas >= 3 ? "ok" : s.roas > 0 ? "warn" : "neutral"}
          />
          <ConvTile
            label="View-through"
            value={s.viewThroughConversions > 0 ? num(s.viewThroughConversions) : "—"}
            sub="conversões via YouTube"
          />
        </div>
      </div>

      {/* Camada 2 específica: canais que estão puxando o resultado */}
      {buckets.length > 0 && (
        <div className="bg-card rounded-3xl border border-black/[0.04] shadow-[0_12px_32px_-16px_rgb(13_74_74_/_0.12)] p-6 mb-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-[15px] font-semibold text-foreground tracking-tight">
                Canais por tipo
              </h3>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                Search · Shopping · PMAX · YouTube · Display · Demand Gen
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {buckets.map((b) => {
              const share = s.cost > 0 ? (b.cost / s.cost) * 100 : 0;
              return (
                <div
                  key={b.channelType}
                  className="bg-cream rounded-2xl p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-semibold">
                      {b.label}
                    </span>
                    <span className="text-[10.5px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">
                      {share.toFixed(0)}% do gasto
                    </span>
                  </div>
                  <div className="text-[26px] font-semibold text-foreground leading-none tabular-nums tracking-[-0.02em]">
                    {moneyShort(b.cost)}
                  </div>
                  <div className="text-[11.5px] text-muted-foreground mt-2 flex gap-3 flex-wrap">
                    <span>{num(b.conversions)} conv.</span>
                    {b.roas > 0 && <span className="text-brand font-medium">{b.roas.toFixed(2)}× ROAS</span>}
                    {b.costPerConversion > 0 && <span>{money(b.costPerConversion)}/conv.</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top search terms convertendo */}
      {topTerms.length > 0 && (
        <div className="bg-card rounded-3xl border border-black/[0.04] shadow-[0_12px_32px_-16px_rgb(13_74_74_/_0.12)] p-6 mb-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center">
                <Search className="w-4 h-4 text-muted-foreground" strokeWidth={1.9} />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-foreground tracking-tight">
                  Termos de busca que converteram
                </h3>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  Search terms com pelo menos uma conversão no período
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-1">
            {topTerms.map((t, i) => (
              <div
                key={`${t.searchTerm}-${i}`}
                className="grid grid-cols-[24px_1fr_auto] items-center gap-3 py-2 px-3 rounded-lg hover:bg-cream transition"
              >
                <span className="text-[13px] text-muted-foreground font-serif italic">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <div className="text-[13px] text-foreground font-medium truncate">
                    {t.searchTerm}
                  </div>
                  <div className="text-[10.5px] text-muted-foreground">
                    {t.campaignName} · {num(t.impressions)} impr. · CTR {(t.ctr * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[16px] text-brand font-semibold leading-none tabular-nums">
                    {num(t.conversions)}
                  </div>
                  <div className="text-[10.5px] text-muted-foreground mt-0.5">
                    {money(t.cost)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function ConvTile({
  label,
  value,
  sub,
  tone = "neutral",
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "ok" | "warn" | "neutral";
}) {
  return (
    <div className="bg-cream rounded-2xl p-4">
      <div className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground font-semibold">
        {label}
      </div>
      <div className="text-[26px] font-semibold text-foreground leading-none mt-1 tabular-nums tracking-[-0.025em]">
        {value}
      </div>
      <div className={`text-[10.5px] mt-1.5 leading-tight ${
        tone === "ok" ? "text-success" : tone === "warn" ? "text-warning" : "text-muted-foreground"
      }`}>
        {sub}
      </div>
    </div>
  );
}
