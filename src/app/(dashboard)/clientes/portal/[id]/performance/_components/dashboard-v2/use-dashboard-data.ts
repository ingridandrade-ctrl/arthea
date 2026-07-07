"use client";

import { useEffect, useState } from "react";
import type { DateRange } from "./top-bar";

// Shape completo do summary retornado pela API — bate 1:1 com MetaFullSummary
// em src/lib/meta/resolvers.ts. O type publicado pela seção antiga (MetaData)
// não expõe todos os campos; aqui somos mais fiéis ao que a API entrega.
export type MetaFullSummary = {
  spend: number; impressions: number; reach: number; frequency: number;
  clicks: number; linkClicks: number;
  ctr: number; linkCtr: number; cpc: number; linkCpc: number; cpm: number;
  results: number; costPerResult: number;
  leads: number; costPerLead: number;
  purchases: number; costPerPurchase: number;
  purchaseValue: number; purchaseRoas: number; ticketMedio: number;
  conversations: number; costPerConversation: number;
  landingPageViews: number; costPerLandingPageView: number;
  viewContent: number; costPerViewContent: number;
  addToCart: number; costPerAddToCart: number;
  initiateCheckout: number; costPerInitiateCheckout: number;
  addPaymentInfo: number;
  completeRegistration: number; costPerCompleteRegistration: number;
  atendimentos: number; costPerAtendimento: number;
  schedule: number; subscriptions: number; startTrial: number;
  profileVisits: number; costPerProfileVisit: number;
  follows: number; costPerFollow: number;
  cartConversionRate: number; checkoutConversionRate: number; productPageConversionRate: number;
  pageEngagement: number; postReactions: number; postComments: number; postShares: number;
  video3SecWatched: number; hookRate: number; costPer3SecView: number;
  videoP25Watched: number; videoP50Watched: number; videoP75Watched: number;
  videoP95Watched: number; videoP100Watched: number;
  holdRate: number; thruPlayWatched: number; thruPlayRate: number; costPerThruPlay: number;
  videoAvgTimeWatched: number; videoCompletionRate: number;
};

export type MetaAd = MetaFullSummary & {
  adId: string;
  adName: string;
  campaignId: string;
  campaignName: string;
  adsetId?: string;
  adsetName?: string;
  objective?: string;
  objectiveGroup?: string;
  accountName?: string;
  creative?: {
    thumbnail?: string;
    imageUrl?: string;
    videoUrl?: string;
    format?: string;
  } | null;
};

export type MetaData = {
  datePreset: string;
  account: { name: string; currency: string; accountCount: number } | null;
  summary: MetaFullSummary | null;
  campaigns: any[];
  daily: { date: string; clicks: number; cost: number }[];
  objectiveGroups: {
    group: string;
    label: string;
    description: string;
    emoji: string;
    primaryMetrics: string[];
    secondaryMetrics: string[];
    headlineLabel: string;
    headlineMetric: string;
    rankBy: string;
    spend: number;
    sharePct: number;
    summary: MetaFullSummary;
    campaigns: (MetaFullSummary & {
      campaignId: string;
      campaignName: string;
      objective?: string;
      accountName?: string;
    })[];
    topAds: MetaAd[];
  }[];
  note?: string;
  error?: string;
};

// Meta datePreset é igual à nossa DateRange
const META_PRESET: Record<DateRange, string> = {
  last_7d: "last_7d",
  last_14d: "last_14d",
  last_30d: "last_30d",
  this_month: "this_month",
  last_month: "last_month",
};

export function useDashboardData(engagementId: string, dateRange: DateRange) {
  const [meta, setMeta] = useState<MetaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(
      `/api/meta/engagement-dashboard?engagementId=${engagementId}&datePreset=${META_PRESET[dateRange]}`,
    )
      .then((r) => r.json())
      .then((data: MetaData) => {
        if (cancelled) return;
        setMeta(data);
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message || "Falha ao carregar dados Meta");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [engagementId, dateRange]);

  return { meta, loading, error };
}

// Extrai a lista flat de ads de todos os grupos, ordenados por gasto.
export function flattenAds(meta: MetaData | null): MetaAd[] {
  if (!meta) return [];
  const all = meta.objectiveGroups.flatMap((g) => g.topAds);
  // Dedupe por adId (um ad pode aparecer em múltiplos grupos raramente)
  const seen = new Set<string>();
  const unique: MetaAd[] = [];
  for (const ad of all) {
    if (seen.has(ad.adId)) continue;
    seen.add(ad.adId);
    unique.push(ad);
  }
  return unique;
}

// Ads que rodaram vídeo (video3SecWatched > 0), ordenados por hookRate desc.
export function videoAds(meta: MetaData | null): MetaAd[] {
  return flattenAds(meta)
    .filter((a) => a.video3SecWatched > 0)
    .sort((a, b) => b.hookRate - a.hookRate);
}
