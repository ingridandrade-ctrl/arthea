"use client";

import { useServiceFilter } from "@/lib/hooks/use-service-filter";
import { useCachedFetch } from "@/lib/hooks/use-cached-fetch";
import { formatCurrency } from "@/lib/utils";
import {
  TrendingUp,
  DollarSign,
  Users,
  Clock,
  Trophy,
} from "lucide-react";
import type { ReportData } from "@/types";

export default function RelatoriosPage() {
  const { activeService } = useServiceFilter();
  const url = `/api/reports?service=${activeService}`;
  const { data, loading } = useCachedFetch<ReportData>(url, 120000);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const totalRevenue = data.revenueByMonth.reduce((sum, m) => sum + m.revenue, 0);
  const maxRevenue = Math.max(...data.revenueByMonth.map((m) => m.revenue), 1);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Relatórios</h1>

      {/* Revenue by Month */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-green-50 p-2 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Receita por Mês</h2>
              <p className="text-sm text-muted-foreground">
                Total: {formatCurrency(totalRevenue)}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-end gap-2 h-48">
          {data.revenueByMonth.map((item) => {
            const height = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
            return (
              <div key={item.month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-muted-foreground font-medium">
                  {item.revenue > 0 ? formatCurrency(item.revenue) : "-"}
                </span>
                <div
                  className="w-full bg-green-500 rounded-t-md transition-all min-h-[4px]"
                  style={{ height: `${Math.max(height, 2)}%` }}
                />
                <span className="text-xs text-muted-foreground">{item.month}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion by Service */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-50 p-2 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold">Conversão por Serviço</h2>
          </div>
          <div className="space-y-3">
            {data.conversionByService.map((item) => (
              <div key={item.service} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{item.service}</span>
                  <span className="font-semibold">{item.rate}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(item.rate, 100)}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
            {data.conversionByService.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
            )}
          </div>
        </div>

        {/* Leads by Source */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-purple-50 p-2 rounded-lg">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-lg font-semibold">Leads por Origem</h2>
          </div>
          <div className="space-y-3">
            {data.leadsBySource.map((item) => {
              const total = data.leadsBySource.reduce((s, i) => s + i.count, 0);
              const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
              return (
                <div key={item.source} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-purple-500" />
                    <span className="text-sm">{item.source}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{item.count}</span>
                    <span className="text-xs text-muted-foreground">({pct}%)</span>
                  </div>
                </div>
              );
            })}
            {data.leadsBySource.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
            )}
          </div>
        </div>

        {/* Pipeline Velocity */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-orange-50 p-2 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <h2 className="text-lg font-semibold">Velocidade do Pipeline</h2>
          </div>
          <div className="space-y-3">
            {data.pipelineVelocity.map((item) => (
              <div key={item.stage} className="flex items-center justify-between">
                <span className="text-sm">{item.stage}</span>
                <span className="text-sm font-semibold">
                  {item.avgDays} dia{item.avgDays !== 1 ? "s" : ""}
                </span>
              </div>
            ))}
            {data.pipelineVelocity.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
            )}
          </div>
        </div>

        {/* Top Deals */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-yellow-50 p-2 rounded-lg">
              <Trophy className="w-5 h-5 text-yellow-600" />
            </div>
            <h2 className="text-lg font-semibold">Top Deals</h2>
          </div>
          <div className="space-y-3">
            {data.topDeals.map((deal, i) => (
              <div key={deal.id} className="flex items-center gap-3">
                <span className="text-lg font-bold text-muted-foreground w-6">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{deal.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {deal.leadName} · {deal.stage}
                  </p>
                </div>
                <span className="text-sm font-semibold text-green-600">
                  {formatCurrency(deal.value)}
                </span>
              </div>
            ))}
            {data.topDeals.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum deal encontrado</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
