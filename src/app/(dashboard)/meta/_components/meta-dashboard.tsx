"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  Eye,
  MousePointerClick,
  Percent,
  Banknote,
  AlertCircle,
} from "lucide-react";

const PERIODS: { value: string; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "yesterday", label: "Ontem" },
  { value: "last_7d", label: "Últimos 7 dias" },
  { value: "last_30d", label: "Últimos 30 dias" },
  { value: "this_month", label: "Este mês" },
  { value: "last_month", label: "Mês passado" },
  { value: "last_90d", label: "Últimos 90 dias" },
  { value: "maximum", label: "Tudo" },
];

interface DashboardData {
  datePreset: string;
  summary: {
    spend: number;
    impressions: number;
    clicks: number;
    ctr: number;
    cpm: number;
  };
  accountCount: number;
  activeCampaigns: number;
  perAccount: Array<{
    id: string;
    accountId: string;
    name: string;
    currency: string | null;
    engagement: { id: string; name: string } | null;
    spend: number;
    impressions: number;
    clicks: number;
    campaignCount: number;
  }>;
  topCampaigns: Array<{
    campaignId: string;
    campaignName: string;
    accountName: string;
    accountId: string;
    engagementName: string | null;
    currency: string | null;
    spend: number;
    impressions: number;
    clicks: number;
    ctr: number;
  }>;
  errors: Array<{ accountId: string; name: string; error: string }>;
}

export function MetaDashboard({ hasConnections }: { hasConnections: boolean }) {
  const [datePreset, setDatePreset] = useState("last_30d");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasConnections) return;
    let aborted = false;
    setLoading(true);
    setError(null);
    fetch(`/api/meta/dashboard?date_preset=${datePreset}`)
      .then(async (r) => {
        if (!r.ok) {
          const e = await r.json().catch(() => ({}));
          throw new Error(e.error || "Erro ao carregar dashboard");
        }
        return r.json();
      })
      .then((json) => {
        if (!aborted) setData(json);
      })
      .catch((e) => {
        if (!aborted) setError(e.message);
      })
      .finally(() => {
        if (!aborted) setLoading(false);
      });
    return () => {
      aborted = true;
    };
  }, [datePreset, hasConnections]);

  if (!hasConnections) return null;

  const fmt = (n: number, currency: string | null = "BRL") =>
    n.toLocaleString("pt-BR", { style: "currency", currency: currency || "BRL" });
  const fmtNum = (n: number) => n.toLocaleString("pt-BR");

  return (
    <section className="bg-card rounded-2xl border border-border p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold">Visão geral</h2>
          <p className="text-xs text-muted-foreground">
            Performance agregada de todas as contas conectadas
          </p>
        </div>
        <select
          value={datePreset}
          onChange={(e) => setDatePreset(e.target.value)}
          className="px-3 py-1.5 border border-border rounded-lg text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={loading}
        >
          {PERIODS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {loading && !data && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted/40 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <KPI
              icon={<Banknote className="w-4 h-4" />}
              label="Gasto"
              value={fmt(data.summary.spend)}
              tone="primary"
            />
            <KPI
              icon={<Eye className="w-4 h-4" />}
              label="Impressões"
              value={fmtNum(data.summary.impressions)}
            />
            <KPI
              icon={<MousePointerClick className="w-4 h-4" />}
              label="Cliques"
              value={fmtNum(data.summary.clicks)}
            />
            <KPI
              icon={<Percent className="w-4 h-4" />}
              label="CTR"
              value={`${data.summary.ctr.toFixed(2)}%`}
            />
            <KPI
              icon={<TrendingUp className="w-4 h-4" />}
              label="CPM"
              value={fmt(data.summary.cpm)}
            />
          </div>

          <div className="text-xs text-muted-foreground">
            {data.accountCount} contas · {data.activeCampaigns} campanhas no período
            {loading && " · atualizando..."}
          </div>

          {data.errors.length > 0 && (
            <div className="px-4 py-3 rounded-lg bg-yellow-50 border border-yellow-200 text-xs text-yellow-800">
              <strong>Algumas contas não retornaram dados:</strong>
              <ul className="mt-1 space-y-0.5 list-disc list-inside">
                {data.errors.map((e) => (
                  <li key={e.accountId}>
                    {e.name}: {e.error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.perAccount.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Por cliente / conta
              </h3>
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="text-left px-3 py-2">Conta</th>
                      <th className="text-left px-3 py-2">Cliente</th>
                      <th className="text-right px-3 py-2">Gasto</th>
                      <th className="text-right px-3 py-2">Impressões</th>
                      <th className="text-right px-3 py-2">Cliques</th>
                      <th className="text-right px-3 py-2">Campanhas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.perAccount.map((a) => (
                      <tr key={a.id} className="border-t border-border">
                        <td className="px-3 py-2 font-medium">{a.name}</td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {a.engagement?.name || (
                            <span className="italic text-xs">não vinculada</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {fmt(a.spend, a.currency)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {fmtNum(a.impressions)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {fmtNum(a.clicks)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                          {a.campaignCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {data.topCampaigns.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Top 10 campanhas
              </h3>
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="text-left px-3 py-2">Campanha</th>
                      <th className="text-left px-3 py-2">Conta</th>
                      <th className="text-right px-3 py-2">Gasto</th>
                      <th className="text-right px-3 py-2">Cliques</th>
                      <th className="text-right px-3 py-2">CTR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topCampaigns.map((c) => (
                      <tr key={`${c.accountId}-${c.campaignId}`} className="border-t border-border">
                        <td className="px-3 py-2">{c.campaignName}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {c.engagementName || c.accountName}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {fmt(c.spend, c.currency)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {fmtNum(c.clicks)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {c.ctr.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function KPI({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "primary";
}) {
  return (
    <div
      className={
        "px-3 py-3 rounded-lg border " +
        (tone === "primary"
          ? "bg-primary/5 border-primary/20"
          : "bg-muted/30 border-border")
      }
    >
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="font-semibold text-base mt-1 tabular-nums">{value}</div>
    </div>
  );
}
