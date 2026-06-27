"use client";

import { useEffect, useState, useMemo } from "react";
import { Edit3, Check, X, ToggleLeft, ToggleRight, Zap, Bell } from "lucide-react";

const VARIABLES = [
  { key: "{{nome}}", label: "Nome do lead" },
  { key: "{{empresa}}", label: "Empresa" },
  { key: "{{telefone}}", label: "Telefone" },
  { key: "{{email}}", label: "Email" },
  { key: "{{servico}}", label: "Serviço(s)" },
  { key: "{{segmento}}", label: "Segmento (GMN)" },
  { key: "{{cidadeEstado}}", label: "Cidade/Estado (GMN)" },
  { key: "{{linkAnalise}}", label: "Link da análise (GMN)" },
];

interface Template {
  id: string;
  code: string | null;
  name: string;
  serviceId: string | null;
  stageOrder: number;
  followUpOrder: number;
  channel: string;
  messageTemplate: string;
  isAutomatic: boolean;
  isActive: boolean;
  condition: any;
  service: { id: string; name: string; slug: string; color: string } | null;
  stageName: string;
  stageColor: string;
}

const GENERIC_KEY = "__generic__";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [services, setServices] = useState<{ id: string; name: string; slug: string; color: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>(GENERIC_KEY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Template>>({});

  async function fetchTemplates() {
    setLoading(true);
    const [tRes, sRes] = await Promise.all([
      fetch("/api/followup-templates"),
      fetch("/api/services"),
    ]);
    const tData = await tRes.json();
    const sData = await sRes.json();
    setTemplates(Array.isArray(tData) ? tData : []);
    setServices(Array.isArray(sData) ? sData : []);
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
      .replace(/\{\{servico\}\}/g, "Google Meu Negócio")
      .replace(/\{\{empresa\}\}/g, "Clínica Exemplo")
      .replace(/\{\{telefone\}\}/g, "+5511999001001")
      .replace(/\{\{email\}\}/g, "maria@empresa.com")
      .replace(/\{\{segmento\}\}/g, "Saúde")
      .replace(/\{\{cidadeEstado\}\}/g, "São Paulo / SP")
      .replace(/\{\{linkAnalise\}\}/g, "https://gbpcheck.com/exemplo");
  }

  const tabs = useMemo(() => {
    const countByService = new Map<string | null, number>();
    for (const t of templates) {
      const key = t.serviceId ?? null;
      countByService.set(key, (countByService.get(key) || 0) + 1);
    }
    const list: { key: string; label: string; color: string; count: number }[] = [
      { key: GENERIC_KEY, label: "Genérico", color: "#94a3b8", count: countByService.get(null) || 0 },
    ];
    for (const s of services) {
      list.push({
        key: s.id,
        label: s.name,
        color: s.color,
        count: countByService.get(s.id) || 0,
      });
    }
    return list;
  }, [templates, services]);

  const filtered = useMemo(() => {
    if (activeTab === GENERIC_KEY) return templates.filter((t) => !t.serviceId);
    return templates.filter((t) => t.serviceId === activeTab);
  }, [templates, activeTab]);

  const grouped = useMemo(() => {
    const m = new Map<number, { name: string; color: string; items: Template[] }>();
    for (const t of filtered) {
      const g = m.get(t.stageOrder);
      if (g) g.items.push(t);
      else m.set(t.stageOrder, { name: t.stageName, color: t.stageColor, items: [t] });
    }
    return Array.from(m.entries()).sort(([a], [b]) => a - b);
  }, [filtered]);

  function conditionLabel(condition: any) {
    if (!condition || typeof condition !== "object") return null;
    if (condition.source === "FORMS") return "Forms site";
    if (condition.source === "PROSPECCAO") return "Prospecção";
    if (condition.source === "INDICACAO") return "Indicação";
    return null;
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
      <div>
        <h1 className="text-2xl font-bold">Templates de Follow-up</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Mensagens prontas que disparam quando o lead entra num estágio. Cada serviço pode ter seus próprios templates.
        </p>
      </div>

      {/* Tabs por serviço */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                isActive
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              style={isActive ? { borderColor: tab.color } : undefined}
            >
              <span className="inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: tab.color }} />
                {tab.label}
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-mono">
                  {tab.count}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Variables reference */}
      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="text-sm font-semibold mb-2">Variáveis disponíveis</h3>
        <div className="flex flex-wrap gap-2">
          {VARIABLES.map((v) => (
            <span key={v.key} className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs">
              <code className="font-mono text-primary">{v.key}</code>
              <span className="text-muted-foreground">- {v.label}</span>
            </span>
          ))}
        </div>
      </div>

      {grouped.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum template cadastrado pra esse serviço.
        </div>
      ) : (
        grouped.map(([stageOrder, group]) => (
          <div key={stageOrder} className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: group.color }} />
              <h2 className="text-lg font-semibold">{group.name}</h2>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {group.items.length} template{group.items.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="space-y-2">
              {group.items
                .sort((a, b) => a.followUpOrder - b.followUpOrder)
                .map((template) => {
                  const cond = conditionLabel(template.condition);
                  return (
                    <div
                      key={template.id}
                      className={`bg-card rounded-xl border p-4 transition ${
                        template.isActive ? "border-border" : "border-border opacity-50"
                      }`}
                    >
                      {editingId === template.id ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={editForm.name || ""}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                            placeholder="Nome do template"
                          />
                          <textarea
                            value={editForm.messageTemplate || ""}
                            onChange={(e) => setEditForm({ ...editForm, messageTemplate: e.target.value })}
                            rows={6}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono"
                            placeholder="Mensagem do template..."
                          />
                          <div className="flex items-center gap-4">
                            <select
                              value={editForm.channel || "whatsapp"}
                              onChange={(e) => setEditForm({ ...editForm, channel: e.target.value })}
                              className="px-2 py-1 rounded border border-border bg-background text-sm"
                            >
                              <option value="whatsapp">WhatsApp</option>
                              <option value="internal">Lembrete interno</option>
                            </select>
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={editForm.isAutomatic || false}
                                onChange={(e) => setEditForm({ ...editForm, isAutomatic: e.target.checked })}
                              />
                              Envio automático
                            </label>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-3">
                            <p className="text-xs font-semibold text-muted-foreground mb-1">Preview:</p>
                            <p className="text-sm whitespace-pre-wrap">{previewMessage(editForm.messageTemplate || "")}</p>
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
                        <div>
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
                                #{template.followUpOrder}
                              </span>
                              <h3 className="text-sm font-semibold">{template.name}</h3>
                              {template.code && (
                                <span className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                  {template.code}
                                </span>
                              )}
                              {template.isAutomatic ? (
                                <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                  <Zap className="w-3 h-3" /> Automático
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                  <Bell className="w-3 h-3" /> Lembrete
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {template.channel === "whatsapp" ? "WhatsApp" : "Interno"}
                              </span>
                              {cond && (
                                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                                  Origem: {cond}
                                </span>
                              )}
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
                                title={template.isAutomatic ? "Mudar para lembrete" : "Mudar para automático"}
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
                                  template.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
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
                  );
                })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
