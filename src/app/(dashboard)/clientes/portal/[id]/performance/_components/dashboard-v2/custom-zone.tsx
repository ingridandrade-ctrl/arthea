import { Plus } from "lucide-react";

// Camada 3 — métricas custom escolhidas manualmente pelo admin pra este cliente.
// Placeholder até PR 5 (seletor + persistência em ClientDashboardConfig.customMetrics).
export function CustomZone() {
  return (
    <div className="bg-card border border-dashed border-border rounded-2xl p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
        <div>
          <h3 className="text-[15px] font-semibold text-foreground tracking-tight">
            Extras deste cliente
          </h3>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Métricas escolhidas manualmente · 40+ opções disponíveis
          </p>
        </div>
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-foreground/40 text-background rounded-full text-[13px] font-medium cursor-not-allowed opacity-60"
          title="Chega no PR 5"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2} />
          Adicionar métrica
        </button>
      </div>
      <div className="text-[11.5px] text-muted-foreground text-center py-8">
        Seletor de métricas custom chega no PR 5.
      </div>
    </div>
  );
}
