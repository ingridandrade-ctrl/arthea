"use client";

import { useState } from "react";
import { ChevronDown, Play, Video, Megaphone } from "lucide-react";
import { METRIC_BY_ID, formatMetric } from "@/lib/meta/metrics-catalog";
import type { MetaData, MetaAd, MetaFullSummary } from "./use-dashboard-data";

// Análise por campanha, agrupada por objetivo. Cada grupo mostra as métricas
// que fazem sentido PRO OBJETIVO DELE (campanha de mensagens → conversas;
// engajamento/vídeo → views e hook; vendas → ROAS), e dentro de cada grupo
// os criativos rankeados pela métrica-chave daquele objetivo.

const nfBR = new Intl.NumberFormat("pt-BR");
const num = (v: number) => nfBR.format(Math.round(v));
const moneyShort = (v: number) => {
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(1).replace(".", ",")}k`;
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });
};

function metricLabel(id: string): string {
  return METRIC_BY_ID[id]?.label ?? id;
}

function metricValue(summary: Record<string, unknown>, id: string): string {
  const def = METRIC_BY_ID[id];
  const raw = Number(summary[id] ?? 0);
  if (!def) return num(raw);
  return formatMetric(raw, def.unit);
}

export function CampaignAnalysis({ meta }: { meta: MetaData }) {
  const groups = (meta.objectiveGroups || []).filter(
    (g) => g.spend > 0 || g.campaigns.length > 0,
  );
  if (groups.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="flex items-baseline justify-between gap-3 mb-3 flex-wrap">
        <div>
          <h2 className="text-[18px] font-semibold text-foreground tracking-[-0.015em]">
            Análise por campanha
          </h2>
          <p className="text-[12.5px] text-muted-foreground mt-0.5">
            Cada campanha avaliada pelo objetivo dela — métricas e criativos no contexto certo
          </p>
        </div>
        <span className="text-[11px] text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
          {groups.length} objetivo{groups.length > 1 ? "s" : ""} ativo{groups.length > 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-3">
        {groups.map((g) => (
          <ObjectiveGroupCard key={g.group} group={g} />
        ))}
      </div>
    </div>
  );
}

function ObjectiveGroupCard({
  group,
}: {
  group: MetaData["objectiveGroups"][number];
}) {
  const [open, setOpen] = useState(true);
  const headline = metricValue(group.summary as any, group.headlineMetric);
  const primary = group.primaryMetrics.slice(0, 4);

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header do grupo */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-muted/30 transition"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-brand/8 border border-brand/12 text-brand flex items-center justify-center flex-shrink-0">
            <Megaphone className="w-4 h-4" strokeWidth={1.8} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-[15px] font-semibold text-foreground tracking-tight">
                {group.label}
              </h3>
              <span className="text-[10.5px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">
                {group.campaigns.length} campanha{group.campaigns.length > 1 ? "s" : ""}
              </span>
              <span className="text-[10.5px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">
                {(group.sharePct * 100).toFixed(0)}% do investimento
              </span>
            </div>
            <p className="text-[11.5px] text-muted-foreground mt-0.5 truncate">
              {group.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="text-right">
            <div className="text-[22px] font-semibold text-foreground leading-none tabular-nums tracking-[-0.02em]">
              {headline}
            </div>
            <div className="text-[10.5px] text-muted-foreground mt-1">{group.headlineLabel}</div>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
            strokeWidth={2}
          />
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5">
          {/* Métricas do objetivo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-4">
            {primary.map((id) => (
              <div key={id} className="bg-muted/40 border border-border rounded-xl p-3.5">
                <div className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground font-semibold">
                  {metricLabel(id)}
                </div>
                <div className="text-[20px] font-semibold text-foreground leading-none mt-1 tabular-nums tracking-[-0.02em]">
                  {metricValue(group.summary as any, id)}
                </div>
              </div>
            ))}
          </div>

          {/* Campanhas do grupo */}
          <div className="space-y-1.5 mb-4">
            {group.campaigns.slice(0, 6).map((c) => (
              <CampaignRow key={c.campaignId} campaign={c} metricIds={primary} />
            ))}
            {group.campaigns.length > 6 && (
              <p className="text-[11px] text-muted-foreground text-center pt-1">
                + {group.campaigns.length - 6} campanha{group.campaigns.length - 6 > 1 ? "s" : ""} com menos investimento
              </p>
            )}
          </div>

          {/* Criativos do grupo — rankeados pela métrica do objetivo */}
          {group.topAds.length > 0 && (
            <div>
              <div className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground font-semibold mb-2">
                Top criativos · por {metricLabel(group.rankBy).toLowerCase()}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
                {group.topAds.slice(0, 6).map((ad) => (
                  <CreativeTile key={ad.adId} ad={ad} rankBy={group.rankBy} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CampaignRow({
  campaign,
  metricIds,
}: {
  campaign: MetaFullSummary & { campaignId: string; campaignName: string };
  metricIds: string[];
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] md:grid-cols-[1fr_repeat(3,minmax(80px,auto))] items-center gap-3 px-3.5 py-2.5 rounded-xl bg-muted/30 border border-border/60">
      <div className="min-w-0">
        <div className="text-[12.5px] font-medium text-foreground truncate">
          {campaign.campaignName}
        </div>
        <div className="text-[10.5px] text-muted-foreground">
          {moneyShort(campaign.spend)} investidos
        </div>
      </div>
      {metricIds.slice(0, 3).map((id) => (
        <div key={id} className="text-right hidden md:block">
          <div className="text-[14px] font-semibold text-foreground tabular-nums leading-none">
            {metricValue(campaign as any, id)}
          </div>
          <div className="text-[9.5px] text-muted-foreground mt-0.5">{metricLabel(id)}</div>
        </div>
      ))}
      <div className="text-right md:hidden">
        <div className="text-[14px] font-semibold text-foreground tabular-nums leading-none">
          {metricValue(campaign as any, metricIds[0])}
        </div>
        <div className="text-[9.5px] text-muted-foreground mt-0.5">{metricLabel(metricIds[0])}</div>
      </div>
    </div>
  );
}

function CreativeTile({ ad, rankBy }: { ad: MetaAd; rankBy: string }) {
  const thumb = ad.creative?.thumbnail || ad.creative?.imageUrl;
  const isVideo = ad.video3SecWatched > 0;
  const hookPct = ad.hookRate * 100;
  const hookTone =
    hookPct >= 35 ? "text-success" : hookPct >= 25 ? "text-warning" : "text-destructive";

  return (
    <div className="bg-muted/30 border border-border rounded-xl overflow-hidden">
      <div className="aspect-[4/5] relative bg-gradient-to-br from-brand/70 to-brand/30 flex items-center justify-center">
        {thumb ? (
          <img src={thumb} alt={ad.adName} loading="lazy" className="w-full h-full object-cover" />
        ) : (
          <Video className="w-5 h-5 text-white/70" strokeWidth={1.6} />
        )}
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/25">
            <Play className="w-3.5 h-3.5 text-white/90" fill="currentColor" strokeWidth={0} />
          </div>
        )}
        <span className="absolute left-1.5 bottom-1.5 bg-black/70 text-white text-[9.5px] font-semibold px-1.5 py-0.5 rounded-md backdrop-blur-sm">
          {metricValue(ad as any, rankBy)} {metricLabel(rankBy).toLowerCase()}
        </span>
      </div>
      <div className="p-2">
        <div className="text-[10.5px] font-medium text-foreground leading-tight line-clamp-2">
          {ad.adName}
        </div>
        {isVideo && (
          <div className="text-[9px] text-muted-foreground mt-1">
            hook <span className={`font-semibold ${hookTone}`}>{hookPct.toFixed(0)}%</span>
            {" · "}thruplay {(ad.thruPlayRate * 100).toFixed(0)}%
          </div>
        )}
      </div>
    </div>
  );
}
