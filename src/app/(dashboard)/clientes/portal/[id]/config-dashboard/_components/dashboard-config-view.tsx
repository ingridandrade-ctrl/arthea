"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Save, Search, X, RotateCcw } from "lucide-react";
import {
  META_METRICS,
  METRIC_GROUP_LABEL,
  type MetricGroup,
  type MetricDef,
} from "@/lib/meta/metrics-catalog";

const MAX_CUSTOM = 12;

export function DashboardConfigView({
  engagementId,
  initialSelected,
}: {
  engagementId: string;
  initialSelected: string[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected));
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const grouped = useMemo(() => {
    const byGroup = new Map<MetricGroup, MetricDef[]>();
    for (const m of META_METRICS) {
      if (query && !`${m.label} ${m.desc}`.toLowerCase().includes(query.toLowerCase())) continue;
      const arr = byGroup.get(m.group) || [];
      arr.push(m);
      byGroup.set(m.group, arr);
    }
    return byGroup;
  }, [query]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= MAX_CUSTOM) return prev;
        next.add(id);
      }
      return next;
    });
  }

  function reset() {
    setSelected(new Set(initialSelected));
  }

  function clearAll() {
    setSelected(new Set());
  }

  async function save() {
    setSaving(true);
    await fetch("/api/portal/dashboard-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        engagementId,
        customMetrics: Array.from(selected),
      }),
    });
    setSaving(false);
    setSavedAt(new Date().toLocaleTimeString("pt-BR"));
    router.refresh();
  }

  const selectedCount = selected.size;
  const dirty =
    selectedCount !== initialSelected.length ||
    Array.from(selected).some((id) => !initialSelected.includes(id));

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground"
            strokeWidth={1.8}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar métrica…"
            className="w-full pl-9 pr-3 py-2 border border-border rounded-full bg-card text-[13px] focus:outline-none focus:border-brand"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-muted-foreground">
            <strong className={`${selectedCount === MAX_CUSTOM ? "text-warning" : "text-foreground"} font-semibold`}>
              {selectedCount}
            </strong>
            {" / "}
            {MAX_CUSTOM} selecionadas
          </span>
          {selectedCount > 0 && (
            <button
              onClick={clearAll}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-[12px] text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition"
            >
              <X className="w-3 h-3" strokeWidth={2} />
              Limpar
            </button>
          )}
          {dirty && (
            <button
              onClick={reset}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-[12px] text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition"
            >
              <RotateCcw className="w-3 h-3" strokeWidth={2} />
              Desfazer
            </button>
          )}
          <button
            onClick={save}
            disabled={!dirty || saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-foreground text-background rounded-full text-[13px] font-medium hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save className="w-3.5 h-3.5" strokeWidth={2} />
            {saving ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </div>

      {savedAt && !dirty && (
        <div className="text-[12px] text-success mb-4">Salvo às {savedAt}</div>
      )}

      {/* Groups */}
      <div className="space-y-6">
        {Array.from(grouped.entries()).map(([group, metrics]) => (
          <div key={group}>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-2">
              {METRIC_GROUP_LABEL[group]}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {metrics.map((m) => {
                const isSel = selected.has(m.id);
                const disabled = !isSel && selectedCount >= MAX_CUSTOM;
                return (
                  <button
                    key={m.id}
                    onClick={() => toggle(m.id)}
                    disabled={disabled}
                    className={`relative text-left p-3 rounded-xl border transition ${
                      isSel
                        ? "bg-brand/8 border-brand text-foreground shadow-sm"
                        : disabled
                          ? "bg-card border-border opacity-40 cursor-not-allowed"
                          : "bg-card border-border hover:border-brand/40 text-foreground"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-medium leading-tight">{m.label}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                          {m.desc}
                        </div>
                      </div>
                      {isSel && (
                        <div className="w-5 h-5 rounded-md bg-brand text-white flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3" strokeWidth={2.5} />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {grouped.size === 0 && (
        <div className="text-center py-16 text-muted-foreground text-sm">
          Nenhuma métrica corresponde a "{query}".
        </div>
      )}
    </div>
  );
}
