"use client";

import { useEffect, useState, useMemo } from "react";
import { formatCurrency } from "@/lib/utils";
import { Users, DollarSign, TrendingUp } from "lucide-react";
import type { DashboardStats } from "@/types";
import { getLeadStatusLabel, getLeadStatusColor } from "@/lib/lead-status";
import { DonutChart, DonutLegend } from "@/components/charts/donut-chart";
import { FilterBar, getDateRange, type DatePreset, type FilterService } from "@/components/crm/filter-bar";
import Link from "next/link";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [services, setServices] = useState<FilterService[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeService, setActiveService] = useState("all");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((data) => setServices(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const url = useMemo(() => {
    const params = new URLSearchParams();
    if (activeService !== "all") params.set("service", activeService);
    const range = getDateRange(datePreset, customFrom, customTo);
    if (range) {
      params.set("from", range.from);
      params.set("to", range.to);
    }
    const qs = params.toString();
    return `/api/dashboard/stats${qs ? `?${qs}` : ""}`;
  }, [activeService, datePreset, customFrom, customTo]);

  useEffect(() => {
    setLoading(true);
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [url]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <FilterBar
          services={services}
          activeService={activeService}
          onServiceChange={setActiveService}
          datePreset={datePreset}
          onDatePresetChange={setDatePreset}
          customFrom={customFrom}
          customTo={customTo}
          onCustomChange={(f, t) => { setCustomFrom(f); setCustomTo(t); }}
        />
      </div>

      {loading || !stats ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <>
          {/* Cards principais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatsCard
              title="Total de Leads"
              value={stats.totalLeads.toString()}
              icon={Users}
              color="text-blue-600"
              bgColor="bg-blue-50"
            />
            <StatsCard
              title="Receita Total"
              value={formatCurrency(stats.totalRevenue)}
              icon={DollarSign}
              color="text-green-600"
              bgColor="bg-green-50"
            />
            <StatsCard
              title="Taxa de Conversão"
              value={`${stats.conversionRate}%`}
              icon={TrendingUp}
              color="text-orange-600"
              bgColor="bg-orange-50"
            />
          </div>

          {/* Gráficos lado a lado */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold mb-4">Leads por Serviço</h2>
              <div className="flex items-center gap-6 flex-wrap">
                <DonutChart
                  data={stats.leadsByService.map((d) => ({ label: d.service, value: d.count, color: d.color }))}
                  centerLabel="leads"
                />
                <div className="flex-1 min-w-[160px]">
                  <DonutLegend
                    data={stats.leadsByService.map((d) => ({ label: d.service, value: d.count, color: d.color }))}
                  />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold mb-4">Receita por Serviço</h2>
              <div className="flex items-center gap-6 flex-wrap">
                <DonutChart
                  data={(stats.revenueByService || []).map((d) => ({ label: d.service, value: d.value, color: d.color }))}
                  centerLabel="receita"
                  formatTotal={(t) => formatCurrency(t)}
                />
                <div className="flex-1 min-w-[160px]">
                  <DonutLegend
                    data={(stats.revenueByService || []).map((d) => ({ label: d.service, value: d.value, color: d.color }))}
                    formatValue={(v) => formatCurrency(v)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Leads Recentes */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold mb-4">Leads Recentes</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border">
                    <th className="pb-3 font-medium">Nome</th>
                    <th className="pb-3 font-medium">Telefone</th>
                    <th className="pb-3 font-medium">Serviços</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentLeads.map((lead: any) => (
                    <tr key={lead.id} className="border-b border-border last:border-0">
                      <td className="py-3 font-medium">
                        <Link href={`/crm/leads/${lead.id}`} className="text-primary hover:underline">
                          {lead.name}
                        </Link>
                      </td>
                      <td className="py-3">{lead.phone}</td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-1">
                          {lead.services && lead.services.length > 0 ? (
                            lead.services.map((ls: any) => (
                              <span
                                key={ls.service.id}
                                className="px-2 py-0.5 rounded-full text-[10px] font-medium text-white"
                                style={{ backgroundColor: ls.service.color }}
                              >
                                {ls.service.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3">
                        <StatusBadge status={lead.status} />
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {new Date(lead.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                    </tr>
                  ))}
                  {stats.recentLeads.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-muted-foreground">
                        Nenhum lead encontrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatsCard({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
}: {
  title: string;
  value: string;
  icon: any;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold mt-2">{value}</p>
        </div>
        <div className={`${bgColor} p-3 rounded-lg`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLeadStatusColor(status)}`}>
      {getLeadStatusLabel(status)}
    </span>
  );
}
