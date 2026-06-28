"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Zap,
  Save,
  MessageCircle,
  Bell,
  MoveRight,
  Clock,
  Power,
  Pencil,
  Check,
  X,
} from "lucide-react";

interface Step {
  id?: string;
  order: number;
  delayHours: number;
  actionType: "send_whatsapp" | "internal_reminder" | "move_stage" | "create_task";
  actionConfig: Record<string, any>;
  condition: Record<string, any> | null;
  isActive: boolean;
}

interface Service { id: string; name: string; slug: string; color: string; }
interface Stage { id: string; name: string; color: string; order: number; }
interface Template { id: string; name: string; messageTemplate: string; serviceId: string | null; }

const ACTION_META: Record<string, { icon: any; color: string; label: string; bg: string }> = {
  send_whatsapp: { icon: MessageCircle, color: "#16a34a", bg: "bg-green-50", label: "WhatsApp" },
  internal_reminder: { icon: Bell, color: "#d97706", bg: "bg-amber-50", label: "Lembrete" },
  move_stage: { icon: MoveRight, color: "#6366f1", bg: "bg-indigo-50", label: "Mover estágio" },
  create_task: { icon: Bell, color: "#3b82f6", bg: "bg-blue-50", label: "Tarefa" },
};

export default function FlowEditorPage() {
  const params = useParams();
  const router = useRouter();
  const isNew = params.id === "novo";
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [serviceId, setServiceId] = useState<string>("");
  const [triggerType, setTriggerType] = useState<"STAGE_ENTER" | "LEAD_CREATED">("STAGE_ENTER");
  const [triggerStageId, setTriggerStageId] = useState<string>("");
  const [triggerSource, setTriggerSource] = useState<string>("");
  const [isActive, setIsActive] = useState(true);
  const [steps, setSteps] = useState<Step[]>([]);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const [services, setServices] = useState<Service[]>([]);
  const [stagesByService, setStagesByService] = useState<Record<string, Stage[]>>({});
  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => {
    fetch("/api/services").then((r) => r.json()).then((d) => setServices(Array.isArray(d) ? d : [])).catch(() => {});
    fetch("/api/followup-templates").then((r) => r.json()).then((d) => setTemplates(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (isNew) return;
    fetch(`/api/flows/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setName(data.name);
        setDescription(data.description || "");
        setServiceId(data.serviceId || "");
        setTriggerType(data.triggerType);
        setTriggerStageId(data.triggerStageId || "");
        setTriggerSource((data.triggerCondition as any)?.source || "");
        setIsActive(data.isActive);
        setSteps((data.steps as any[]).map((s) => ({
          id: s.id,
          order: s.order,
          delayHours: s.delayHours,
          actionType: s.actionType,
          actionConfig: s.actionConfig || {},
          condition: s.condition,
          isActive: s.isActive,
        })));
        setLoading(false);
      });
  }, [isNew, params.id]);

  useEffect(() => {
    if (!serviceId || stagesByService[serviceId]) return;
    const svc = services.find((s) => s.id === serviceId);
    if (!svc) return;
    fetch(`/api/pipeline/stages?service=${svc.slug}`)
      .then((r) => r.json())
      .then((data) => setStagesByService((prev) => ({ ...prev, [serviceId]: data?.stages || [] })))
      .catch(() => {});
  }, [serviceId, services, stagesByService]);

  const stages = stagesByService[serviceId] || [];
  const availableTemplates = templates.filter((t) => !t.serviceId || t.serviceId === serviceId);
  const activeService = services.find((s) => s.id === serviceId);

  function addStep(at?: number) {
    const newStep: Step = {
      order: 0,
      delayHours: 0,
      actionType: "internal_reminder",
      actionConfig: {},
      condition: null,
      isActive: true,
    };
    if (at === undefined) {
      setSteps([...steps, newStep]);
      setExpandedStep(steps.length);
    } else {
      const copy = [...steps];
      copy.splice(at, 0, newStep);
      setSteps(copy);
      setExpandedStep(at);
    }
  }

  function updateStep(idx: number, patch: Partial<Step>) {
    setSteps(steps.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  }

  function moveStep(idx: number, dir: -1 | 1) {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= steps.length) return;
    const copy = [...steps];
    [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
    setSteps(copy);
    setExpandedStep(newIdx);
  }

  function removeStep(idx: number) {
    setSteps(steps.filter((_, i) => i !== idx));
    setExpandedStep(null);
  }

  async function save() {
    setSaving(true);
    setError("");
    const body = {
      name,
      description,
      serviceId: serviceId || null,
      triggerType,
      triggerStageId: triggerType === "STAGE_ENTER" ? triggerStageId : null,
      triggerCondition: triggerSource ? { source: triggerSource } : null,
      isActive,
      steps,
    };
    const url = isNew ? "/api/flows" : `/api/flows/${params.id}`;
    const method = isNew ? "POST" : "PUT";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Erro ao salvar");
      setSaving(false);
      return;
    }
    if (isNew) {
      const data = await res.json();
      if (steps.length > 0) {
        await fetch(`/api/flows/${data.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ steps }) });
      }
      router.push(`/crm/fluxos/${data.id}`);
    } else {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const triggerComplete =
    !!serviceId && (triggerType === "LEAD_CREATED" || (triggerType === "STAGE_ENTER" && triggerStageId));

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Header sticky */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border -mx-4 px-4 py-3 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <Link href="/crm/fluxos" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome do fluxo..."
            className="text-xl font-bold bg-transparent outline-none flex-1 min-w-[200px] focus:bg-muted/30 px-2 py-1 rounded"
          />
          <button
            onClick={() => setIsActive(!isActive)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
              isActive ? "border-green-300 bg-green-50 text-green-700" : "border-border bg-card text-muted-foreground"
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            {isActive ? "Ativo" : "Inativo"}
          </button>
          <button
            onClick={save}
            disabled={saving || !name}
            className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}

      {/* Canvas vertical */}
      <div className="flex flex-col items-center">
        {/* Nó: Gatilho */}
        <TriggerNode
          serviceId={serviceId}
          service={activeService}
          services={services}
          triggerType={triggerType}
          triggerStageId={triggerStageId}
          triggerSource={triggerSource}
          stages={stages}
          onChange={({ serviceId: sid, triggerType: tt, triggerStageId: tsid, triggerSource: tsrc }) => {
            if (sid !== undefined) { setServiceId(sid); setTriggerStageId(""); }
            if (tt !== undefined) setTriggerType(tt);
            if (tsid !== undefined) setTriggerStageId(tsid);
            if (tsrc !== undefined) setTriggerSource(tsrc);
          }}
        />

        {/* Botão entre o trigger e os passos */}
        {triggerComplete && (
          <>
            {steps.length === 0 ? (
              <>
                <Connector />
                <AddButton onClick={() => addStep()} label="Adicionar primeiro passo" />
              </>
            ) : (
              steps.map((step, idx) => (
                <div key={idx} className="flex flex-col items-center w-full">
                  <Connector delayHours={step.delayHours} />
                  <StepNode
                    step={step}
                    expanded={expandedStep === idx}
                    index={idx}
                    total={steps.length}
                    stages={stages}
                    templates={availableTemplates}
                    onToggle={() => setExpandedStep(expandedStep === idx ? null : idx)}
                    onUpdate={(patch) => updateStep(idx, patch)}
                    onMove={(d) => moveStep(idx, d)}
                    onRemove={() => removeStep(idx)}
                  />
                  {idx === steps.length - 1 && (
                    <>
                      <Connector />
                      <AddButton onClick={() => addStep()} label="Adicionar passo" />
                    </>
                  )}
                </div>
              ))
            )}
          </>
        )}

        {!triggerComplete && (
          <p className="text-xs text-muted-foreground mt-4">
            Configure o gatilho acima pra começar a adicionar passos.
          </p>
        )}
      </div>

      {/* Descrição opcional no rodapé */}
      <div className="mt-12 max-w-xl mx-auto">
        <label className="block text-xs font-medium text-muted-foreground mb-1">Descrição (opcional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Pra que serve esse fluxo?"
          className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
    </div>
  );
}

function Connector({ delayHours }: { delayHours?: number }) {
  const hasDelay = delayHours !== undefined && delayHours > 0;
  return (
    <div className="flex flex-col items-center">
      <div className="w-px h-6 bg-border" />
      {hasDelay && (
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground my-1">
          <Clock className="w-3 h-3" />
          espera {formatHours(delayHours)}
        </div>
      )}
      <div className="w-px h-6 bg-border" />
      <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-border -mt-0.5" />
    </div>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-border text-sm font-medium text-muted-foreground hover:text-primary hover:border-primary transition"
    >
      <Plus className="w-4 h-4" /> {label}
    </button>
  );
}

function TriggerNode({
  serviceId,
  service,
  services,
  triggerType,
  triggerStageId,
  triggerSource,
  stages,
  onChange,
}: {
  serviceId: string;
  service: Service | undefined;
  services: Service[];
  triggerType: "STAGE_ENTER" | "LEAD_CREATED";
  triggerStageId: string;
  triggerSource: string;
  stages: Stage[];
  onChange: (patch: { serviceId?: string; triggerType?: any; triggerStageId?: string; triggerSource?: string }) => void;
}) {
  const [expanded, setExpanded] = useState(!serviceId);
  const stage = stages.find((s) => s.id === triggerStageId);
  const sourceLabels: Record<string, string> = { FORMS: "Forms site", PROSPECCAO: "Prospecção", INDICACAO: "Indicação" };

  return (
    <div className="w-full max-w-md bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/30 rounded-xl p-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="inline-flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">Gatilho</span>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="p-1 rounded hover:bg-primary/10">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <Pencil className="w-3.5 h-3.5" />}
        </button>
      </div>

      {!expanded ? (
        <div className="space-y-1">
          <p className="text-sm font-medium">
            {service ? service.name : "Selecione um serviço"}
          </p>
          <p className="text-xs text-muted-foreground">
            {triggerType === "STAGE_ENTER" && stage ? (
              <>quando o lead entra em <strong>"{stage.name}"</strong></>
            ) : triggerType === "LEAD_CREATED" ? (
              "quando um novo lead é criado"
            ) : (
              "selecione um estágio"
            )}
            {triggerSource && <> · origem = <strong>{sourceLabels[triggerSource]}</strong></>}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Serviço</label>
            <select
              value={serviceId}
              onChange={(e) => onChange({ serviceId: e.target.value })}
              className="w-full px-2 py-1.5 border border-border rounded text-sm bg-card focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">— Selecione —</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Quando</label>
            <select
              value={triggerType}
              onChange={(e) => onChange({ triggerType: e.target.value })}
              className="w-full px-2 py-1.5 border border-border rounded text-sm bg-card focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="STAGE_ENTER">Lead entra num estágio</option>
              <option value="LEAD_CREATED">Lead é criado</option>
            </select>
          </div>
          {triggerType === "STAGE_ENTER" && (
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Estágio</label>
              <select
                value={triggerStageId}
                onChange={(e) => onChange({ triggerStageId: e.target.value })}
                disabled={!serviceId}
                className="w-full px-2 py-1.5 border border-border rounded text-sm bg-card focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
              >
                <option value="">— Selecione —</option>
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Condição extra</label>
            <select
              value={triggerSource}
              onChange={(e) => onChange({ triggerSource: e.target.value })}
              className="w-full px-2 py-1.5 border border-border rounded text-sm bg-card focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Qualquer origem</option>
              <option value="FORMS">Origem = Forms site</option>
              <option value="PROSPECCAO">Origem = Prospecção</option>
              <option value="INDICACAO">Origem = Indicação</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

function StepNode({
  step,
  expanded,
  index,
  total,
  stages,
  templates,
  onToggle,
  onUpdate,
  onMove,
  onRemove,
}: {
  step: Step;
  expanded: boolean;
  index: number;
  total: number;
  stages: Stage[];
  templates: Template[];
  onToggle: () => void;
  onUpdate: (patch: Partial<Step>) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  const meta = ACTION_META[step.actionType] || ACTION_META.internal_reminder;
  const Icon = meta.icon;
  const config = step.actionConfig || {};
  const template = templates.find((t) => t.id === config.templateId);

  const summary =
    step.actionType === "send_whatsapp" || step.actionType === "internal_reminder"
      ? template?.name || config.templateName || "(sem template)"
      : step.actionType === "move_stage"
      ? `→ ${config.stageName || "estágio"}`
      : config.title || "tarefa";

  return (
    <div
      className={`w-full max-w-md bg-card border-2 rounded-xl transition ${
        step.isActive ? "border-border" : "border-border opacity-60"
      } ${expanded ? "shadow-md" : "hover:shadow-sm"}`}
      style={{ borderColor: expanded ? meta.color + "55" : undefined }}
    >
      {/* Cabeçalho — sempre visível */}
      <div className="flex items-center gap-3 p-3 cursor-pointer" onClick={onToggle}>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
          <Icon className="w-4 h-4" style={{ color: meta.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-muted-foreground">#{index + 1}</span>
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: meta.color }}>
              {meta.label}
            </span>
            {!step.isActive && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">Inativo</span>
            )}
          </div>
          <p className="text-sm font-medium truncate mt-0.5">{summary}</p>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </div>

      {/* Editor expandido */}
      {expanded && (
        <div className="border-t border-border p-3 space-y-3">
          <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Tipo de ação</label>
              <select
                value={step.actionType}
                onChange={(e) => onUpdate({ actionType: e.target.value as any, actionConfig: {} })}
                className="w-full px-2 py-1.5 border border-border rounded text-sm bg-card focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="send_whatsapp">💬 Enviar WhatsApp (automático)</option>
                <option value="internal_reminder">🔔 Lembrete interno (vira tarefa)</option>
                <option value="move_stage">➡️ Mover pra outro estágio</option>
                <option value="create_task">📋 Criar tarefa separada</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Esperar antes</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  value={step.delayHours}
                  onChange={(e) => onUpdate({ delayHours: Math.max(0, Number(e.target.value)) })}
                  className="w-16 px-2 py-1.5 border border-border rounded text-sm bg-card focus:outline-none focus:ring-1 focus:ring-primary text-center"
                />
                <span className="text-xs text-muted-foreground">horas</span>
              </div>
            </div>
          </div>

          {(step.actionType === "send_whatsapp" || step.actionType === "internal_reminder") && (
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Template de mensagem</label>
              <select
                value={(config.templateId as string) || ""}
                onChange={(e) => {
                  const tpl = templates.find((t) => t.id === e.target.value);
                  onUpdate({
                    actionConfig: {
                      ...config,
                      templateId: e.target.value || undefined,
                      templateName: tpl?.name,
                      message: tpl?.messageTemplate,
                    },
                  });
                }}
                className="w-full px-2 py-1.5 border border-border rounded text-sm bg-card focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">— Selecionar —</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              {template && (
                <div className="mt-2 p-2 bg-muted/30 rounded text-[11px] text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                  {template.messageTemplate}
                </div>
              )}
              <p className="text-[10px] text-muted-foreground mt-1">
                Edita o conteúdo em <Link href="/crm/templates" className="text-primary hover:underline">/crm/templates</Link>
              </p>
            </div>
          )}

          {step.actionType === "move_stage" && (
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Estágio destino</label>
              <select
                value={(config.stageId as string) || ""}
                onChange={(e) => {
                  const st = stages.find((s) => s.id === e.target.value);
                  onUpdate({ actionConfig: { stageId: e.target.value, stageName: st?.name } });
                }}
                className="w-full px-2 py-1.5 border border-border rounded text-sm bg-card focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">— Selecione —</option>
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {step.actionType === "create_task" && (
            <div className="space-y-2">
              <input
                type="text"
                value={(config.title as string) || ""}
                onChange={(e) => onUpdate({ actionConfig: { ...config, title: e.target.value } })}
                placeholder="Título da tarefa"
                className="w-full px-2 py-1.5 border border-border rounded text-sm bg-card focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <textarea
                value={(config.description as string) || ""}
                onChange={(e) => onUpdate({ actionConfig: { ...config, description: e.target.value } })}
                rows={2}
                placeholder="Descrição (opcional)"
                className="w-full px-2 py-1.5 border border-border rounded text-sm bg-card focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          )}

          {/* Ações */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="flex items-center gap-1">
              <button
                onClick={() => onMove(-1)}
                disabled={index === 0}
                className="p-1.5 rounded hover:bg-muted disabled:opacity-30"
                title="Subir"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onMove(1)}
                disabled={index === total - 1}
                className="p-1.5 rounded hover:bg-muted disabled:opacity-30"
                title="Descer"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onUpdate({ isActive: !step.isActive })}
                className="p-1.5 rounded hover:bg-muted"
                title={step.isActive ? "Desativar" : "Ativar"}
              >
                <Power className={`w-3.5 h-3.5 ${step.isActive ? "text-green-600" : ""}`} />
              </button>
            </div>
            <button
              onClick={onRemove}
              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remover passo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function formatHours(h: number): string {
  if (h === 0) return "imediato";
  if (h < 1) return `${Math.round(h * 60)}min`;
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  const rest = h % 24;
  return rest > 0 ? `${d}d ${rest}h` : `${d} dia${d > 1 ? "s" : ""}`;
}
