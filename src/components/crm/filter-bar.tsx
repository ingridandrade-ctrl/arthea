"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar, Filter, ChevronDown, X } from "lucide-react";

export interface FilterService {
  id: string;
  name: string;
  slug: string;
  color: string;
}

export type DatePreset = "all" | "today" | "7d" | "30d" | "month" | "year" | "custom";

export const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: "all", label: "Todas as datas" },
  { value: "today", label: "Hoje" },
  { value: "7d", label: "Últimos 7 dias" },
  { value: "30d", label: "Últimos 30 dias" },
  { value: "month", label: "Este mês" },
  { value: "year", label: "Este ano" },
  { value: "custom", label: "Personalizado" },
];

export function getDateRange(preset: DatePreset, customFrom?: string, customTo?: string): { from: string; to: string } | null {
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
    case "custom":
      if (!customFrom) return null;
      return { from: customFrom, to: customTo || customFrom };
    default:
      return null;
  }
}

interface FilterBarProps {
  services: FilterService[];
  activeService: string;
  onServiceChange: (slug: string) => void;
  datePreset: DatePreset;
  onDatePresetChange: (preset: DatePreset) => void;
  customFrom: string;
  customTo: string;
  onCustomChange: (from: string, to: string) => void;
  extra?: React.ReactNode;
}

function useOutside(ref: React.RefObject<HTMLDivElement | null>, fn: () => void) {
  useEffect(() => {
    function listener(e: MouseEvent) {
      if (!ref.current || ref.current.contains(e.target as Node)) return;
      fn();
    }
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [ref, fn]);
}

export function FilterBar({
  services,
  activeService,
  onServiceChange,
  datePreset,
  onDatePresetChange,
  customFrom,
  customTo,
  onCustomChange,
  extra,
}: FilterBarProps) {
  const [openSvc, setOpenSvc] = useState(false);
  const [openDate, setOpenDate] = useState(false);
  const svcRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);
  useOutside(svcRef, () => setOpenSvc(false));
  useOutside(dateRef, () => setOpenDate(false));

  const activeSvc = services.find((s) => s.slug === activeService);
  const svcLabel = activeService === "all" ? "Todos os serviços" : activeSvc?.name || activeService;
  const svcColor = activeService === "all" ? "#94a3b8" : activeSvc?.color || "#94a3b8";

  const dateLabel =
    datePreset === "custom"
      ? customFrom
        ? `${formatBR(customFrom)}${customTo ? ` – ${formatBR(customTo)}` : ""}`
        : "Personalizado"
      : DATE_PRESETS.find((p) => p.value === datePreset)?.label || "Todas as datas";

  const hasFilters = activeService !== "all" || datePreset !== "all";

  function clearAll() {
    onServiceChange("all");
    onDatePresetChange("all");
    onCustomChange("", "");
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Service */}
      <div className="relative" ref={svcRef}>
        <button
          onClick={() => { setOpenSvc(!openSvc); setOpenDate(false); }}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition ${
            activeService !== "all"
              ? "bg-card border-primary/40"
              : "bg-card border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="w-2 h-2 rounded-full" style={{ background: svcColor }} />
          {svcLabel}
          <ChevronDown className="w-3.5 h-3.5 opacity-60" />
        </button>
        {openSvc && (
          <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 min-w-[220px] py-1">
            <button
              onClick={() => { onServiceChange("all"); setOpenSvc(false); }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition flex items-center gap-2 ${activeService === "all" ? "font-semibold" : ""}`}
            >
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              Todos os serviços
            </button>
            <div className="border-t border-border my-1" />
            {services.map((s) => (
              <button
                key={s.id}
                onClick={() => { onServiceChange(s.slug); setOpenSvc(false); }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition flex items-center gap-2 ${activeService === s.slug ? "font-semibold" : ""}`}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                {s.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Date */}
      <div className="relative" ref={dateRef}>
        <button
          onClick={() => { setOpenDate(!openDate); setOpenSvc(false); }}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition ${
            datePreset !== "all"
              ? "bg-card border-primary/40"
              : "bg-card border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          {dateLabel}
          <ChevronDown className="w-3.5 h-3.5 opacity-60" />
        </button>
        {openDate && (
          <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 min-w-[220px] py-1">
            {DATE_PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => {
                  onDatePresetChange(p.value);
                  if (p.value !== "custom") setOpenDate(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition ${datePreset === p.value ? "font-semibold" : ""}`}
              >
                {p.label}
              </button>
            ))}
            {datePreset === "custom" && (
              <div className="px-3 py-2 border-t border-border space-y-2">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground">De</label>
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => onCustomChange(e.target.value, customTo)}
                    className="w-full px-2 py-1 border border-border rounded text-sm bg-card focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Até</label>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => onCustomChange(customFrom, e.target.value)}
                    className="w-full px-2 py-1 border border-border rounded text-sm bg-card focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {extra}

      {hasFilters && (
        <button
          onClick={clearAll}
          className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition"
          title="Limpar filtros"
        >
          <X className="w-3.5 h-3.5" />
          Limpar
        </button>
      )}
    </div>
  );
}

function formatBR(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
