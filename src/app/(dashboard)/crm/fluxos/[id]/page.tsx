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

interface Service {
  id: string;
  name: string;
  slug: string;
  color: string;
}

interface Stage {
  id: string;
  name: string;
  color: string;
  order: number;
}

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

  const [services, setServices] = useState<Service[]>([]);
  const [stagesByService, setStagesByService] = useState<Record<string, Stage[]>>({});

  useEffect(() => {
    fetch("/api/services").then((r) => r.json()).then((d) => setServices(Array.isArray(d) ? d : [])).catch(() => {});
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
        setSteps(
          (data.steps as any[]).map((s) => ({
            id: s.id,
            order: s.order,
            delayHours: s.delayHours,
            actionType: s.actionType,
            actionConfig: s.actionConfig || {},
            condition: s.condition,
            isActive: s.isActive,
          })),
        );
        setLoading(false);
      });
  }, [isNew, params.id]);

  useEffect(() => {
    if (!serviceId || stagesByService[serviceId]) return;
    const svc = services.find((s) => s.id === serviceId);
    if (!svc) return;
    fetch(`/api/pipeline/stages?service=${svc.slug}`)
      .then((r) => r.json())
      .then((data) => {
        setStagesByService((prev) => ({ ...prev, [serviceId]: data?.stages || [] }));
      })
      .catch(() => {});
  }, [serviceId, services, stagesByService]);

  const stages = stagesByService[serviceId] || [];

  function addStep() {
    setSteps([
      ...steps,
      {
        order: steps.length + 1,
        delayHours: 0,
        actionType: "internal_reminder",
        actionConfig: { message: "" },
        condition: null,
        isActive: true,
      },
    ]);
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
  }

  function removeStep(idx: number) {
    setSteps(steps.filter((_, i) => i !== idx));
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
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Erro ao salvar");
      setSaving(false);
      return;
    }
    if (isNew) {
      const data = await res.json();
      // No POST não vão os steps — fazemos um PUT em seguida com eles
      if (steps.length > 0) {
        await fetch(`/api/flows/${data.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ steps }),
        });
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

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/crm/fluxos" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold flex-1">{isNew ? "Novo Fluxo" : "Editar Fluxo"}</h1>
        <button
          onClick={() => setIsActive(!isActive)}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition ${
            isActive ? "border-green-300 bg-green-50 text-green-700" : "border-border bg-card text-muted-foreground"
          }`}
        >
          <Power className="w-4 h-4" />
          {isActive ? "Ativo" : "Inativo"}
        </button>
        <button
          onClick={save}
          disabled={saving || !name}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? "Salvando..." : "Salvar"}
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>}

      {/* Identidade */}
      <Section title="1 · Identidade">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Nome do fluxo</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Boas-vindas Forms GMN"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
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
      </Section>

      {/* Gatilho */}
      <Section title="2 · Gatilho">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Serviço</label>
            <select
              value={serviceId}
              onChange={(e) => { setServiceId(e.target.value); setTriggerStageId(""); }}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">— Selecione —</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Quando disparar</label>
            <select
              value={triggerType}
              onChange={(e) => setTriggerType(e.target.value as any)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="STAGE_ENTER">Quando o lead entra num estágio</option>
              <option value="LEAD_CREATED">Quando um novo lead é criado</option>
            </select>
          </div>
          {triggerType === "STAGE_ENTER" && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Estágio</label>
              <select
                value={triggerStageId}
                onChange={(e) => setTriggerStageId(e.target.value)}
                disabled={!serviceId}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              >
                <option value="">— Selecione —</option>
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Condição extra (opcional)</label>
            <select
              value={triggerSource}
              onChange={(e) => setTriggerSource(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Qualquer origem</option>
              <option value="FORMS">Só se origem = Forms site</option>
              <option value="PROSPECCAO">Só se origem = Prospecção</option>
              <option value="INDICACAO">Só se origem = Indicação</option>
            </select>
          </div>
        </div>
      </Section>

      {/* Passos */}
      <Section title="3 · Passos do fluxo">
        {steps.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            Nenhum passo ainda. Adicione abaixo.
          </div>
        ) : (
          <div className="space-y-3">
            {steps.map((step, idx) => (
              <StepEditor
                key={idx}
                step={step}
                index={idx}
                total={steps.length}
                stages={stages}
                onUpdate={(patch) => updateStep(idx, patch)}
                onMove={(dir) => moveStep(idx, dir)}
                onRemove={() => removeStep(idx)}
              />
            ))}
          </div>
        )}
        <button
          onClick={addStep}
          className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-primary transition"
        >
          <Plus className="w-4 h-4" /> Adicionar passo
        </button>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{title}</h2>
      {children}
    </div>
  );
}

function StepEditor({
  step,
  index,
  total,
  stages,
  onUpdate,
  onMove,
  onRemove,
}: {
  step: Step;
  index: number;
  total: number;
  stages: Stage[];
  onUpdate: (patch: Partial<Step>) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  const ACTION_OPTS = [
    { value: "send_whatsapp", label: "Enviar mensagem WhatsApp (automático)", icon: MessageCircle, color: "#22c55e" },
    { value: "internal_reminder", label: "Criar lembrete interno (tarefa)", icon: Bell, color: "#f59e0b" },
    { value: "move_stage", label: "Mover pra outro estágio", icon: MoveRight, color: "#6366f1" },
    { value: "create_task", label: "Criar tarefa separada", icon: Bell, color: "#3b82f6" },
  ];

  return (
    <div
      className={`border rounded-lg p-3 space-y-2 ${step.isActive ? "border-border bg-card" : "border-border bg-muted/30 opacity-60"}`}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">#{index + 1}</span>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <input
            type="number"
            min={0}
            value={step.delayHours}
            onChange={(e) => onUpdate({ delayHours: Math.max(0, Number(e.target.value)) })}
            className="w-16 px-1.5 py-0.5 border border-border rounded text-xs bg-card focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <span>horas após anterior</span>
        </div>
        <div className="flex-1" />
        <button onClick={() => onMove(-1)} disabled={index === 0} className="p-1 rounded hover:bg-muted disabled:opacity-30" title="Subir">
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onMove(1)} disabled={index === total - 1} className="p-1 rounded hover:bg-muted disabled:opacity-30" title="Descer">
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onUpdate({ isActive: !step.isActive })} className="p-1 rounded hover:bg-muted" title={step.isActive ? "Desativar" : "Ativar"}>
          <Power className={`w-3.5 h-3.5 ${step.isActive ? "text-green-600" : ""}`} />
        </button>
        <button onClick={onRemove} className="p-1 rounded hover:bg-red-50 hover:text-red-600" title="Remover">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <select
        value={step.actionType}
        onChange={(e) => onUpdate({ actionType: e.target.value as Step["actionType"], actionConfig: {} })}
        className="w-full px-2 py-1.5 border border-border rounded text-sm bg-card focus:outline-none focus:ring-1 focus:ring-primary"
      >
        {ACTION_OPTS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      {(step.actionType === "send_whatsapp" || step.actionType === "internal_reminder") && (
        <textarea
          value={(step.actionConfig?.message as string) || ""}
          onChange={(e) => onUpdate({ actionConfig: { ...step.actionConfig, message: e.target.value } })}
          rows={4}
          placeholder="Mensagem... use {{nome}}, {{empresa}}, {{linkAnalise}}, {{cidadeEstado}}, etc."
          className="w-full px-2 py-1.5 border border-border rounded text-sm bg-card font-mono focus:outline-none focus:ring-1 focus:ring-primary"
        />
      )}

      {step.actionType === "move_stage" && (
        <select
          value={(step.actionConfig?.stageId as string) || ""}
          onChange={(e) => {
            const stage = stages.find((s) => s.id === e.target.value);
            onUpdate({ actionConfig: { stageId: e.target.value, stageName: stage?.name } });
          }}
          className="w-full px-2 py-1.5 border border-border rounded text-sm bg-card focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">— Selecione estágio destino —</option>
          {stages.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      )}

      {step.actionType === "create_task" && (
        <div className="space-y-2">
          <input
            type="text"
            value={(step.actionConfig?.title as string) || ""}
            onChange={(e) => onUpdate({ actionConfig: { ...step.actionConfig, title: e.target.value } })}
            placeholder="Título da tarefa"
            className="w-full px-2 py-1.5 border border-border rounded text-sm bg-card focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <textarea
            value={(step.actionConfig?.description as string) || ""}
            onChange={(e) => onUpdate({ actionConfig: { ...step.actionConfig, description: e.target.value } })}
            rows={2}
            placeholder="Descrição (opcional)"
            className="w-full px-2 py-1.5 border border-border rounded text-sm bg-card focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      )}
    </div>
  );
}
