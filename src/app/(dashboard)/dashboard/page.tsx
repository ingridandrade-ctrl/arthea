"use client";

import { useEffect, useState } from "react";
import { useServiceFilter } from "@/lib/hooks/use-service-filter";
import { formatCurrency } from "@/lib/utils";
import {
  Users,
  DollarSign,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import type { DashboardStats } from "@/types";

export default function DashboardPage() {
  const { activeService } = useServiceFilter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      const res = await fetch(
        `/api/dashboard/stats?service=${activeService}`
      );
      const data = await res.json();
      setStats(data);
      setLoading(false);
    }
    fetchStats();
  }, [activeService]);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total de Leads"
          value={stats.totalLeads.toString()}
          icon={Users}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatsCard
          title="Total de Deals"
          value={stats.totalDeals.toString()}
          icon={BarChart3}
          color="text-purple-600"
          bgColor="bg-purple-50"
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads por Serviço */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">Leads por Serviço</h2>
          <div className="space-y-3">
            {stats.leadsByService.map((item) => (
              <div key={item.service} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm">{item.service}</span>
                </div>
                <span className="text-sm font-semibold">{item.count}</span>
              </div>
            ))}
            {stats.leadsByService.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum lead ainda</p>
            )}
          </div>
        </div>

        {/* Deals por Estágio */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">Deals por Estágio</h2>
          <div className="space-y-3">
            {stats.dealsByStage.map((item) => (
              <div key={item.stage} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm">{item.stage}</span>
                </div>
                <span className="text-sm font-semibold">{item.count}</span>
              </div>
            ))}
            {stats.dealsByStage.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum deal ainda</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Leads */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">Leads Recentes</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="pb-3 font-medium">Nome</th>
                <th className="pb-3 font-medium">Telefone</th>
                <th className="pb-3 font-medium">Serviço</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Data</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentLeads.map((lead: any) => (
                <tr key={lead.id} className="border-b border-border last:border-0">
                  <td className="py-3 font-medium">{lead.name}</td>
                  <td className="py-3">{lead.phone}</td>
                  <td className="py-3">
                    {lead.service ? (
                      <span
                        className="px-2 py-1 rounded-full text-xs text-white"
                        style={{ backgroundColor: lead.service.color }}
                      >
                        {lead.service.name}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
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
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className={`${bgColor} p-3 rounded-lg`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    NEW: "bg-blue-100 text-blue-700",
    CONTACTED: "bg-yellow-100 text-yellow-700",
    QUALIFIED: "bg-green-100 text-green-700",
    UNQUALIFIED: "bg-red-100 text-red-700",
  };

  const labels: Record<string, string> = {
    NEW: "Novo",
    CONTACTED: "Contatado",
    QUALIFIED: "Qualificado",
    UNQUALIFIED: "Desqualificado",
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || ""}`}>
      {labels[status] || status}
    </span>
  );
}
