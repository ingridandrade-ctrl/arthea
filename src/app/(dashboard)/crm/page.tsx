"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { formatCurrency } from "@/lib/utils";
import {
  Users,
  DollarSign,
  TrendingUp,
  BarChart3,
  Clock,
  AlertTriangle,
  Calendar,
  Tag,
  KanbanSquare,
  X,
  ChevronDown,
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

function getPresetLabel(value: string) {
  return DATE_PRESETS.find((p) => p.value === value)?.label || "Tudo";
}

function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    function listener(e: MouseEvent) {
      if (!ref.current || ref.current.contains(e.target as Node)) return;
      handler();
    }
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [ref, handler]);
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeService, setActiveService] = useState("all");
  const [activeStage, setActiveStage] = useState("all");
  const [datePreset, setDatePreset] = useState("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<"date" | "service" | "stage" | null>(null);

  const dateRef = useRef<HTMLDivElement>(null);
  const serviceRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useClickOutside(dateRef, () => { if (openDropdown === "date") setOpenDropdown(null); });
  useClickOutside(serviceRef, () => { if (openDropdown === "service") setOpenDropdown(null); });
  useClickOutside(stageRef, () => { if (openDropdown === "stage") setOpenDropdown(null); });

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((data) => setServices(Array.isArray(data) ? data : []))
      .catch(() => {});
    fetch("/api/pipeline/stages")
      .then((r) => r.json())
      .then((data) => setStages(data?.stages || []))
      .catch(() => {});
  }, []);

  const url = useMemo(() => {
    const params = new URLSearchParams();
    if (activeService !== "all") params.set("service", activeService);
    if (activeStage !== "all") params.set("stage", activeStage);

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
  }, [activeService, activeStage, datePreset, showCustomDate, customFrom, customTo]);

  useEffect(() => {
    setLoading(true);
    fetch(url)
      .then((r) => r.json())
      .then((data) => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [url]);

  const hasFilters = activeService !== "all" || activeStage !== "all" || datePreset !== "all" || showCustomDate;
  const activeServiceName = services.find((s) => s.slug === activeService)?.name;
  const activeStageName = stages.find((s: any) => s.id === activeStage)?.name;
  const dateLabel = showCustomDate
    ? `${customFrom || "..."}${customTo ? ` – ${customTo}` : ""}`
    : getPresetLabel(datePreset);

  function clearFilters() {
    setActiveService("all");
    setActiveStage("all");
    setDatePreset("all");
    setShowCustomDate(false);
    setCustomFrom("");
    setCustomTo("");
    setOpenDropdown(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>

      {/* Filter buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Date dropdown */}
        <div ref={dateRef} className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === "date" ? null : "date")}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition ${
              datePreset !== "all" || showCustomDate
                ? "border-primary bg-primary/5 text-primary"
                : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-border"
            }`}
          >
            <Calendar className="w-4 h-4" />
            {dateLabel}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openDropdown === "date" ? "rotate-180" : ""}`} />
          </button>

          {openDropdown === "date" && (
            <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-50 min-w-[200px] p-2">
              {DATE_PRESETS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => {
                    setDatePreset(p.value);
                    setShowCustomDate(false);
                    setOpenDropdown(null);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                    datePreset === p.value && !showCustomDate
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  {p.label}
                </button>
              ))}
              <div className="border-t border-border mt-1 pt-1">
                <button
                  onClick={() => { setShowCustomDate(true); setDatePreset("custom"); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                    showCustomDate
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  Personalizado
                </button>
                {showCustomDate && (
                  <div className="px-3 py-2 space-y-2">
                    <input
                      type="date"
                      value={customFrom}
                      onChange={(e) => setCustomFrom(e.target.value)}
                      className="w-full px-2 py-1.5 border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="date"
                      value={customTo}
                      onChange={(e) => setCustomTo(e.target.value)}
                      className="w-full px-2 py-1.5 border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Service dropdown */}
        {services.length > 0 && (
          <div ref={serviceRef} className="relative">
            <button
              onClick={() => setOpenDropdown(openDropdown === "service" ? null : "service")}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition ${
                activeService !== "all"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              <Tag className="w-4 h-4" />
              {activeServiceName || "Todos os serviços"}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openDropdown === "service" ? "rotate-180" : ""}`} />
            </button>

            {openDropdown === "service" && (
              <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-50 min-w-[220px] p-2">
                <button
                  onClick={() => { setActiveService("all"); setOpenDropdown(null); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                    activeService === "all"
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  Todos os serviços
                </button>
                {services.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { setActiveService(s.slug); setOpenDropdown(null); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition flex items-center gap-2 ${
                      activeService === s.slug
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                    {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Stage dropdown */}
        {stages.length > 0 && (
          <div ref={stageRef} className="relative">
            <button
              onClick={() => setOpenDropdown(openDropdown === "stage" ? null : "stage")}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition ${
                activeStage !== "all"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              <KanbanSquare className="w-4 h-4" />
              {activeStageName || "Todos os estágios"}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openDropdown === "stage" ? "rotate-180" : ""}`} />
            </button>

            {openDropdown === "stage" && (
              <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-50 min-w-[220px] p-2">
                <button
                  onClick={() => { setActiveStage("all"); setOpenDropdown(null); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                    activeStage === "all"
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  Todos os estágios
                </button>
                {stages.map((s: any) => (
                  <button
                    key={s.id}
                    onClick={() => { setActiveStage(s.id); setOpenDropdown(null); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition flex items-center gap-2 ${
                      activeStage === s.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                    {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Clear filters */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-2.5 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition"
          >
            <X className="w-3.5 h-3.5" />
            Limpar
          </button>
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

          <div>
            {/* Leads por Serviço */}
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Leads por Serviço</h2>
                <span className="text-xs text-muted-foreground">
                  {stats.leadsByService.reduce((s, i) => s + i.count, 0)} total
                </span>
              </div>
              {stats.leadsByService.length > 0 ? (
                <div className="space-y-3">
                  {stats.leadsByService.map((item) => {
                    const max = Math.max(...stats.leadsByService.map((i) => i.count), 1);
                    const pct = (item.count / max) * 100;
                    return (
                      <div key={item.service}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm">{item.service}</span>
                          <span className="text-sm font-semibold">{item.count}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: item.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum lead ainda</p>
              )}
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
