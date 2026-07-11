// Torre de controle: saúde dos anúncios de TODOS os clientes num relance.
//
// Pra cada engagement ativo com conta de anúncio linkada, puxa o resumo dos
// últimos 30 dias (Meta e/ou Google) e resume em: investimento, resultados,
// custo por resultado e um semáforo de saúde. Cache em memória de 1h por
// engagement pra não estourar as APIs a cada visita.

import { prisma } from "@/lib/prisma";
import { getAccountInsights } from "@/lib/meta/api";
import { buildMetaSummary, aggregateMetaSummaries } from "@/lib/meta/resolvers";
import { getAccountSummary } from "@/lib/google-ads/api";
import { parseDateRange } from "@/lib/google-ads/format";

export type AdsHealthStatus = "ok" | "warn" | "bad" | "none";

export type EngagementAdsHealth = {
  engagementId: string;
  engagementName: string;
  clientId: string;
  clientName: string;
  businessType: string;
  hasMeta: boolean;
  hasGoogle: boolean;
  spend: number;
  results: number;
  costPerResult: number;
  frequency: number;
  ctr: number; // 0-1
  status: AdsHealthStatus;
  flags: string[];
  error?: string;
};

const cache = new Map<string, { at: number; data: EngagementAdsHealth }>();
const TTL_MS = 60 * 60 * 1000;

function computeStatus(h: {
  spend: number;
  results: number;
  frequency: number;
  ctr: number;
  hasAny: boolean;
}): { status: AdsHealthStatus; flags: string[] } {
  if (!h.hasAny) return { status: "none", flags: ["Sem conta de anúncio linkada"] };
  if (h.spend === 0) return { status: "none", flags: ["Sem investimento no período"] };

  const flags: string[] = [];
  let status: AdsHealthStatus = "ok";

  if (h.frequency >= 5) {
    flags.push(`Frequência crítica (${h.frequency.toFixed(1)}×)`);
    status = "bad";
  } else if (h.frequency >= 3.5) {
    flags.push(`Frequência alta (${h.frequency.toFixed(1)}×)`);
    status = "warn";
  }

  const ctrPct = h.ctr * 100;
  if (ctrPct > 0 && ctrPct < 0.8) {
    flags.push(`CTR muito baixo (${ctrPct.toFixed(2)}%)`);
    status = "bad";
  } else if (ctrPct > 0 && ctrPct < 1.5 && status === "ok") {
    flags.push(`CTR abaixo do saudável (${ctrPct.toFixed(2)}%)`);
    status = "warn";
  }

  if (h.spend > 100 && h.results === 0) {
    flags.push("Investimento sem resultado registrado");
    status = "bad";
  }

  if (flags.length === 0) flags.push("Tudo em dia");
  return { status, flags };
}

async function fetchEngagementHealth(eng: {
  id: string;
  name: string;
  businessType: string;
  client: { id: string; name: string };
  metaAdAccounts: {
    accountId: string;
    connection: { accessToken: string; status: string };
  }[];
  googleAdsAccounts: {
    customerId: string;
    connection: { id: string; status: string };
  }[];
}): Promise<EngagementAdsHealth> {
  const activeMeta = eng.metaAdAccounts.filter((a) => a.connection.status === "ACTIVE");
  const activeGoogle = eng.googleAdsAccounts.filter((a) => a.connection.status === "ACTIVE");

  let spend = 0;
  let results = 0;
  let frequency = 0;
  let ctr = 0;
  let error: string | undefined;

  try {
    if (activeMeta.length > 0) {
      const summaries = await Promise.all(
        activeMeta.map((acc) =>
          getAccountInsights(acc.connection.accessToken, acc.accountId, "last_30d").then(
            buildMetaSummary,
          ),
        ),
      );
      const agg = aggregateMetaSummaries(summaries);
      spend += agg.spend;
      results += agg.results;
      frequency = agg.frequency;
      ctr = agg.ctr;
    }

    if (activeGoogle.length > 0) {
      const dateRange = parseDateRange("LAST_30_DAYS");
      const gs = await Promise.all(
        activeGoogle.map((acc) =>
          getAccountSummary(
            { connectionId: acc.connection.id, customerId: acc.customerId },
            dateRange,
          ),
        ),
      );
      for (const g of gs) {
        spend += g.cost;
        results += g.conversions;
        // ctr do Google só entra se Meta não preencheu (evita média torta)
        if (ctr === 0) ctr = g.ctr;
      }
    }
  } catch (e: any) {
    error = e?.message || "Falha ao consultar APIs de anúncio";
  }

  const { status, flags } = computeStatus({
    spend,
    results,
    frequency,
    ctr,
    hasAny: activeMeta.length > 0 || activeGoogle.length > 0,
  });

  return {
    engagementId: eng.id,
    engagementName: eng.name,
    clientId: eng.client.id,
    clientName: eng.client.name,
    businessType: eng.businessType,
    hasMeta: activeMeta.length > 0,
    hasGoogle: activeGoogle.length > 0,
    spend,
    results,
    costPerResult: results > 0 ? spend / results : 0,
    frequency,
    ctr,
    status: error ? "warn" : status,
    flags: error ? [`Erro: ${error}`] : flags,
    error,
  };
}

// Sem clientId: todos os projetos (torre de controle). Com clientId: só os
// daquele cliente (aba "Anúncios" da ficha).
export async function getAdsOverview(clientId?: string): Promise<EngagementAdsHealth[]> {
  const engagements = await prisma.clientEngagement.findMany({
    where: { isActive: true, ...(clientId ? { clientId } : {}) },
    select: {
      id: true,
      name: true,
      businessType: true,
      client: { select: { id: true, name: true } },
      metaAdAccounts: {
        where: { hidden: false },
        select: {
          accountId: true,
          connection: { select: { accessToken: true, status: true } },
        },
      },
      googleAdsAccounts: {
        where: { hidden: false },
        select: {
          customerId: true,
          connection: { select: { id: true, status: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const now = Date.now();
  const rows = await Promise.all(
    engagements.map(async (eng) => {
      const hit = cache.get(eng.id);
      if (hit && now - hit.at < TTL_MS) return hit.data;
      const data = await fetchEngagementHealth(eng as any);
      cache.set(eng.id, { at: now, data });
      return data;
    }),
  );

  // Pior primeiro: bad > warn > ok > none; empate por investimento desc
  const rank: Record<AdsHealthStatus, number> = { bad: 0, warn: 1, ok: 2, none: 3 };
  return rows.sort((a, b) => rank[a.status] - rank[b.status] || b.spend - a.spend);
}
