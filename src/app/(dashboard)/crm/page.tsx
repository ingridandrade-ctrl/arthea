"use client";

import { useEffect, useState, useMemo } from "react";
import { formatCurrency } from "@/lib/utils";
import {
  Users,
  DollarSign,
  TrendingUp,
  BarChart3,
  Clock,
  AlertTriangle,
  Filter,
  Calendar,
  X,
} from "lucide-react";
import type { DashboardStats } from "@/types";

const DATE_PRESETS = [
  { label: "Hoje", value: "today" },
  { label: "Últimos 7 dias", value: "7d" },
  { label: "Últimos 30 dias", value: "30d" },
  { label: "Este mês", value: "month" },
  { label: "Este ano", value: "year" },
  { label: "Tudo", value: "all" },
];

function getDateRange(preset: string): { from: string; to: string } | null {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0];

  switch (preset) {
    case "today":
      return { from: fmt(now), to: fmt(now) };
    case "7d": {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return { from: fmt(d), to: fmt(now) };
    }
    case "30d": {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      return { from: fmt(d), to: fmt(now) };
    }
    case "month": {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: fmt(d), to: fmt(now) };
    }
    case "year": {
      const d = new Date(now.getFullYear(), 0, 1);
      return { from: fmt(d), to: fmt(now) };
    }
    default:
      return null;
  }
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeService, setActiveService] = useState("all");
  const [datePreset, setDatePreset] = useState("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [showCustomDate, setShowCustomDate] = useState(false);

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((data) => setServices(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const url = useMemo(() => {
    const params = new URLSearchParams();
    if (activeService !== "all") params.set("service", activeService);

    if (showCustomDate && customFrom) {
      params.set("from", customFrom);
      if (customTo) params.set("to", customTo);
    } else if (datePreset !== "all") {
      const range = getDateRange(datePreset);
      if (range) {
        params.set("from", range.from);
        params.set("to", range.to);
      }
    }

    const qs = params.toString();
    return `/api/dashboard/stats${qs ? `?${qs}` : ""}`;
  }, [activeService, datePreset, showCustomDate, customFrom, customTo]);

  useEffect(() => {
    setLoading(true);
    fetch(url)
      .then((r) => r.json())
      .then((data) => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [url]);

  const hasFilters = activeService !== "all" || datePreset !== "all" || showCustomDate;

  function clearFilters() {
    setActiveService("all");
    setDatePreset("all");
    setShowCustomDate(false);
    setCustomFrom("");
    setCustomTo("");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
          >
            <X className="w-3.5 h-3.5" />
            Limpar filtros
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Filter className="w-4 h-4" />
          Filtros
        </div>

        {/* Date filter */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            Período
          </p>
          <div className="flex flex-wrap gap-1.5">
            {DATE_PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => { setDatePreset(p.value); setShowCustomDate(false); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  datePreset === p.value && !showCustomDate
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
            <button
              onClick={() => { setShowCustomDate(true); setDatePreset("custom"); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                showCustomDate
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              Personalizado
            </button>
          </div>
          {showCustomDate && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="px-2 py-1.5 border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="text-xs text-muted-foreground">até</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="px-2 py-1.5 border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}
        </div>

        {/* Service filter */}
        {services.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Serviço</p>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setActiveService("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  activeService === "all"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                Todos
              </button>
              {services.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveService(s.slug)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeService === s.slug
                      ? "text-white"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                  style={activeService === s.slug ? { backgroundColor: s.color } : undefined}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {loading || !stats ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatsCard title="Total de Leads" value={stats.totalLeads.toString()} icon={Users} color="text-blue-600" bgColor="bg-blue-50" />
            <StatsCard title="Total de Deals" value={stats.totalDeals.toString()} icon={BarChart3} color="text-purple-600" bgColor="bg-purple-50" />
            <StatsCard title="Receita Total" value={formatCurrency(stats.totalRevenue)} icon={DollarSign} color="text-green-600" bgColor="bg-green-50" />
            <StatsCard title="Taxa de Conversão" value={`${stats.conversionRate}%`} icon={TrendingUp} color="text-orange-600" bgColor="bg-orange-50" />
            <StatsCard title="Follow-ups Hoje" value={stats.pendingFollowUpsToday.toString()} icon={Clock} color="text-indigo-600" bgColor="bg-indigo-50" alert={stats.pendingFollowUpsToday > 0} />
            <StatsCard title="Leads Esquecidos" value={stats.staleLeadsCount.toString()} icon={AlertTriangle} color="text-red-600" bgColor="bg-red-50" alert={stats.staleLeadsCount > 0} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Leads por Serviço */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold mb-4">Leads por Serviço</h2>
              <div className="space-y-3">
                {stats.leadsByService.map((item) => (
                  <div key={item.service} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
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
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
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
                    <th className="pb-3 font-medium">Serviços</th>
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
  alert,
}: {
  title: string;
  value: string;
  icon: any;
  color: string;
  bgColor: string;
  alert?: boolean;
}) {
  return (
    <div className={`bg-card rounded-xl border p-4 ${alert ? "border-orange-300" : "border-border"}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="text-xl font-bold mt-1">{value}</p>
        </div>
        <div className={`${bgColor} p-2 rounded-lg`}>
          <Icon className={`w-5 h-5 ${color}`} />
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
