"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Zap, Copy, Trash2, Power, MessageCircle, Bell, ArrowRight, Clock, MoveRight } from "lucide-react";
import { FilterDropdown } from "@/components/crm/filter-dropdown";
import { Modal } from "@/components/ui/modal";

interface FlowStep {
  id: string;
  order: number;
  delayHours: number;
  actionType: string;
  actionConfig: any;
  condition: any;
  isActive: boolean;
}

interface Flow {
  id: string;
  name: string;
  description: string | null;
  serviceId: string | null;
  service: { id: string; name: string; slug: string; color: string } | null;
  triggerType: string;
  triggerStage: { id: string; name: string; color: string; order: number } | null;
  triggerCondition: any;
  isActive: boolean;
  steps: FlowStep[];
  _count: { executions: number };
}

export default function FluxosPage() {
  const [flows, setFlows] = useState<Flow[]>([]);
  const [services, setServices] = useState<{ id: string; name: string; slug: string; color: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeService, setActiveService] = useState("all");
  const [deletingFlow, setDeletingFlow] = useState<Flow | null>(null);

  async function fetchFlows() {
    setLoading(true);
    const url = activeService === "all" ? "/api/flows" : `/api/flows?service=${activeService}`;
    const res = await fetch(url);
    const data = await res.json();
    setFlows(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    fetch("/api/services").then((r) => r.json()).then((d) => setServices(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  useEffect(() => {
    fetchFlows();
  }, [activeService]);

  async function toggleActive(flow: Flow) {
    await fetch(`/api/flows/${flow.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !flow.isActive }),
    });
    fetchFlows();
  }

  async function duplicate(flow: Flow) {
    await fetch(`/api/flows/${flow.id}/duplicate`, { method: "POST" });
    fetchFlows();
  }

  async function deleteFlow(flow: Flow) {
    await fetch(`/api/flows/${flow.id}`, { method: "DELETE" });
    setDeletingFlow(null);
    fetchFlows();
  }

  const flowsByService = useMemo(() => {
    const m = new Map<string, Flow[]>();
    for (const f of flows) {
      const key = f.service?.id || "_none";
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(f);
    }
    return m;
  }, [flows]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Fluxos de Automação</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sequências de ações que rodam sozinhas quando um lead casa o gatilho.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <FilterDropdown
            label="Serviço"
            value={activeService}
            onChange={setActiveService}
            defaultLabel="Todos"
            options={services.map((s) => ({ value: s.slug, label: s.name, color: s.color }))}
          />
          <Link
            href="/crm/fluxos/novo"
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition"
          >
            <Plus className="w-4 h-4" /> Novo Fluxo
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : flows.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <Zap className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground font-medium">Nenhum fluxo ainda</p>
          <p className="text-xs text-muted-foreground mt-1">Crie seu primeiro fluxo pra automatizar mensagens e lembretes.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(flowsByService.entries()).map(([svcId, items]) => {
            const svc = items[0].service;
            return (
              <div key={svcId} className="space-y-3">
                <div className="flex items-center gap-2">
                  {svc ? (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: svc.color }} />
                      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{svc.name}</h2>
                    </>
                  ) : (
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Sem serviço</h2>
                  )}
                </div>
                {items.map((flow) => (
                  <FlowCard
                    key={flow.id}
                    flow={flow}
                    onToggle={() => toggleActive(flow)}
                    onDuplicate={() => duplicate(flow)}
                    onDelete={() => setDeletingFlow(flow)}
                  />
                ))}
              </div>
            );
          })}
        </div>
      )}

      {deletingFlow && (
        <Modal title="Excluir fluxo" onClose={() => setDeletingFlow(null)}>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Tem certeza que quer excluir <strong>{deletingFlow.name}</strong>? Execuções em andamento serão paradas.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingFlow(null)} className="flex-1 px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted">
                Cancelar
              </button>
              <button onClick={() => deleteFlow(deletingFlow)} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
                Excluir
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function FlowCard({
  flow,
  onToggle,
  onDuplicate,
  onDelete,
}: {
  flow: Flow;
  onToggle: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const triggerLabel = describeTrigger(flow);
  return (
    <div className={`bg-card rounded-xl border p-4 transition ${flow.isActive ? "border-border" : "border-border opacity-60"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/crm/fluxos/${flow.id}`} className="text-base font-semibold hover:underline">
              {flow.name}
            </Link>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${flow.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
              {flow.isActive ? "Ativo" : "Inativo"}
            </span>
          </div>
          {flow.description && (
            <p className="text-xs text-muted-foreground mt-1">{flow.description}</p>
          )}
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
            <Zap className="w-3 h-3" />
            Dispara: {triggerLabel}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggle}
            className="p-1.5 rounded-md text-muted-foreground hover:bg-muted"
            title={flow.isActive ? "Pausar" : "Ativar"}
          >
            <Power className={`w-4 h-4 ${flow.isActive ? "text-green-600" : ""}`} />
          </button>
          <button onClick={onDuplicate} className="p-1.5 rounded-md text-muted-foreground hover:bg-muted" title="Duplicar">
            <Copy className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-md text-muted-foreground hover:bg-red-50 hover:text-red-600" title="Excluir">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Timeline dos steps */}
      {flow.steps.length > 0 && (
        <div className="mt-4 pl-2">
          <div className="flex items-center gap-2 flex-wrap">
            {flow.steps.map((step, i) => (
              <div key={step.id} className="flex items-center gap-2">
                <StepChip step={step} />
                {i < flow.steps.length - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <span>{flow.steps.length} passo{flow.steps.length !== 1 ? "s" : ""} · {flow._count.executions} execuç{flow._count.executions === 1 ? "ão" : "ões"}</span>
        <Link href={`/crm/fluxos/${flow.id}`} className="text-primary hover:underline">
          Editar →
        </Link>
      </div>
    </div>
  );
}

function StepChip({ step }: { step: FlowStep }) {
  const iconAndColor = ACTION_META[step.actionType] || { icon: Zap, color: "#94a3b8", label: step.actionType };
  const Icon = iconAndColor.icon;
  const config = (step.actionConfig || {}) as any;
  const preview =
    step.actionType === "send_whatsapp" || step.actionType === "internal_reminder"
      ? config.templateName || (config.message || "").slice(0, 40) || "(sem template)"
      : step.actionType === "move_stage"
      ? `→ ${config.stageName || "estágio"}`
      : config.title || "";
  return (
    <div
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border max-w-[200px]"
      style={{
        borderColor: iconAndColor.color + "55",
        backgroundColor: iconAndColor.color + "10",
        color: iconAndColor.color,
      }}
      title={`${iconAndColor.label}${step.delayHours ? ` · ${step.delayHours}h após anterior` : ""}${preview ? `\n${preview}` : ""}`}
    >
      {step.delayHours > 0 && (
        <span className="inline-flex items-center gap-0.5 text-muted-foreground">
          <Clock className="w-3 h-3" />
          {formatHours(step.delayHours)}
        </span>
      )}
      <Icon className="w-3 h-3" />
      <span className="truncate">{preview || iconAndColor.label}</span>
    </div>
  );
}

const ACTION_META: Record<string, { icon: any; color: string; label: string }> = {
  send_whatsapp: { icon: MessageCircle, color: "#22c55e", label: "WhatsApp" },
  internal_reminder: { icon: Bell, color: "#f59e0b", label: "Lembrete" },
  move_stage: { icon: MoveRight, color: "#6366f1", label: "Mover" },
  create_task: { icon: Bell, color: "#3b82f6", label: "Tarefa" },
};

function describeTrigger(flow: Flow) {
  if (flow.triggerType === "LEAD_CREATED") return "quando novo lead é criado";
  if (flow.triggerType === "STAGE_ENTER") {
    const cond = describeCond(flow.triggerCondition);
    const stage = flow.triggerStage ? `entra em "${flow.triggerStage.name}"` : "muda de estágio";
    return cond ? `${stage} e ${cond}` : stage;
  }
  return flow.triggerType;
}

function describeCond(c: any): string {
  if (!c || typeof c !== "object") return "";
  if (c.source === "FORMS") return "origem = Forms site";
  if (c.source === "PROSPECCAO") return "origem = Prospecção";
  if (c.source === "INDICACAO") return "origem = Indicação";
  return "";
}

function formatHours(h: number): string {
  if (h === 0) return "imediato";
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  const rest = h % 24;
  return rest > 0 ? `${d}d${rest}h` : `${d}d`;
}
