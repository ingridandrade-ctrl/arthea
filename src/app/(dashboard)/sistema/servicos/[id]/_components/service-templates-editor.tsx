"use client";

import { useState } from "react";
import { Plus, Trash2, GripVertical, Save, X, FileText, ClipboardCheck, FormInput } from "lucide-react";

type Kind = "TASK" | "FORM" | "DOCUMENT";

type Template = {
  id: string;
  title: string;
  description: string | null;
  kind: Kind;
  phase: number;
  order: number;
};

const PHASE_LABEL = ["", "Imersão", "Construção", "Rastreamento", "Entrega"];

const KIND_LABEL: Record<Kind, string> = {
  TASK: "Tarefa interna",
  FORM: "Formulário pro cliente",
  DOCUMENT: "Documento pra aprovação",
};

const KIND_ICON: Record<Kind, any> = {
  TASK: ClipboardCheck,
  FORM: FormInput,
  DOCUMENT: FileText,
};

export function ServiceTemplatesEditor({
  serviceId,
  initialTemplates,
}: {
  serviceId: string;
  initialTemplates: Template[];
}) {
  const [templates, setTemplates] = useState<Template[]>(initialTemplates);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState<number | null>(null);

  async function createTemplate(phase: number, data: Partial<Template>) {
    const res = await fetch(`/api/services/${serviceId}/templates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, phase }),
    });
    if (!res.ok) return;
    const created = await res.json();
    setTemplates((prev) => [...prev, created]);
    setAdding(null);
  }

  async function updateTemplate(id: string, data: Partial<Template>) {
    const res = await fetch(`/api/services/${serviceId}/templates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) return;
    const updated = await res.json();
    setTemplates((prev) => prev.map((t) => (t.id === id ? updated : t)));
    setEditingId(null);
  }

  async function deleteTemplate(id: string) {
    if (!confirm("Remover esse entregável do template?")) return;
    const res = await fetch(`/api/services/${serviceId}/templates/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) return;
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }

  const byPhase = [1, 2, 3, 4].map((p) => ({
    phase: p,
    items: templates.filter((t) => t.phase === p).sort((a, b) => a.order - b.order),
  }));

  return (
    <div className="space-y-6">
      {byPhase.map(({ phase, items }) => (
        <div key={phase}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Fase {phase}
              </span>
              <h3 className="text-sm font-semibold">{PHASE_LABEL[phase]}</h3>
            </div>
            <button
              onClick={() => setAdding(phase)}
              className="text-xs inline-flex items-center gap-1 text-[var(--accent)] hover:underline"
            >
              <Plus className="w-3 h-3" /> Adicionar
            </button>
          </div>

          <div className="space-y-1.5">
            {items.length === 0 && adding !== phase && (
              <p className="text-xs text-muted-foreground italic py-2">Nenhum entregável nessa fase.</p>
            )}

            {items.map((t) =>
              editingId === t.id ? (
                <TemplateForm
                  key={t.id}
                  initial={t}
                  onCancel={() => setEditingId(null)}
                  onSave={(data) => updateTemplate(t.id, data)}
                />
              ) : (
                <TemplateRow
                  key={t.id}
                  template={t}
                  onEdit={() => setEditingId(t.id)}
                  onDelete={() => deleteTemplate(t.id)}
                />
              ),
            )}

            {adding === phase && (
              <TemplateForm
                onCancel={() => setAdding(null)}
                onSave={(data) => createTemplate(phase, data)}
              />
            )}
          </div>
        </div>
      ))}

      <div className="bg-muted/40 border border-border rounded-xl p-4 text-xs text-muted-foreground">
        <strong>Como vai funcionar no wizard:</strong> ao cadastrar um cliente novo e selecionar esse
        serviço, o sistema vai copiar todos os entregáveis acima como{" "}
        <strong>entregáveis reais</strong> da frente criada — já organizados por fase e na ordem
        certa.
      </div>
    </div>
  );
}

function TemplateRow({
  template,
  onEdit,
  onDelete,
}: {
  template: Template;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const Icon = KIND_ICON[template.kind];
  return (
    <div className="group bg-card border border-border rounded-lg px-3 py-2.5 flex items-center gap-3 hover:border-[var(--accent)]/40 transition">
      <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0" />
      <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{template.title}</p>
        {template.description && (
          <p className="text-xs text-muted-foreground truncate">{template.description}</p>
        )}
      </div>
      <span className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full flex-shrink-0">
        {KIND_LABEL[template.kind]}
      </span>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
        <button
          onClick={onEdit}
          className="p-1 hover:bg-muted rounded text-xs text-muted-foreground"
        >
          editar
        </button>
        <button
          onClick={onDelete}
          className="p-1 hover:bg-destructive/10 rounded text-destructive"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function TemplateForm({
  initial,
  onCancel,
  onSave,
}: {
  initial?: Template;
  onCancel: () => void;
  onSave: (data: { title: string; description: string; kind: Kind }) => void;
}) {
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [kind, setKind] = useState<Kind>(initial?.kind || "DOCUMENT");

  return (
    <div className="bg-muted/30 border border-[var(--accent)]/40 rounded-lg p-3 space-y-2">
      <input
        type="text"
        placeholder="Título do entregável (ex: Brief inicial)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
        className="w-full text-sm bg-background border border-border rounded px-2 py-1.5"
      />
      <textarea
        placeholder="Descrição opcional"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        className="w-full text-xs bg-background border border-border rounded px-2 py-1.5 resize-none"
      />
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-1">
          {(["DOCUMENT", "FORM", "TASK"] as Kind[]).map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={
                "text-[10px] uppercase tracking-wider font-medium px-2.5 py-1 rounded-full border transition " +
                (kind === k
                  ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                  : "bg-card text-muted-foreground border-border hover:border-[var(--accent)]/40")
              }
            >
              {KIND_LABEL[k]}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="text-xs inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            <X className="w-3 h-3" /> Cancelar
          </button>
          <button
            onClick={() => title.trim() && onSave({ title: title.trim(), description: description.trim(), kind })}
            disabled={!title.trim()}
            className="text-xs inline-flex items-center gap-1 bg-[var(--accent)] text-white px-3 py-1 rounded hover:opacity-90 disabled:opacity-50"
          >
            <Save className="w-3 h-3" /> Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
