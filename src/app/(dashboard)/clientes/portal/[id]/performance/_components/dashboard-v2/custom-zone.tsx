"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Settings2 } from "lucide-react";
import {
  METRIC_BY_ID,
  formatMetric,
  type MetricDef,
} from "@/lib/meta/metrics-catalog";
import type { MetaFullSummary } from "./use-dashboard-data";

// Camada 3 — métricas custom escolhidas pelo admin em /config-dashboard.
// Lê ClientDashboardConfig.customMetrics (array de ids do catálogo) e
// renderiza um tile por métrica selecionada, tirando o valor do summary.
export function CustomZone({
  engagementId,
  summary,
  showConfigLink,
}: {
  engagementId: string;
  summary: MetaFullSummary;
  showConfigLink?: boolean;
}) {
  const [ids, setIds] = useState<string[] | null>(null);

  useEffect(() => {
    fetch(`/api/portal/dashboard-config?engagementId=${engagementId}`)
      .then((r) => r.json())
      .then((data) => {
        const m = Array.isArray(data?.customMetrics) ? data.customMetrics : [];
        setIds(m as string[]);
      })
      .catch(() => setIds([]));
  }, [engagementId]);

  const chosen: MetricDef[] =
    ids?.map((id) => METRIC_BY_ID[id]).filter(Boolean) || [];

  return (
    <div className="bg-card border border-dashed border-border rounded-2xl p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
        <div>
          <h3 className="text-[15px] font-semibold text-foreground tracking-tight">
            Extras deste cliente
          </h3>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Métricas escolhidas manualmente · até 12 · reordena conforme o cliente
          </p>
        </div>
        {showConfigLink && (
          <Link
            href={`/clientes/portal/${engagementId}/config-dashboard`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-foreground text-background rounded-full text-[12.5px] font-medium hover:opacity-90 transition"
          >
            {chosen.length === 0 ? (
              <>
                <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                Adicionar métrica
              </>
            ) : (
              <>
                <Settings2 className="w-3.5 h-3.5" strokeWidth={2} />
                Editar seleção
              </>
            )}
          </Link>
        )}
      </div>

      {ids === null ? (
        <div className="text-[12px] text-muted-foreground text-center py-8">Carregando…</div>
      ) : chosen.length === 0 ? (
        <div className="text-[12px] text-muted-foreground text-center py-8">
          Nenhuma métrica extra selecionada.{" "}
          {showConfigLink && (
            <>
              Vá em{" "}
              <Link
                href={`/clientes/portal/${engagementId}/config-dashboard`}
                className="text-brand hover:underline"
              >
                configurar
              </Link>{" "}
              pra escolher.
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {chosen.map((m) => {
            const value = (summary as any)[m.id] as number;
            return (
              <div
                key={m.id}
                className="bg-cream rounded-2xl p-4"
              >
                <div className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground font-semibold">
                  {m.label}
                </div>
                <div className="text-[26px] font-semibold text-foreground leading-none mt-1 tabular-nums tracking-[-0.02em]">
                  {formatMetric(value ?? 0, m.unit)}
                </div>
                <div className="text-[10.5px] text-muted-foreground mt-1.5 leading-tight">
                  {m.desc}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
