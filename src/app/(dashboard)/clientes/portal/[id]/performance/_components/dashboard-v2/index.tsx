"use client";

import { useState } from "react";
import type { BusinessType } from "@prisma/client";
import { Settings2 } from "lucide-react";
import { DashboardTopBar, type DateRange, type ComparePeriod } from "./top-bar";
import { PlatformTabs, type Platform } from "./platform-tabs";
import { DashboardSetup } from "./dashboard-setup";
import { MetaHeroMetrics } from "./meta-hero-metrics";
import { HealthPanel } from "./health-panel";
import { VideoAnalysis } from "./video-analysis";
import { FunilServicos } from "./funil-servicos";
import { OrigemConversas } from "./origem-conversas";
import { FunilInfoproduto } from "./funil-infoproduto";
import { ResumoInfoproduto } from "./resumo-infoproduto";
import { FunilEcommerce } from "./funil-ecommerce";
import { ResumoEcommerce } from "./resumo-ecommerce";
import { InsightsCard } from "./insights-card";
import { CustomZone } from "./custom-zone";
import { CampaignAnalysis } from "./campaign-analysis";
import { GoogleView } from "./google-view";
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

const BUSINESS_LABEL: Record<BusinessType, string> = {
  INFOPRODUCT: "Infoproduto",
  ECOMMERCE: "E-commerce",
  SERVICES: "Serviços",
};

const PERIOD_LABEL: Record<DateRange, string> = {
  last_7d: "últimos 7 dias",
  last_14d: "últimos 14 dias",
  last_30d: "últimos 30 dias",
  this_month: "este mês",
  last_month: "mês passado",
};

const COMPARE_LABEL: Record<ComparePeriod, string> = {
  previous: "vs período anterior",
  prev_month: "vs mês passado",
  prev_year: "vs ano passado",
  none: "",
};

export function DashboardV2({
  engagementId,
  clientName,
  engagementName,
  initialBusinessType,
  initialDateRange,
  initialCompare,
  hasConfig,
  initialPlatforms,
}: {
  engagementId: string;
  clientName: string;
  engagementName: string;
  initialBusinessType: BusinessType;
  initialDateRange: DateRange;
  initialCompare: ComparePeriod;
  hasConfig: boolean;
  initialPlatforms: Platform[];
}) {
  const [configured, setConfigured] = useState(hasConfig);
  const [businessType, setBusinessType] = useState<BusinessType>(initialBusinessType);
  const [platforms, setPlatforms] = useState<Platform[]>(
    initialPlatforms.length > 0 ? initialPlatforms : ["meta"],
  );
  const [dateRange, setDateRange] = useState<DateRange>(initialDateRange);
  const [compare, setCompare] = useState<ComparePeriod>(initialCompare);
  const [platform, setPlatform] = useState<Platform>(
    initialPlatforms[0] ?? "meta",
  );

  const { meta, loading, error } = useDashboardData(engagementId, dateRange, compare);
  const s = meta?.summary;
  const vids = videoAds(meta);

  // ─── Setup inicial: engagement sem config ainda ────────────────
  if (!configured) {
    return (
      <div className="max-w-[1280px] mx-auto px-7 py-12 pb-24">
        <DashboardSetup
          engagementId={engagementId}
          engagementName={engagementName}
          clientName={clientName}
          initialBusinessType={hasConfig ? businessType : undefined}
          initialPlatforms={hasConfig ? platforms : undefined}
          onDone={(bt, ps) => {
            setBusinessType(bt);
            setPlatforms(ps);
            setPlatform(ps[0]);
            setConfigured(true);
          }}
        />
      </div>
    );
  }

  const showTabs = platforms.length > 1;
  const activePlatform: Platform = platforms.includes(platform) ? platform : platforms[0];

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

      {/* Hero personalizado — nome real do cliente */}
      <div className="mb-7 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[42px] font-semibold tracking-[-0.032em] leading-[1.02] text-foreground max-w-2xl">
            {engagementName}
          </h1>
          <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
            {clientName} · {BUSINESS_LABEL[businessType]}
            {!showTabs && (
              <> · {activePlatform === "meta" ? "Meta Ads" : "Google Ads"}</>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setConfigured(false)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] text-muted-foreground hover:text-foreground border border-border hover:border-foreground/30 transition"
        >
          <Settings2 className="w-3 h-3" strokeWidth={1.8} />
          configurar
        </button>
      </div>

      {showTabs && <PlatformTabs value={activePlatform} onChange={setPlatform} />}

      {activePlatform === "google" && (
        <GoogleView
          engagementId={engagementId}
          businessType={businessType}
          dateRange={dateRange}
        />
      )}

      {activePlatform === "meta" && (
        <>
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-2xl p-4 text-[13px] mb-4">
              {error}
            </div>
          )}

          {loading && !meta && (
            <div className="bg-card rounded-3xl border border-black/[0.04] shadow-[0_12px_32px_-16px_rgb(13_74_74_/_0.12)] p-16 text-center text-muted-foreground text-[13px]">
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
              {/* Camada 1 — faixa introdutória: Investimento herói + 8 métricas */}
              <MetaHeroMetrics
                summary={s}
                previous={compare !== "none" ? meta?.previousSummary : null}
                periodLabel={PERIOD_LABEL[dateRange]}
                compareLabel={COMPARE_LABEL[compare]}
              />

              {/* Saúde da campanha — full width */}
              <div className="mb-5">
                <HealthPanel summary={s} />
              </div>

              {/* Análise de vídeo — universal */}
              <div className="mb-5">
                <VideoAnalysis ads={vids} />
              </div>

              {/* Camada 2 — específico por perfil */}
              {businessType === "SERVICES" && (
                <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-4 mb-5">
                  <FunilServicos summary={s} />
                  <OrigemConversas summary={s} />
                </div>
              )}

              {businessType === "INFOPRODUCT" && (
                <>
                  <div className="mb-5">
                    <ResumoInfoproduto summary={s} />
                  </div>
                  <div className="mb-5">
                    <FunilInfoproduto summary={s} />
                  </div>
                </>
              )}

              {businessType === "ECOMMERCE" && (
                <>
                  <div className="mb-5">
                    <ResumoEcommerce summary={s} />
                  </div>
                  <div className="mb-5">
                    <FunilEcommerce summary={s} />
                  </div>
                </>
              )}

              {/* Análise por campanha — agrupada por objetivo */}
              {meta && <CampaignAnalysis meta={meta} />}

              {/* Camada 3 — custom */}
              <div className="mb-5">
                <CustomZone engagementId={engagementId} summary={s} showConfigLink />
              </div>
            </>
          )}
        </>
      )}

      {/* Análise pela Arthea — sempre no rodapé, embaixo de tudo */}
      <div className="mt-2">
        <InsightsCard engagementId={engagementId} showCurationLink />
      </div>
    </div>
  );
}
