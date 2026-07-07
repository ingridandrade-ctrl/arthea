"use client";

import { useState } from "react";
import {
  Calendar,
  ArrowLeftRight,
  RefreshCw,
  Download,
  ChevronDown,
} from "lucide-react";

export type DateRange =
  | "last_7d"
  | "last_14d"
  | "last_30d"
  | "this_month"
  | "last_month";

const RANGE_LABEL: Record<DateRange, string> = {
  last_7d: "Últimos 7 dias",
  last_14d: "Últimos 14 dias",
  last_30d: "Últimos 30 dias",
  this_month: "Este mês",
  last_month: "Mês passado",
};

export type ComparePeriod = "previous" | "prev_month" | "prev_year" | "none";

const COMPARE_LABEL: Record<ComparePeriod, string> = {
  previous: "vs período anterior",
  prev_month: "vs mês passado",
  prev_year: "vs ano passado",
  none: "sem comparação",
};

export function DashboardTopBar({
  brand,
  subtitle,
  dateRange,
  compare,
  onDateRangeChange,
  onCompareChange,
  onRefresh,
  onExport,
}: {
  brand: string;
  subtitle?: string;
  dateRange: DateRange;
  compare: ComparePeriod;
  onDateRangeChange: (r: DateRange) => void;
  onCompareChange: (c: ComparePeriod) => void;
  onRefresh?: () => void;
  onExport?: () => void;
}) {
  const [rangeOpen, setRangeOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap mb-8">
      {/* Brand + client */}
      <div className="flex items-center gap-3">
        <div
          className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand to-brand/60 text-white flex items-center justify-center font-serif italic text-base leading-none"
          style={{ paddingBottom: 2 }}
        >
          a
        </div>
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="font-semibold text-[15px] tracking-tight text-foreground">{brand}</span>
          {subtitle && (
            <span className="text-muted-foreground text-[13px] font-normal">· {subtitle}</span>
          )}
        </div>
      </div>

      {/* Filters + actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Date range */}
        <div className="relative">
          <button
            type="button"
            onClick={() => { setRangeOpen((o) => !o); setCompareOpen(false); }}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-card border border-border rounded-full text-[13px] font-medium text-foreground/80 hover:text-foreground hover:border-foreground/20 transition"
          >
            <Calendar className="w-3.5 h-3.5 opacity-70" strokeWidth={1.8} />
            {RANGE_LABEL[dateRange]}
            <ChevronDown className="w-2.5 h-2.5" strokeWidth={2.4} />
          </button>
          {rangeOpen && (
            <div className="absolute top-full mt-1.5 right-0 bg-card border border-border rounded-xl shadow-lg z-20 min-w-[200px] py-1">
              {(Object.keys(RANGE_LABEL) as DateRange[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => { onDateRangeChange(r); setRangeOpen(false); }}
                  className={`w-full text-left px-3.5 py-2 text-[13px] hover:bg-muted transition ${
                    r === dateRange ? "text-brand font-medium" : "text-foreground"
                  }`}
                >
                  {RANGE_LABEL[r]}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Compare */}
        <div className="relative">
          <button
            type="button"
            onClick={() => { setCompareOpen((o) => !o); setRangeOpen(false); }}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-semibold transition ${
              compare === "none"
                ? "bg-muted text-muted-foreground border border-border"
                : "bg-brand/10 text-brand border border-brand/25"
            }`}
          >
            <ArrowLeftRight className="w-3 h-3" strokeWidth={2} />
            {COMPARE_LABEL[compare]}
          </button>
          {compareOpen && (
            <div className="absolute top-full mt-1.5 right-0 bg-card border border-border rounded-xl shadow-lg z-20 min-w-[200px] py-1">
              {(Object.keys(COMPARE_LABEL) as ComparePeriod[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { onCompareChange(c); setCompareOpen(false); }}
                  className={`w-full text-left px-3.5 py-2 text-[13px] hover:bg-muted transition ${
                    c === compare ? "text-brand font-medium" : "text-foreground"
                  }`}
                >
                  {COMPARE_LABEL[c]}
                </button>
              ))}
            </div>
          )}
        </div>

        <span className="w-px h-5 bg-border mx-1" />

        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-card border border-border rounded-full text-[13px] font-medium text-foreground/80 hover:text-foreground hover:border-foreground/20 transition"
        >
          <RefreshCw className="w-3.5 h-3.5 opacity-70" strokeWidth={1.8} />
          Atualizar
        </button>
        <button
          type="button"
          onClick={onExport}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-foreground text-background rounded-full text-[13px] font-medium hover:opacity-90 transition"
        >
          <Download className="w-3.5 h-3.5" strokeWidth={1.8} />
          Exportar
        </button>
      </div>
    </div>
  );
}
