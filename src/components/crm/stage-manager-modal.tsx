"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, X, Check, AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/modal";

interface Stage {
  id: string;
  name: string;
  order: number;
  color: string;
  leadServiceCount: number;
}

const PRESET_COLORS = [
  "#94a3b8", "#6b7280", "#3b82f6", "#6366f1", "#8b5cf6",
  "#a855f7", "#ec4899", "#ef4444", "#f97316", "#f59e0b",
  "#eab308", "#22c55e", "#14b8a6", "#06b6d4", "#1D7070",
];

interface StageManagerModalProps {
  serviceSlug: string;
  serviceName: string;
  onClose: () => void;
  onChanged?: () => void;
}

export function StageManagerModal({ serviceSlug, serviceName, onClose, onChanged }: StageManagerModalProps) {
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [reordering, setReordering] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Stage | null>(null);
  const [deleting, setDeleting] = useState<Stage | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function fetchStages() {
    setLoading(true);
    const res = await fetch(`/api/pipeline/stages?service=${serviceSlug}`);
    const data = await res.json();
    setStages(data.stages || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchStages();
  }, [serviceSlug]);

  async function moveStage(index: number, dir: "up" | "down") {
    const newStages = [...stages];
    const target = dir === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= newStages.length) return;
    [newStages[index], newStages[target]] = [newStages[target], newStages[index]];
    setStages(newStages);
    setReordering(true);
    await fetch("/api/pipeline/stages/reorder", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stageIds: newStages.map((s) => s.id) }),
    });
    setReordering(false);
    onChanged?.();
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    const res = await fetch(`/api/pipeline/stages/${deleting.id}`, { method: "DELETE" });
    setDeleteLoading(false);
    if (res.ok) {
      setDeleting(null);
      fetchStages();
      onChanged?.();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Erro ao excluir etapa");
    }
  }

  return (
    <Modal title={`Editar etapas — ${serviceName}`} onClose={onClose} maxWidth="max-w-2xl">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Reordene, renomeie, mude cor ou adicione/remova etapas do funil de {serviceName}.
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:opacity-90"
          >
            <Plus className="w-3.5 h-3.5" /> Nova etapa
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
          </div>
        ) : stages.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Nenhuma etapa ainda.
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            {stages.map((stage, idx) => (
              <div
                key={stage.id}
                className="grid grid-cols-[60px_1fr_70px_120px] gap-2 px-3 py-2.5 items-center border-b border-border last:border-b-0 hover:bg-muted/30"
              >
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => moveStage(idx, "up")}
                    disabled={idx === 0 || reordering}
                    className="p-0.5 rounded hover:bg-muted disabled:opacity-20"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => moveStage(idx, "down")}
                    disabled={idx === stages.length - 1 || reordering}
                    className="p-0.5 rounded hover:bg-muted disabled:opacity-20"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: stage.color }} />
                  <span className="text-sm font-medium truncate">{stage.name}</span>
                  <span className="text-[10px] text-muted-foreground">#{idx + 1}</span>
                </div>
                <div className="text-xs text-muted-foreground text-center">
                  {stage.leadServiceCount} {stage.leadServiceCount === 1 ? "lead" : "leads"}
                </div>
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => setEditing(stage)}
                    className="p-1.5 rounded hover:bg-muted"
                    title="Editar"
                  >
                    <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => setDeleting(stage)}
                    className="p-1.5 rounded hover:bg-red-50 hover:text-red-600"
                    title="Excluir"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showAdd && (
          <StageForm
            serviceSlug={serviceSlug}
            mode="create"
            onClose={() => setShowAdd(false)}
            onSaved={() => { setShowAdd(false); fetchStages(); onChanged?.(); }}
          />
        )}

        {editing && (
          <StageForm
            serviceSlug={serviceSlug}
            mode="edit"
            stage={editing}
            onClose={() => setEditing(null)}
            onSaved={() => { setEditing(null); fetchStages(); onChanged?.(); }}
          />
        )}

        {deleting && (
          <Modal title="Excluir etapa" onClose={() => setDeleting(null)}>
            <div className="space-y-4">
              {deleting.leadServiceCount > 0 && (
                <div className="flex gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-900">
                    Essa etapa tem <strong>{deleting.leadServiceCount}</strong> {deleting.leadServiceCount === 1 ? "lead" : "leads"} associado{deleting.leadServiceCount === 1 ? "" : "s"}. Eles ficam sem estágio após a exclusão.
                  </p>
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                Excluir a etapa <strong>{deleting.name}</strong>? Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleting(null)} className="flex-1 px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted">
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
                >
                  {deleteLoading ? "Excluindo..." : "Excluir"}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </Modal>
  );
}

function StageForm({
  serviceSlug,
  mode,
  stage,
  onClose,
  onSaved,
}: {
  serviceSlug: string;
  mode: "create" | "edit";
  stage?: Stage;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(stage?.name || "");
  const [color, setColor] = useState(stage?.color || PRESET_COLORS[3]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    const isEdit = mode === "edit" && stage;
    const url = isEdit ? `/api/pipeline/stages/${stage.id}` : "/api/pipeline/stages";
    const method = isEdit ? "PUT" : "POST";
    const body: any = { name: name.trim(), color };
    if (!isEdit) body.service = serviceSlug;
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) {
      onSaved();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Erro ao salvar");
    }
  }

  return (
    <Modal title={mode === "edit" ? "Editar etapa" : "Nova etapa"} onClose={onClose}>
      <div className="space-y-4">
        {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Nome</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Em negociação"
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-2">Cor</label>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full border-2 transition ${color === c ? "border-foreground scale-110" : "border-transparent hover:scale-105"}`}
                style={{ background: c }}
                aria-label={`Cor ${c}`}
              />
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted">
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={saving || !name.trim()}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
