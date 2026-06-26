"use client";

import { useEffect, useState } from "react";
import { useServiceFilter } from "@/lib/hooks/use-service-filter";
import { formatCurrency } from "@/lib/utils";
import { GripVertical, Tag, Pencil, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import Link from "next/link";

export default function PipelinePage() {
  const { activeService } = useServiceFilter();
  const [pipeline, setPipeline] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState<any>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deletingItem, setDeletingItem] = useState<any>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

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
    if (!draggedItem || draggedItem.stageId === stageId) {
      setDraggedItem(null);
      return;
    }

    setPipeline((prev: any) => {
      if (!prev) return prev;
      const newStages = prev.stages.map((s: any) => ({
        ...s,
        leadServices: s.id === stageId
          ? [...s.leadServices, { ...draggedItem, stageId }]
          : s.leadServices.filter((ls: any) => ls.id !== draggedItem.id),
      }));
      return { ...prev, stages: newStages };
    });

    setDraggedItem(null);

    await fetch(`/api/deals/${draggedItem.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stageId }),
    });
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

  const totalItems = pipeline.stages.reduce(
    (sum: number, s: any) => sum + (s.leadServices?.length || 0),
    0
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pipeline Comercial</h1>
          <p className="text-sm text-muted-foreground">
            {totalItems} lead{totalItems !== 1 ? "s" : ""} no pipeline
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
                {stage.leadServices?.length || 0}
              </span>
            </div>

            <div className="space-y-2">
              {(stage.leadServices || []).map((ls: any) => (
                <div
                  key={ls.id}
                  draggable
                  onDragStart={() => setDraggedItem(ls)}
                  className="group relative bg-card rounded-lg border border-border p-3 cursor-grab active:cursor-grabbing hover:shadow-sm transition"
                >
                  <div className="absolute top-2 right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingItem(ls); }}
                      className="p-1 rounded hover:bg-muted"
                      title="Editar"
                    >
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeletingItem(ls); }}
                      className="p-1 rounded hover:bg-red-50"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-red-500" />
                    </button>
                  </div>
                  <div className="flex items-start gap-2">
                    <GripVertical className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <Link href={`/crm/leads/${ls.lead.id}`} className="text-sm font-medium truncate pr-14 hover:underline block">
                        {ls.lead.name}
                      </Link>

                      <span
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium text-white mt-1"
                        style={{ backgroundColor: ls.service.color }}
                      >
                        <Tag className="w-2.5 h-2.5" />
                        {ls.service.name}
                      </span>

                      <div className="flex items-center justify-between mt-2">
                        {ls.value ? (
                          <span className="text-xs font-semibold text-green-600">
                            {formatCurrency(ls.value)}
                          </span>
                        ) : (
                          <span />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {(!stage.leadServices || stage.leadServices.length === 0) && (
                <div className="text-center py-4 text-xs text-muted-foreground">
                  Nenhum lead
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {editingItem && (
        <Modal title="Editar" onClose={() => setEditingItem(null)}>
          <EditLeadServiceForm
            item={editingItem}
            onSaved={() => { setEditingItem(null); fetchPipeline(); }}
          />
        </Modal>
      )}

      {deletingItem && (
        <Modal title="Remover do Pipeline" onClose={() => setDeletingItem(null)}>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Remover <strong>{deletingItem.lead?.name}</strong> ({deletingItem.service?.name}) do pipeline?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingItem(null)}
                className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  setDeletingLoading(true);
                  const res = await fetch(`/api/deals/${deletingItem.id}`, { method: "DELETE" });
                  if (res.ok) {
                    setDeletingItem(null);
                    fetchPipeline();
                  } else {
                    alert("Erro ao remover");
                  }
                  setDeletingLoading(false);
                }}
                disabled={deletingLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition disabled:opacity-50"
              >
                {deletingLoading ? "Removendo..." : "Remover"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function EditLeadServiceForm({ item, onSaved }: { item: any; onSaved: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);

    const res = await fetch(`/api/deals/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        value: fd.get("value") ? parseFloat(fd.get("value") as string) : null,
      }),
    });

    if (!res.ok) {
      setError("Erro ao salvar");
      setLoading(false);
      return;
    }

    onSaved();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>}

      <div className="bg-muted/50 rounded-lg p-3">
        <p className="text-xs text-muted-foreground">Lead</p>
        <p className="text-sm font-medium">{item.lead?.name}</p>
      </div>

      <div className="bg-muted/50 rounded-lg p-3">
        <p className="text-xs text-muted-foreground">Serviço</p>
        <p className="text-sm font-medium">{item.service?.name}</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Valor (R$)</label>
        <input name="value" type="number" step="0.01" defaultValue={item.value || ""} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
      </div>

      <button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:opacity-90 transition disabled:opacity-50">
        {loading ? "Salvando..." : "Salvar"}
      </button>
    </form>
  );
}
