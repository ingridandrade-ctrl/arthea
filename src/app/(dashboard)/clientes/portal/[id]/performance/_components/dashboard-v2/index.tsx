"use client";

import { useState } from "react";
import type { BusinessType } from "@prisma/client";
import { Wallet, Users2, MousePointerClick, Coins } from "lucide-react";
import { DashboardTopBar, type DateRange, type ComparePeriod } from "./top-bar";
import { PerfilSelector } from "./perfil-selector";
import { PlatformTabs, type Platform } from "./platform-tabs";
import { KpiCard } from "./kpi-card";
import { HealthPanel } from "./health-panel";
import { VideoAnalysis } from "./video-analysis";
import { FunilServicos } from "./funil-servicos";
import { OrigemConversas } from "./origem-conversas";
import { InsightsCard } from "./insights-card";
import { CustomZone } from "./custom-zone";
import { useDashboardData, videoAds } from "./use-dashboard-data";

const nfBR = new Intl.NumberFormat("pt-BR");
const money = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: v >= 1000 ? 0 : 2 });
const moneyShort = (v: number) => {
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(1).replace(".", ",")}k`;
  return money(v);
};
const num = (v: number) => nfBR.format(Math.round(v));
const numShort = (v: number) => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(".", ",")}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1).replace(".", ",")}k`;
  return nfBR.format(Math.round(v));
};

export function DashboardV2({
  engagementId,
  clientName,
  engagementName,
  initialBusinessType,
  initialDateRange,
  initialCompare,
}: {
  engagementId: string;
  clientName: string;
  engagementName: string;
  initialBusinessType: BusinessType;
  initialDateRange: DateRange;
  initialCompare: ComparePeriod;
}) {
  const [businessType, setBusinessType] = useState<BusinessType>(initialBusinessType);
  const [dateRange, setDateRange] = useState<DateRange>(initialDateRange);
  const [compare, setCompare] = useState<ComparePeriod>(initialCompare);
  const [platform, setPlatform] = useState<Platform>("meta");

  const { meta, loading, error } = useDashboardData(engagementId, dateRange);
  const s = meta?.summary;
  const vids = videoAds(meta);

  return (
    <div className="max-w-[1280px] mx-auto px-7 py-8 pb-24">
      <DashboardTopBar
        brand={`arthea · ${engagementName}`}
        subtitle={clientName}
        dateRange={dateRange}
        compare={compare}
        onDateRangeChange={setDateRange}
        onCompareChange={setCompare}
      />

      <div className="mb-7">
        <h1 className="text-[42px] font-semibold tracking-[-0.032em] leading-[1.02] text-foreground max-w-2xl">
          Panorama do <em className="font-serif italic text-brand">cliente</em>.
        </h1>
        <p className="text-muted-foreground text-sm mt-2 max-w-lg leading-relaxed">
          Estrutura em três camadas: core no topo, blocos por perfil no meio, métricas
          custom no rodapé. Escolha o perfil pra ver o miolo mudar.
        </p>
      </div>

      <PerfilSelector value={businessType} onChange={setBusinessType} />
      <PlatformTabs value={platform} onChange={setPlatform} />

      {platform === "google" && (
        <div className="bg-card border border-dashed border-border rounded-2xl p-10 text-center">
          <p className="text-[13.5px] text-muted-foreground">
            <strong className="text-foreground font-medium">Google Ads na v2 chega no PR 7.</strong>
            <br />
            Enquanto isso, use a view atual (desmarque o "Beta v2" no topo).
          </p>
        </div>
      )}

      {platform === "meta" && (
        <>
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-2xl p-4 text-[13px] mb-4">
              {error}
            </div>
          )}

          {loading && !meta && (
            <div className="bg-card border border-border rounded-2xl p-16 text-center text-muted-foreground text-[13px]">
              Carregando dados Meta…
            </div>
          )}

          {meta?.note && (
            <div className="bg-warning/10 border border-warning/30 rounded-2xl p-4 text-[13px] text-foreground mb-4">
              {meta.note}
            </div>
          )}

          {meta?.error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-2xl p-4 text-[13px] mb-4">
              {meta.error}
            </div>
          )}

          {s && (
            <>
              {/* Camada 1 — KPIs core universais */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-4">
                <KpiCard
                  icon={<Wallet className="w-3.5 h-3.5" strokeWidth={1.9} />}
                  label="Investimento"
                  value={moneyShort(s.spend)}
                />
                <KpiCard
                  icon={<Users2 className="w-3.5 h-3.5" strokeWidth={1.9} />}
                  label="Alcance"
                  value={numShort(s.reach)}
                  compareText={`Frequência ${s.frequency.toFixed(1)}×`}
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
                  label="CPC"
                  value={money(s.cpc)}
                  compareText={`CPM ${money(s.cpm)}`}
                />
              </div>

              {/* Bento: análise curada + saúde */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                <div className="lg:col-span-2">
                  <HealthPanel summary={s} />
                </div>
                <div>
                  <InsightsCard />
                </div>
              </div>

              {/* Análise de vídeo — universal */}
              <div className="mb-4">
                <VideoAnalysis ads={vids} />
              </div>

              {/* Camada 2 — específico por perfil */}
              {businessType === "SERVICES" && (
                <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-4 mb-4">
                  <FunilServicos summary={s} />
                  <OrigemConversas summary={s} />
                </div>
              )}

              {(businessType === "INFOPRODUCT" || businessType === "ECOMMERCE") && (
                <div className="bg-card border border-dashed border-border rounded-2xl p-10 text-center mb-4">
                  <p className="text-[13.5px] text-muted-foreground">
                    <strong className="text-foreground font-medium">
                      Blocos específicos do perfil {businessType === "INFOPRODUCT" ? "Infoproduto" : "E-commerce"}
                    </strong>{" "}
                    chegam no PR 6.
                    <br />
                    <span className="text-[11.5px]">
                      Enquanto isso, os blocos universais acima (saúde, vídeo, análise) já
                      funcionam com os dados reais do Meta.
                    </span>
                  </p>
                </div>
              )}

              {/* Camada 3 — custom */}
              <CustomZone />
            </>
          )}
        </>
      )}
    </div>
  );
}
