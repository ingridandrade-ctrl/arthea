"use client";

import { useState } from "react";
import type { BusinessType } from "@prisma/client";
import { Wallet, Users2, MousePointerClick, Coins } from "lucide-react";
import { DashboardTopBar, type DateRange, type ComparePeriod } from "./top-bar";
import { PerfilSelector } from "./perfil-selector";
import { PlatformTabs, type Platform } from "./platform-tabs";
import { KpiCard } from "./kpi-card";

// Container do dashboard v2. Segura o estado dos filtros e do perfil ativo.
// Nesse PR 2, os KPIs são placeholders — no PR 3 conectamos com a API do
// Meta/Google via hook `useDashboardData` (ainda a criar).
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

      {/* Hero title */}
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

      {/* Camada 1 — KPIs core universais (placeholder até PR 3) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KpiCard
          icon={<Wallet className="w-3.5 h-3.5" strokeWidth={1.9} />}
          label="Investimento"
          value="R$ 0"
          delta="dados no PR 3"
          deltaKind="flat"
        />
        <KpiCard
          icon={<Users2 className="w-3.5 h-3.5" strokeWidth={1.9} />}
          label="Alcance"
          value="0"
          delta="dados no PR 3"
          deltaKind="flat"
        />
        <KpiCard
          icon={<MousePointerClick className="w-3.5 h-3.5" strokeWidth={1.9} />}
          label="CTR"
          value="0,0"
          unit="%"
          delta="dados no PR 3"
          deltaKind="flat"
        />
        <KpiCard
          icon={<Coins className="w-3.5 h-3.5" strokeWidth={1.9} />}
          label="CPC"
          value="R$ 0,00"
          delta="dados no PR 3"
          deltaKind="flat"
        />
      </div>

      {/* Placeholder das Camadas 2 e 3 (chegam no PR 3, 4, 5) */}
      <div className="mt-8 bg-card border border-dashed border-border rounded-2xl p-10 text-center">
        <p className="text-[13.5px] text-muted-foreground max-w-xl mx-auto">
          <strong className="text-foreground font-medium">Camadas 2 e 3 chegam no PR 3</strong>
          <br />
          Painel de saúde · Análise de vídeo por criativo · Funil por perfil · Card de
          Análise curada · Zona de métricas custom.
        </p>
        <div className="mt-4 text-[11px] text-muted-foreground/70 uppercase tracking-[0.12em]">
          Perfil ativo: {businessType} · Plataforma: {platform} · Período: {dateRange} · Comparação: {compare}
        </div>
      </div>
    </div>
  );
}
