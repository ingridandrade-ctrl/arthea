"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  Edit3,
  Check,
  X,
  ToggleLeft,
  ToggleRight,
  Zap,
  Bell,
} from "lucide-react";

const STAGE_NAMES: Record<number, string> = {
  0: "Novo Lead",
  1: "Em Contato",
  2: "Briefing Realizado",
  3: "Proposta Enviada",
  4: "Negociação",
  5: "Fechado Ganho",
  6: "Fechado Perdido",
};

const STAGE_COLORS: Record<number, string> = {
  0: "#94a3b8",
  1: "#3b82f6",
  2: "#8b5cf6",
  3: "#f59e0b",
  4: "#f97316",
  5: "#22c55e",
  6: "#ef4444",
};

const VARIABLES = [
  { key: "{{nome}}", label: "Nome do lead" },
  { key: "{{servico}}", label: "Serviço(s)" },
  { key: "{{empresa}}", label: "Empresa" },
  { key: "{{telefone}}", label: "Telefone" },
  { key: "{{email}}", label: "Email" },
];

interface Template {
  id: string;
  name: string;
  stageOrder: number;
  followUpOrder: number;
  channel: string;
  messageTemplate: string;
  isAutomatic: boolean;
  isActive: boolean;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Template>>({});

  async function fetchTemplates() {
    setLoading(true);
    const res = await fetch("/api/followup-templates");
    const data = await res.json();
    setTemplates(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchTemplates();
  }, []);

  function startEdit(template: Template) {
    setEditingId(template.id);
    setEditForm({
      name: template.name,
      messageTemplate: template.messageTemplate,
      isAutomatic: template.isAutomatic,
      channel: template.channel,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({});
  }

  async function saveEdit(id: string) {
    await fetch(`/api/followup-templates/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    setEditingId(null);
    setEditForm({});
    fetchTemplates();
  }

  async function toggleActive(template: Template) {
    await fetch(`/api/followup-templates/${template.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !template.isActive }),
    });
    fetchTemplates();
  }

  async function toggleAutomatic(template: Template) {
    await fetch(`/api/followup-templates/${template.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAutomatic: !template.isAutomatic }),
    });
    fetchTemplates();
  }

  function previewMessage(template: string) {
    return template
      .replace(/\{\{nome\}\}/g, "Maria Silva")
      .replace(/\{\{servico\}\}/g, "Trafego Pago")
      .replace(/\{\{empresa\}\}/g, "Silva & Associados")
      .replace(/\{\{telefone\}\}/g, "+5511999001001")
      .replace(/\{\{email\}\}/g, "maria@empresa.com");
  }

  // Group templates by stage
  const groupedByStage: Record<number, Template[]> = {};
  for (const t of templates) {
    if (!groupedByStage[t.stageOrder]) groupedByStage[t.stageOrder] = [];
    groupedByStage[t.stageOrder].push(t);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Templates de Follow-up</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Edite os templates para economizar creditos da IA. Mensagens automaticas usam estes templates em vez de chamar a IA.
          </p>
        </div>
      </div>

      {/* Variables reference */}
      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="text-sm font-semibold mb-2">Variaveis disponiveis</h3>
        <div className="flex flex-wrap gap-2">
          {VARIABLES.map((v) => (
            <span
              key={v.key}
              className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs"
            >
              <code className="font-mono text-primary">{v.key}</code>
              <span className="text-muted-foreground">- {v.label}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Templates by stage */}
      {Object.entries(groupedByStage)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([stageOrder, stageTemplates]) => (
          <div key={stageOrder} className="space-y-3">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: STAGE_COLORS[Number(stageOrder)] }}
              />
              <h2 className="text-lg font-semibold">
                {STAGE_NAMES[Number(stageOrder)] || `Etapa ${stageOrder}`}
              </h2>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {stageTemplates.length} template{stageTemplates.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="space-y-2">
              {stageTemplates
                .sort((a, b) => a.followUpOrder - b.followUpOrder)
                .map((template) => (
                  <div
                    key={template.id}
                    className={`bg-card rounded-xl border p-4 transition ${
                      template.isActive
                        ? "border-border"
                        : "border-border opacity-50"
                    }`}
                  >
                    {editingId === template.id ? (
                      /* Edit mode */
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editForm.name || ""}
                          onChange={(e) =>
                            setEditForm({ ...editForm, name: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                          placeholder="Nome do template"
                        />
                        <textarea
                          value={editForm.messageTemplate || ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              messageTemplate: e.target.value,
                            })
                          }
                          rows={4}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono"
                          placeholder="Mensagem do template..."
                        />
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 text-sm">
                            <select
                              value={editForm.channel || "whatsapp"}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  channel: e.target.value,
                                })
                              }
                              className="px-2 py-1 rounded border border-border bg-background text-sm"
                            >
                              <option value="whatsapp">WhatsApp</option>
                              <option value="internal">Lembrete interno</option>
                            </select>
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={editForm.isAutomatic || false}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  isAutomatic: e.target.checked,
                                })
                              }
                            />
                            Envio automatico
                          </label>
                        </div>
                        {/* Preview */}
                        <div className="bg-muted/50 rounded-lg p-3">
                          <p className="text-xs font-semibold text-muted-foreground mb-1">
                            Preview:
                          </p>
                          <p className="text-sm">
                            {previewMessage(editForm.messageTemplate || "")}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveEdit(template.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm"
                          >
                            <Check className="w-4 h-4" /> Salvar
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="flex items-center gap-1 px-3 py-1.5 bg-muted text-muted-foreground rounded-lg text-sm"
                          >
                            <X className="w-4 h-4" /> Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* View mode */
                      <div>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
                              #{template.followUpOrder}
                            </span>
                            <h3 className="text-sm font-semibold">
                              {template.name}
                            </h3>
                            {template.isAutomatic ? (
                              <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                <Zap className="w-3 h-3" /> Automatico
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                <Bell className="w-3 h-3" /> Lembrete
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {template.channel === "whatsapp"
                                ? "WhatsApp"
                                : "Interno"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => startEdit(template)}
                              className="p-1.5 hover:bg-muted rounded-lg transition"
                              title="Editar"
                            >
                              <Edit3 className="w-4 h-4 text-muted-foreground" />
                            </button>
                            <button
                              onClick={() => toggleAutomatic(template)}
                              className="p-1.5 hover:bg-muted rounded-lg transition"
                              title={
                                template.isAutomatic
                                  ? "Mudar para lembrete"
                                  : "Mudar para automatico"
                              }
                            >
                              {template.isAutomatic ? (
                                <ToggleRight className="w-5 h-5 text-green-600" />
                              ) : (
                                <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                              )}
                            </button>
                            <button
                              onClick={() => toggleActive(template)}
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                template.isActive
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {template.isActive ? "Ativo" : "Inativo"}
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
                          {template.messageTemplate}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        ))}

      {templates.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum template encontrado. Execute o seed para criar os templates padrao.
        </div>
      )}
    </div>
  );
}
