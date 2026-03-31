"use client";

import { useEffect, useState } from "react";
import { useServiceFilter } from "@/lib/hooks/use-service-filter";
import { formatCurrency } from "@/lib/utils";
import { GripVertical, Tag } from "lucide-react";

export default function PipelinePage() {
  const { activeService } = useServiceFilter();
  const [pipeline, setPipeline] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [draggedDeal, setDraggedDeal] = useState<any>(null);

  async function fetchPipeline() {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeService !== "all") params.set("service", activeService);
    const res = await fetch(`/api/pipeline?${params}`);
    const data = await res.json();
    setPipeline(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchPipeline();
  }, [activeService]);

  async function handleDrop(stageId: string) {
    if (!draggedDeal || draggedDeal.stageId === stageId) {
      setDraggedDeal(null);
      return;
    }

    await fetch(`/api/deals/${draggedDeal.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stageId }),
    });

    setDraggedDeal(null);
    fetchPipeline();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!pipeline || !pipeline.stages) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum pipeline encontrado. Execute o seed para criar o pipeline.
      </div>
    );
  }

  const totalDeals = pipeline.stages.reduce(
    (sum: number, s: any) => sum + s.deals.length,
    0
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pipeline Comercial</h1>
          <p className="text-sm text-muted-foreground">
            {totalDeals} deal{totalDeals !== 1 ? "s" : ""} no pipeline
            {activeService !== "all" && " (filtrado)"}
          </p>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4">
        {pipeline.stages.map((stage: any) => (
          <div
            key={stage.id}
            className="min-w-[280px] bg-muted/50 rounded-xl p-3"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(stage.id)}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: stage.color }}
                />
                <h3 className="text-sm font-semibold">{stage.name}</h3>
              </div>
              <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-full">
                {stage.deals.length}
              </span>
            </div>

            <div className="space-y-2">
              {stage.deals.map((deal: any) => (
                <div
                  key={deal.id}
                  draggable
                  onDragStart={() => setDraggedDeal(deal)}
                  className="bg-card rounded-lg border border-border p-3 cursor-grab active:cursor-grabbing hover:shadow-sm transition"
                >
                  <div className="flex items-start gap-2">
                    <GripVertical className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {deal.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {deal.lead.name}
                      </p>

                      {/* Service tags */}
                      {deal.lead.services && deal.lead.services.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {deal.lead.services.map((ls: any) => (
                            <span
                              key={ls.service.id}
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium text-white"
                              style={{
                                backgroundColor: ls.service.color,
                              }}
                            >
                              <Tag className="w-2.5 h-2.5" />
                              {ls.service.name}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-2">
                        {deal.value ? (
                          <span className="text-xs font-semibold text-green-600">
                            {formatCurrency(deal.value)}
                          </span>
                        ) : (
                          <span />
                        )}
                        {deal.assignedTo && (
                          <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                            {deal.assignedTo.name.charAt(0)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {stage.deals.length === 0 && (
                <div className="text-center py-4 text-xs text-muted-foreground">
                  Nenhum deal
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
