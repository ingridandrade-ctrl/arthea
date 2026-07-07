"use client";

import { useEffect, useState } from "react";
import type { DateRange } from "./top-bar";

// Mapeia nossa DateRange interna pro formato do Google Ads API
const GOOGLE_RANGE: Record<DateRange, string> = {
  last_7d: "LAST_7_DAYS",
  last_14d: "LAST_14_DAYS",
  last_30d: "LAST_30_DAYS",
  this_month: "THIS_MONTH",
  last_month: "LAST_MONTH",
};

export type GoogleSummary = {
  impressions: number;
  clicks: number;
  ctr: number;
  averageCpc: number;
  averageCpm: number;
  cost: number;
  conversions: number;
  conversionsValue: number;
  roas: number;
  costPerConversion: number;
  videoViews: number;
  videoViewRate: number;
  averageCpv: number;
  videoQuartileP25Rate: number;
  videoQuartileP50Rate: number;
  videoQuartileP75Rate: number;
  videoQuartileP100Rate: number;
  viewThroughConversions: number;
  engagements: number;
  engagementRate: number;
};

export type GoogleCampaign = {
  campaignId: string;
  campaignName: string;
  status: string;
  channelType: string;
  impressions: number;
  clicks: number;
  ctr: number;
  averageCpc: number;
  cost: number;
  conversions: number;
  conversionsValue: number;
  roas: number;
  costPerConversion: number;
};

export type GoogleSearchTerm = {
  searchTerm: string;
  campaignName: string;
  impressions: number;
  clicks: number;
  ctr: number;
  cost: number;
  conversions: number;
};

export type GoogleData = {
  dateRangeLabel?: string;
  account: { customerId: string; name: string; currencyCode: string } | null;
  summary: GoogleSummary | null;
  campaigns: GoogleCampaign[];
  searchTerms: GoogleSearchTerm[];
  daily: { date: string; clicks: number; cost: number; conversions: number }[];
  note?: string;
  error?: string;
};

export function useGoogleData(engagementId: string, dateRange: DateRange) {
  const [google, setGoogle] = useState<GoogleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(
      `/api/google-ads/dashboard?engagementId=${engagementId}&dateRange=${GOOGLE_RANGE[dateRange]}`,
    )
      .then((r) => r.json())
      .then((data: GoogleData) => {
        if (cancelled) return;
        setGoogle(data);
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message || "Falha ao carregar Google Ads");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [engagementId, dateRange]);

  return { google, loading, error };
}

// Agrupa campanhas por tipo de canal (SEARCH, SHOPPING, PMAX, VIDEO, DISPLAY, DEMAND_GEN)
export type ChannelBucket = {
  channelType: string;
  label: string;
  campaigns: GoogleCampaign[];
  cost: number;
  conversions: number;
  conversionsValue: number;
  roas: number;
  costPerConversion: number;
};

const CHANNEL_LABEL: Record<string, string> = {
  SEARCH: "Search",
  DISPLAY: "Display",
  VIDEO: "YouTube",
  SHOPPING: "Shopping",
  PERFORMANCE_MAX: "PMAX",
  DEMAND_GEN: "Demand Gen",
};

export function bucketByChannel(campaigns: GoogleCampaign[]): ChannelBucket[] {
  const buckets = new Map<string, ChannelBucket>();
  for (const c of campaigns) {
    if (!buckets.has(c.channelType)) {
      buckets.set(c.channelType, {
        channelType: c.channelType,
        label: CHANNEL_LABEL[c.channelType] || c.channelType,
        campaigns: [],
        cost: 0,
        conversions: 0,
        conversionsValue: 0,
        roas: 0,
        costPerConversion: 0,
      });
    }
    const b = buckets.get(c.channelType)!;
    b.campaigns.push(c);
    b.cost += c.cost;
    b.conversions += c.conversions;
    b.conversionsValue += c.conversionsValue;
  }
  // Recalcula ROAS e CPC agregados
  for (const b of buckets.values()) {
    b.roas = b.cost > 0 ? b.conversionsValue / b.cost : 0;
    b.costPerConversion = b.conversions > 0 ? b.cost / b.conversions : 0;
  }
  return Array.from(buckets.values()).sort((a, b) => b.cost - a.cost);
}
