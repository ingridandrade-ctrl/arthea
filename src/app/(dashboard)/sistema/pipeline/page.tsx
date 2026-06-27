"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  GripVertical,
  Pencil,
  Trash2,
  X,
  Check,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
} from "lucide-react";
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

export default function PipelineSettingsPage() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [pipelineName, setPipelineName] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStage, setEditingStage] = useState<Stage | null>(null);
  const [deletingStage, setDeletingStage] = useState<Stage | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);
  const [reordering, setReordering] = useState(false);

  async function fetchStages() {
    setLoading(true);
    const res = await fetch("/api/pipeline/stages");
    const data = await res.json();
    setStages(data.stages || []);
    setPipelineName(data.pipeline?.name || "Pipeline Comercial");
    setLoading(false);
  }

  useEffect(() => {
    fetchStages();
  }, []);

  async function moveStage(index: number, direction: "up" | "down") {
    const newStages = [...stages];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newStages.length) return;

    [newStages[index], newStages[targetIndex]] = [newStages[targetIndex], newStages[index]];
    setStages(newStages);
    setReordering(true);

    await fetch("/api/pipeline/stages/reorder", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stageIds: newStages.map((s) => s.id) }),
    });
    setReordering(false);
  }

  async function handleDelete() {
    if (!deletingStage) return;
    setDeletingLoading(true);
    const res = await fetch(`/api/pipeline/stages/${deletingStage.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setDeletingStage(null);
      fetchStages();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Erro ao excluir fase");
    }
    setDeletingLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fases do Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gerencie as fases do <strong>{pipelineName}</strong>. Reordene, renomeie ou adicione novas fases.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" />
          Nova Fase
        </button>
      </div>

      {/* Stage List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="px-4 py-12 text-center text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          </div>
        ) : stages.length === 0 ? (
          <div className="px-4 py-12 text-center text-muted-foreground">
            <p className="font-medium">Nenhuma fase configurada</p>
            <p className="text-sm mt-1">Adicione fases para montar seu pipeline</p>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="grid grid-cols-[40px_1fr_100px_80px_120px] gap-3 px-4 py-3 bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <span />
              <span>Fase</span>
              <span className="text-center">Cor</span>
              <span className="text-center">Servicos</span>
              <span className="text-right">Ações</span>
            </div>

            {/* Rows */}
            {stages.map((stage, index) => (
              <div
                key={stage.id}
                className="grid grid-cols-[40px_1fr_100px_80px_120px] gap-3 px-4 py-3 items-center border-t border-gray-100 hover:bg-gray-50 transition"
              >
                {/* Order controls */}
                <div className="flex flex-col items-center gap-0.5">
                  <button
                    onClick={() => moveStage(index, "up")}
                    disabled={index === 0 || reordering}
                    className="p-0.5 rounded hover:bg-muted disabled:opacity-20 transition"
                    title="Mover para cima"
                  >
                    <ArrowUp className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                  <button
                    onClick={() => moveStage(index, "down")}
                    disabled={index === stages.length - 1 || reordering}
                    className="p-0.5 rounded hover:bg-muted disabled:opacity-20 transition"
                    title="Mover para baixo"
                  >
                    <ArrowDown className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                </div>

                {/* Name */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: stage.color }}
                  />
                  <span className="text-sm font-medium">{stage.name}</span>
                  <span className="text-xs text-muted-foreground">#{index + 1}</span>
                </div>

                {/* Color */}
                <div className="flex justify-center">
                  <span
                    className="inline-block px-2.5 py-1 rounded-md text-[10px] font-mono text-white"
                    style={{ backgroundColor: stage.color }}
                  >
                    {stage.color}
                  </span>
                </div>

                {/* Service count */}
                <div className="text-center">
                  <span className={`text-sm font-medium ${stage.leadServiceCount > 0 ? "text-foreground" : "text-muted-foreground"}`}>
                    {stage.leadServiceCount}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => setEditingStage(stage)}
                    className="p-1.5 rounded-lg hover:bg-muted transition"
                    title="Editar"
                  >
                    <Pencil className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                  </button>
                  <button
                    onClick={() => setDeletingStage(stage)}
                    className="p-1.5 rounded-lg hover:bg-red-50 transition"
                    title="Excluir"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pipeline preview */}
      {stages.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Pré-visualização</h2>
          <div className="flex gap-1 overflow-x-auto pb-2">
            {stages.map((stage, i) => (
              <div
                key={stage.id}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-xs font-medium whitespace-nowrap"
                style={{ backgroundColor: stage.color }}
              >
                <span className="opacity-70">{i + 1}.</span>
                {stage.name}
                {i < stages.length - 1 && (
                  <span className="opacity-50 ml-1">→</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Stage Modal */}
      {showAddForm && (
        <Modal title="Nova Fase" onClose={() => setShowAddForm(false)}>
          <StageForm
            onSaved={() => {
              setShowAddForm(false);
              fetchStages();
            }}
          />
        </Modal>
      )}

      {/* Edit Stage Modal */}
      {editingStage && (
        <Modal title="Editar Fase" onClose={() => setEditingStage(null)}>
          <StageForm
            stage={editingStage}
            onSaved={() => {
              setEditingStage(null);
              fetchStages();
            }}
          />
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deletingStage && (
        <Modal title="Excluir Fase" onClose={() => setDeletingStage(null)}>
          <div className="space-y-4">
            {deletingStage.leadServiceCount > 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Não é possível excluir</p>
                  <p className="mt-0.5">
                    Existem <strong>{deletingStage.leadServiceCount} servico(s)</strong> nesta fase.
                    Mova os servicos para outra fase antes de excluir.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Tem certeza que deseja excluir a fase <strong>{deletingStage.name}</strong>?
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingStage(null)}
                className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition"
              >
                {deletingStage.leadServiceCount > 0 ? "Entendi" : "Cancelar"}
              </button>
              {deletingStage.leadServiceCount === 0 && (
                <button
                  onClick={handleDelete}
                  disabled={deletingLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition disabled:opacity-50"
                >
                  {deletingLoading ? "Excluindo..." : "Excluir"}
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function StageForm({ stage, onSaved }: { stage?: Stage; onSaved: () => void }) {
  const [name, setName] = useState(stage?.name || "");
  const [color, setColor] = useState(stage?.color || "#6366f1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Nome é obrigatório");
      return;
    }
    setLoading(true);
    setError("");

    const url = stage
      ? `/api/pipeline/stages/${stage.id}`
      : "/api/pipeline/stages";

    const res = await fetch(url, {
      method: stage ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), color }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Erro ao salvar");
      setLoading(false);
      return;
    }

    onSaved();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>}

      <div>
        <label className="block text-sm font-medium mb-1">Nome da Fase</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Proposta Enviada"
          required
          className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Cor</label>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-lg transition-all ${
                color === c ? "ring-2 ring-offset-2 ring-primary scale-110" : "hover:scale-105"
              }`}
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border-0"
          />
          <input
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-24 px-2 py-1 border border-border rounded text-xs font-mono"
            placeholder="#6366f1"
          />
          <div
            className="flex-1 h-8 rounded-lg flex items-center justify-center text-white text-xs font-medium"
            style={{ backgroundColor: color }}
          >
            {name || "Pré-visualização"}
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
      >
        {loading ? "Salvando..." : stage ? "Salvar Alterações" : "Criar Fase"}
      </button>
    </form>
  );
}
