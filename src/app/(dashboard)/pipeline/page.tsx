"use client";

import { useEffect, useState } from "react";
import { useServiceFilter } from "@/lib/hooks/use-service-filter";
import { formatCurrency } from "@/lib/utils";
import { GripVertical } from "lucide-react";

export default function PipelinePage() {
  const { activeService } = useServiceFilter();
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedDeal, setDraggedDeal] = useState<any>(null);

  async function fetchPipelines() {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeService !== "all") params.set("service", activeService);
    const res = await fetch(`/api/pipeline?${params}`);
    const data = await res.json();
    setPipelines(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchPipelines();
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
    fetchPipelines();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pipeline</h1>

      {pipelines.map((pipeline) => (
        <div key={pipeline.id}>
          <div className="flex items-center gap-2 mb-3">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: pipeline.service.color }}
            />
            <h2 className="text-lg font-semibold">{pipeline.name}</h2>
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
                          <p className="text-sm font-medium truncate">{deal.title}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {deal.lead.name}
                          </p>
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
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {pipelines.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum pipeline encontrado
        </div>
      )}
    </div>
  );
}
