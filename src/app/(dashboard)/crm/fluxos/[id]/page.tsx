"use client";

import { useEffect, useMemo, useState } from "react";
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
  Copy,
  AlertCircle,
  GitBranch,
  MousePointerClick,
  HelpCircle,
  CalendarDays,
  XCircle,
} from "lucide-react";

type ActionType =
  | "send_whatsapp"
  | "internal_reminder"
  | "move_stage"
  | "create_task"
  | "check_response"
  | "button_clicked"
  | "field_check"
  | "wait_business_days"
  | "set_loss_reason";

interface Step {
  id?: string;
  order: number;
  delayHours: number;
  actionType: ActionType;
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
  check_response: { icon: GitBranch, color: "#9333ea", bg: "bg-purple-50", label: "Condição: lead respondeu?" },
  button_clicked: { icon: MousePointerClick, color: "#0891b2", bg: "bg-cyan-50", label: "Condição: botão clicado?" },
  field_check: { icon: HelpCircle, color: "#0d9488", bg: "bg-teal-50", label: "Condição: campo preenchido?" },
  wait_business_days: { icon: CalendarDays, color: "#65a30d", bg: "bg-lime-50", label: "Espera: dias úteis" },
  set_loss_reason: { icon: XCircle, color: "#dc2626", bg: "bg-red-50", label: "Registrar motivo da perda" },
};

const DELAY_PRESETS: Array<{ label: string; hours: number }> = [
  { label: "Imediato", hours: 0 },
  { label: "30min", hours: 0.5 },
  { label: "1h", hours: 1 },
  { label: "4h", hours: 4 },
  { label: "24h", hours: 24 },
  { label: "48h", hours: 48 },
  { label: "7 dias", hours: 168 },
];

interface StepError {
  index: number;
  message: string;
}

function validateFlow(steps: Step[]): StepError[] {
  const errors: StepError[] = [];
  if (steps.length === 0) {
    errors.push({ index: -1, message: "Adicione ao menos um passo ao fluxo." });
    return errors;
  }
  steps.forEach((step, idx) => {
    if (!step.isActive) return;
    const cfg = step.actionConfig || {};
    if ((step.actionType === "send_whatsapp" || step.actionType === "internal_reminder") && !cfg.templateId) {
      errors.push({ index: idx, message: `Passo #${idx + 1}: selecione um template de mensagem.` });
    }
    if (step.actionType === "move_stage" && !cfg.stageId) {
      errors.push({ index: idx, message: `Passo #${idx + 1}: selecione um estágio destino.` });
    }
    if (step.actionType === "create_task" && !cfg.title) {
      errors.push({ index: idx, message: `Passo #${idx + 1}: informe um título para a tarefa.` });
    }
    if (step.actionType === "check_response" && idx === 0) {
      errors.push({ index: idx, message: `Passo #${idx + 1}: a condição "lead respondeu?" precisa vir depois de um passo de envio.` });
    }
    if (step.actionType === "button_clicked") {
      if (idx === 0) {
        errors.push({ index: idx, message: `Passo #${idx + 1}: "botão clicado?" precisa vir depois de um passo de envio com botões.` });
      }
      const branches = (cfg.branches || []) as any[];
      if (!Array.isArray(branches) || branches.length === 0) {
        errors.push({ index: idx, message: `Passo #${idx + 1}: configure ao menos uma ramificação no nó "botão clicado?".` });
      } else {
        branches.forEach((b, bi) => {
          if (!b?.buttonId) errors.push({ index: idx, message: `Passo #${idx + 1}, ramificação ${bi + 1}: faltou o ID do botão.` });
        });
      }
    }
    if (step.actionType === "field_check" && !cfg.field) {
      errors.push({ index: idx, message: `Passo #${idx + 1}: selecione qual campo verificar.` });
    }
    if (step.actionType === "wait_business_days") {
      const d = Number(cfg.days || 0);
      if (!Number.isFinite(d) || d < 1) errors.push({ index: idx, message: `Passo #${idx + 1}: informe quantos dias úteis aguardar (mínimo 1).` });
    }
    if (step.actionType === "set_loss_reason" && !cfg.reason) {
      errors.push({ index: idx, message: `Passo #${idx + 1}: informe o motivo da perda.` });
    }
  });
  return errors;
}

export default function FlowEditorPage() {
  const params = useParams();
  const router = useRouter();
  const isNew = params.id === "novo";
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<StepError[]>([]);

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

  // Soma total de horas dos passos ativos
  const totalHours = useMemo(
    () => steps.filter((s) => s.isActive).reduce((sum, s) => sum + (Number(s.delayHours) || 0), 0),
    [steps]
  );

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

  function duplicateStep(idx: number) {
    const original = steps[idx];
    if (!original) return;
    const clone: Step = {
      // omite id pra criar como novo no backend
      order: 0,
      delayHours: original.delayHours,
      actionType: original.actionType,
      actionConfig: JSON.parse(JSON.stringify(original.actionConfig || {})),
      condition: original.condition ? JSON.parse(JSON.stringify(original.condition)) : null,
      isActive: original.isActive,
    };
    const copy = [...steps];
    copy.splice(idx + 1, 0, clone);
    setSteps(copy);
    setExpandedStep(idx + 1);
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
    setError("");
    const errors = validateFlow(steps);
    setValidationErrors(errors);
    if (errors.length > 0) {
      setError("Corrija os erros abaixo antes de salvar.");
      // expande o primeiro passo com erro
      const firstWithIndex = errors.find((e) => e.index >= 0);
      if (firstWithIndex) setExpandedStep(firstWithIndex.index);
      return;
    }
    setSaving(true);
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

  const errorByIndex: Record<number, string[]> = {};
  validationErrors.forEach((e) => {
    if (e.index < 0) return;
    if (!errorByIndex[e.index]) errorByIndex[e.index] = [];
    errorByIndex[e.index].push(e.message);
  });

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
          {steps.length > 0 && (
            <div
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-muted/50 text-muted-foreground"
              title="Tempo total estimado entre o gatilho e o último passo (somando delays dos passos ativos)"
            >
              <Clock className="w-3.5 h-3.5" />
              Fluxo total: ~{formatHours(totalHours)}
            </div>
          )}
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
        {steps.length > 0 && (
          <div className="sm:hidden mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted/50 text-muted-foreground">
            <Clock className="w-3 h-3" />
            Fluxo total: ~{formatHours(totalHours)}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg mb-4 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">{error}</p>
            {validationErrors.length > 0 && (
              <ul className="mt-1 space-y-0.5 list-disc list-inside text-xs">
                {validationErrors.map((e, i) => (
                  <li key={i}>{e.message}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

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
                    errors={errorByIndex[idx] || []}
                    onToggle={() => setExpandedStep(expandedStep === idx ? null : idx)}
                    onUpdate={(patch) => updateStep(idx, patch)}
                    onMove={(d) => moveStep(idx, d)}
                    onRemove={() => removeStep(idx)}
                    onDuplicate={() => duplicateStep(idx)}
                  />
                  {/* Branch labels para check_response */}
                  {step.actionType === "check_response" && (
                    <CheckResponseBranches hasNext={idx < steps.length - 1} />
                  )}
                  {idx === steps.length - 1 && (
                    <>
                      {step.actionType !== "check_response" && <Connector />}
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

function CheckResponseBranches({ hasNext }: { hasNext: boolean }) {
  return (
    <div className="w-full max-w-md mt-2 mb-1 grid grid-cols-2 gap-3">
      <div className="flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-[11px] font-medium text-red-700">
          <span>✅ respondeu</span>
        </div>
        <div className="w-px h-4 bg-red-200" />
        <div className="text-[11px] text-red-700 font-medium italic">para o fluxo</div>
        <div className="text-[10px] text-muted-foreground">e avisa a equipe</div>
      </div>
      <div className="flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 border border-green-200 text-[11px] font-medium text-green-700">
          <span>❌ não respondeu</span>
        </div>
        <div className="w-px h-4 bg-green-200" />
        <div className="text-[11px] text-green-700 font-medium italic">
          {hasNext ? "segue pro próximo" : "fim do fluxo"}
        </div>
        <div className="text-[10px] text-muted-foreground">&nbsp;</div>
      </div>
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
  errors,
  onToggle,
  onUpdate,
  onMove,
  onRemove,
  onDuplicate,
}: {
  step: Step;
  expanded: boolean;
  index: number;
  total: number;
  stages: Stage[];
  templates: Template[];
  errors: string[];
  onToggle: () => void;
  onUpdate: (patch: Partial<Step>) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}) {
  const meta = ACTION_META[step.actionType] || ACTION_META.internal_reminder;
  const Icon = meta.icon;
  const config = step.actionConfig || {};
  const template = templates.find((t) => t.id === config.templateId);
  const hasError = errors.length > 0;

  const summary =
    step.actionType === "send_whatsapp" || step.actionType === "internal_reminder"
      ? template?.name || config.templateName || "(sem template)"
      : step.actionType === "move_stage"
      ? `→ ${config.stageName || "estágio"}`
      : step.actionType === "check_response"
      ? "se respondeu → para; senão → segue"
      : config.title || "tarefa";

  // se o valor atual bate com algum preset, marca-o; senão, é "custom"
  const matchingPreset = DELAY_PRESETS.find((p) => p.hours === step.delayHours);
  const presetValue = matchingPreset ? String(matchingPreset.hours) : "custom";

  return (
    <div
      className={`w-full max-w-md bg-card border-2 rounded-xl transition ${
        hasError ? "border-red-300" : step.isActive ? "border-border" : "border-border opacity-60"
      } ${expanded ? "shadow-md" : "hover:shadow-sm"}`}
      style={{ borderColor: hasError ? undefined : expanded ? meta.color + "55" : undefined }}
    >
      {/* Cabeçalho — sempre visível */}
      <div className="flex items-center gap-3 p-3 cursor-pointer" onClick={onToggle}>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
          <Icon className="w-4 h-4" style={{ color: meta.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono text-muted-foreground">#{index + 1}</span>
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: meta.color }}>
              {meta.label}
            </span>
            {!step.isActive && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">Inativo</span>
            )}
            {hasError && (
              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                <AlertCircle className="w-3 h-3" />
                {errors.length === 1 ? "Erro" : `${errors.length} erros`}
              </span>
            )}
          </div>
          <p className="text-sm font-medium truncate mt-0.5">{summary}</p>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </div>

      {/* Editor expandido */}
      {expanded && (
        <div className="border-t border-border p-3 space-y-3">
          {hasError && (
            <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700 space-y-0.5">
              {errors.map((e, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                  <span>{e}</span>
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Tipo de ação</label>
            <select
              value={step.actionType}
              onChange={(e) => onUpdate({ actionType: e.target.value as any, actionConfig: {} })}
              className="w-full px-2 py-1.5 border border-border rounded text-sm bg-card focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="send_whatsapp">💬 Enviar WhatsApp (automático)</option>
              <option value="internal_reminder">🔔 Lembrete interno (vira tarefa)</option>
              <option value="check_response">⚡ Condição: o lead respondeu?</option>
              <option value="button_clicked">🖱️ Condição: botão clicado?</option>
              <option value="field_check">❔ Condição: campo preenchido?</option>
              <option value="wait_business_days">📅 Espera: dias úteis</option>
              <option value="move_stage">➡️ Mover pra outro estágio</option>
              <option value="set_loss_reason">❌ Registrar motivo da perda</option>
              <option value="create_task">📋 Criar tarefa separada</option>
            </select>
          </div>

          {/* Delay com presets + custom */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
              Esperar antes de executar
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={presetValue}
                onChange={(e) => {
                  if (e.target.value === "custom") return; // mantém valor atual
                  onUpdate({ delayHours: Number(e.target.value) });
                }}
                className="flex-1 min-w-[140px] px-2 py-1.5 border border-border rounded text-sm bg-card focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {DELAY_PRESETS.map((p) => (
                  <option key={p.hours} value={p.hours}>{p.label}</option>
                ))}
                <option value="custom">Customizado…</option>
              </select>
              <div className="inline-flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={step.delayHours}
                  onChange={(e) => onUpdate({ delayHours: Math.max(0, Number(e.target.value)) })}
                  className="w-20 px-2 py-1.5 border border-border rounded text-sm bg-card focus:outline-none focus:ring-1 focus:ring-primary text-center"
                />
                <span className="text-xs text-muted-foreground">h</span>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Equivale a <strong>{formatHours(step.delayHours)}</strong>
            </p>
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

          {step.actionType === "check_response" && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded text-xs text-purple-900 space-y-1">
              <p className="font-semibold">Como funciona:</p>
              <p>• Se o lead enviou QUALQUER mensagem após esse fluxo começar → <strong>cancela o fluxo</strong> e <strong>notifica a equipe</strong>.</p>
              <p>• Se NÃO respondeu → segue pro próximo passo.</p>
              <p className="text-purple-700 italic">Não tem configuração — é checagem automática.</p>
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

          {step.actionType === "button_clicked" && (
            <ButtonClickedConfig config={config} templates={templates} stages={stages} onUpdate={onUpdate} />
          )}

          {step.actionType === "field_check" && (
            <div className="space-y-2">
              <div className="p-2 bg-teal-50 border border-teal-200 rounded text-[11px] text-teal-900">
                Verifica se um campo do "Dados do serviço" tá preenchido. Se sim, segue o fluxo. Se vazio, notifica a admin e aguarda 1h pra checar de novo — pausa as próximas mensagens até o campo ser preenchido.
              </div>
              <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Campo a verificar</label>
              <select
                value={(config.field as string) || ""}
                onChange={(e) => onUpdate({ actionConfig: { ...config, field: e.target.value } })}
                className="w-full px-2 py-1.5 border border-border rounded text-sm bg-card focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">— Selecione —</option>
                <option value="linkAnalise">Link da análise</option>
                <option value="segmento">Segmento</option>
                <option value="cidadeEstado">Cidade / UF</option>
              </select>
            </div>
          )}

          {step.actionType === "wait_business_days" && (
            <div className="space-y-2">
              <div className="p-2 bg-lime-50 border border-lime-200 rounded text-[11px] text-lime-900">
                Espera N dias úteis (seg-sex, pulando feriados nacionais brasileiros). Carnaval, Sexta Santa e Corpus Christi entram. Não envia mensagem nem dispara nada em fim de semana / feriado.
              </div>
              <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Quantos dias úteis aguardar?</label>
              <input
                type="number"
                min={1}
                max={30}
                value={Number(config.days || 1)}
                onChange={(e) => onUpdate({ actionConfig: { ...config, days: Math.max(1, Number(e.target.value) || 1) } })}
                className="w-24 px-2 py-1.5 border border-border rounded text-sm bg-card focus:outline-none focus:ring-1 focus:ring-primary text-center"
              />
              <p className="text-[10px] text-muted-foreground">
                Substitui o delay em horas — quando usa esse nó, o campo "Esperar" acima é ignorado.
              </p>
            </div>
          )}

          {step.actionType === "set_loss_reason" && (
            <div className="space-y-2">
              <div className="p-2 bg-red-50 border border-red-200 rounded text-[11px] text-red-900">
                Marca o lead como <strong>Perdido</strong> (status + estágio "Perdido" do pipeline) e grava o motivo nos notes do lead. Útil pra finalizar cadências sem resposta.
              </div>
              <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Motivo da perda</label>
              <input
                type="text"
                value={(config.reason as string) || ""}
                onChange={(e) => onUpdate({ actionConfig: { ...config, reason: e.target.value } })}
                placeholder="Ex: Sem resposta após cadência completa"
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
              <button
                onClick={onDuplicate}
                className="p-1.5 rounded hover:bg-muted"
                title="Duplicar passo"
              >
                <Copy className="w-3.5 h-3.5" />
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

// ─── Editor da branch de "botão clicado?" ──────────────────────────
function ButtonClickedConfig({
  config,
  templates,
  stages,
  onUpdate,
}: {
  config: Record<string, any>;
  templates: Template[];
  stages: Stage[];
  onUpdate: (patch: Partial<Step>) => void;
}) {
  const branches = (config.branches || []) as Array<{ buttonId: string; label?: string; actions: any[] }>;

  function updateBranches(next: typeof branches) {
    onUpdate({ actionConfig: { ...config, branches: next } });
  }

  function addBranch() {
    updateBranches([...branches, { buttonId: "", label: "", actions: [] }]);
  }

  function removeBranch(i: number) {
    updateBranches(branches.filter((_, idx) => idx !== i));
  }

  function updateBranch(i: number, patch: Partial<(typeof branches)[0]>) {
    updateBranches(branches.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
  }

  function addAction(branchIdx: number, type: string) {
    const next = [...branches];
    const defaults: Record<string, any> = {
      trigger_template: { type: "trigger_template", templateId: "" },
      move_stage_by_name: { type: "move_stage_by_name", stageNamePattern: "" },
      mark_lost: { type: "mark_lost", reason: "" },
      notify_team: { type: "notify_team", title: "", body: "" },
    };
    next[branchIdx].actions = [...(next[branchIdx].actions || []), defaults[type] || {}];
    updateBranches(next);
  }

  function updateAction(branchIdx: number, actionIdx: number, patch: any) {
    const next = [...branches];
    next[branchIdx].actions = next[branchIdx].actions.map((a: any, i: number) =>
      i === actionIdx ? { ...a, ...patch } : a,
    );
    updateBranches(next);
  }

  function removeAction(branchIdx: number, actionIdx: number) {
    const next = [...branches];
    next[branchIdx].actions = next[branchIdx].actions.filter((_: any, i: number) => i !== actionIdx);
    updateBranches(next);
  }

  return (
    <div className="space-y-3">
      <div className="p-2 bg-cyan-50 border border-cyan-200 rounded text-[11px] text-cyan-900">
        Detecta qual botão o lead clicou no último template enviado. Cada ramificação executa suas ações se o botão correspondente foi clicado. Use ID <code className="bg-cyan-100 px-1 rounded">_none</code> pra leads que não clicaram em botão nenhum.
      </div>

      {branches.length === 0 && (
        <p className="text-xs text-muted-foreground italic">Nenhuma ramificação. Adicione abaixo.</p>
      )}

      {branches.map((branch, bi) => (
        <div key={bi} className="border border-border rounded p-2 space-y-2 bg-muted/20">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={branch.buttonId}
              onChange={(e) => updateBranch(bi, { buttonId: e.target.value })}
              placeholder="ID do botão (ex: gmn_t2b_yes ou _none)"
              className="flex-1 px-2 py-1 border border-border rounded text-xs bg-card focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              type="text"
              value={branch.label || ""}
              onChange={(e) => updateBranch(bi, { label: e.target.value })}
              placeholder="Apelido"
              className="w-28 px-2 py-1 border border-border rounded text-xs bg-card focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button onClick={() => removeBranch(bi)} className="p-1 hover:bg-red-50 rounded" title="Remover ramificação">
              <Trash2 className="w-3 h-3 text-red-600" />
            </button>
          </div>

          <div className="pl-2 space-y-1.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Ações dessa ramificação:</p>
            {(branch.actions || []).map((action: any, ai: number) => (
              <div key={ai} className="flex items-start gap-1.5">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-200">{actionLabel(action.type)}</span>
                    <button onClick={() => removeAction(bi, ai)} className="ml-auto p-0.5 hover:bg-red-50 rounded">
                      <Trash2 className="w-2.5 h-2.5 text-red-600" />
                    </button>
                  </div>
                  {action.type === "trigger_template" && (
                    <select
                      value={action.templateId || ""}
                      onChange={(e) => updateAction(bi, ai, { templateId: e.target.value })}
                      className="w-full px-2 py-1 border border-border rounded text-xs bg-card focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">— Template —</option>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  )}
                  {action.type === "move_stage_by_name" && (
                    <select
                      value={action.stageNamePattern || ""}
                      onChange={(e) => updateAction(bi, ai, { stageNamePattern: e.target.value })}
                      className="w-full px-2 py-1 border border-border rounded text-xs bg-card focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">— Estágio —</option>
                      {stages.map((s) => (
                        <option key={s.id} value={s.name.toLowerCase()}>{s.name}</option>
                      ))}
                    </select>
                  )}
                  {action.type === "mark_lost" && (
                    <input
                      type="text"
                      value={action.reason || ""}
                      onChange={(e) => updateAction(bi, ai, { reason: e.target.value })}
                      placeholder="Motivo (ex: Sem interesse)"
                      className="w-full px-2 py-1 border border-border rounded text-xs bg-card focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  )}
                  {action.type === "notify_team" && (
                    <div className="space-y-1">
                      <input
                        type="text"
                        value={action.title || ""}
                        onChange={(e) => updateAction(bi, ai, { title: e.target.value })}
                        placeholder="Título da notificação"
                        className="w-full px-2 py-1 border border-border rounded text-xs bg-card focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <input
                        type="text"
                        value={action.body || ""}
                        onChange={(e) => updateAction(bi, ai, { body: e.target.value })}
                        placeholder="Corpo (opcional)"
                        className="w-full px-2 py-1 border border-border rounded text-xs bg-card focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div className="flex flex-wrap gap-1 pt-1">
              <button onClick={() => addAction(bi, "trigger_template")} className="text-[10px] px-2 py-0.5 rounded border border-border hover:bg-muted">+ template</button>
              <button onClick={() => addAction(bi, "move_stage_by_name")} className="text-[10px] px-2 py-0.5 rounded border border-border hover:bg-muted">+ mover estágio</button>
              <button onClick={() => addAction(bi, "mark_lost")} className="text-[10px] px-2 py-0.5 rounded border border-border hover:bg-muted">+ marcar perdido</button>
              <button onClick={() => addAction(bi, "notify_team")} className="text-[10px] px-2 py-0.5 rounded border border-border hover:bg-muted">+ notificar</button>
            </div>
          </div>
        </div>
      ))}

      <button onClick={addBranch} className="w-full px-2 py-1.5 border border-dashed border-border rounded text-xs hover:bg-muted">
        + Nova ramificação
      </button>
    </div>
  );
}

function actionLabel(type: string): string {
  return (
    {
      trigger_template: "Enviar template",
      move_stage_by_name: "Mover estágio",
      mark_lost: "Marcar perdido",
      notify_team: "Notificar equipe",
    } as Record<string, string>
  )[type] || type;
}
