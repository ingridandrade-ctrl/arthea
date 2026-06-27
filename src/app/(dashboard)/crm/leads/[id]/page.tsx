"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatPhone, formatDate, formatCurrency } from "@/lib/utils";
import {
  ArrowLeft,
  Phone,
  Mail,
  Building,
  MessageCircle,
  Clock,
  Tag,
  Pencil,
  Trash2,
  ChevronDown,
  Loader2,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";
import { getServiceFields, type ServiceField } from "@/lib/service-fields";

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [stages, setStages] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  function fetchLead() {
    fetch(`/api/leads/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setLead(data);
        setLoading(false);
      });
  }

  useEffect(() => {
    fetchLead();
    fetch("/api/pipeline/stages")
      .then((r) => r.json())
      .then((data) => setStages(data.stages || []));
    fetch("/api/services")
      .then((r) => r.json())
      .then((data) => setServices(Array.isArray(data) ? data : []));
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!lead) {
    return <div className="text-center py-8 text-muted-foreground">Lead nao encontrado</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold">{lead.name}</h1>
        <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg hover:bg-muted" title="Editar">
          <Pencil className="w-4 h-4 text-muted-foreground" />
        </button>
        <button onClick={() => setShowDelete(true)} className="p-1.5 rounded-lg hover:bg-red-50" title="Excluir">
          <Trash2 className="w-4 h-4 text-muted-foreground hover:text-red-600" />
        </button>
        <div className="flex gap-1">
          {lead.services?.map((ls: any) => (
            <span
              key={ls.service.id}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs text-white font-medium"
              style={{ backgroundColor: ls.service.color }}
            >
              <Tag className="w-3 h-3" />
              {ls.service.name}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Informacoes</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{formatPhone(lead.phone)}</span>
            </div>
            {lead.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{lead.email}</span>
              </div>
            )}
            {lead.company && (
              <div className="flex items-center gap-3">
                <Building className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{lead.company}</span>
              </div>
            )}
          </div>
          {lead.notes && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Observacoes</p>
              <p className="text-sm">{lead.notes}</p>
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            Criado em {formatDate(lead.createdAt)}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">Servicos</h2>
          {(!lead.services || lead.services.length === 0) ? (
            <p className="text-sm text-muted-foreground">Nenhum servico associado</p>
          ) : (
            <div className="space-y-3">
              {lead.services.map((ls: any) => (
                <div key={ls.id} className="border border-border rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs text-white font-medium"
                      style={{ backgroundColor: ls.service.color }}
                    >
                      <Tag className="w-3 h-3" />
                      {ls.service.name}
                    </span>
                    {ls.value && (
                      <span className="text-xs font-semibold text-green-600">
                        {formatCurrency(ls.value)}
                      </span>
                    )}
                  </div>

                  <StageSelector
                    leadServiceId={ls.id}
                    currentStage={ls.stage}
                    stages={stages}
                    onChanged={fetchLead}
                  />

                  <ServiceCustomFields leadService={ls} onSaved={fetchLead} />

                  {ls.followUps?.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Follow-ups
                      </p>
                      {ls.followUps.map((fu: any) => (
                        <div
                          key={fu.id}
                          className={`text-xs p-1.5 rounded flex items-center justify-between ${
                            fu.status === "pending"
                              ? "bg-yellow-50 text-yellow-700"
                              : fu.status === "sent"
                              ? "bg-green-50 text-green-700"
                              : "bg-gray-50 text-gray-500"
                          }`}
                        >
                          <span className="truncate flex-1">
                            #{fu.order} - {fu.messageTemplate.substring(0, 60)}...
                          </span>
                          <span className="font-medium ml-2 shrink-0">
                            {fu.status === "pending"
                              ? "Pendente"
                              : fu.status === "sent"
                              ? "Enviado"
                              : "Pulado"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">Conversas</h2>
          {lead.conversations.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma conversa</p>
          ) : (
            <div className="space-y-3">
              {lead.conversations.map((conv: any) => (
                <Link
                  key={conv.id}
                  href={`/crm/conversations/${conv.id}`}
                  className="block border border-border rounded-lg p-3 hover:bg-muted/30 transition"
                >
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {conv.isAiActive ? "IA ativa" : "Atendimento humano"}
                    </span>
                  </div>
                  {conv.messages[0] && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {conv.messages[0].content}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {editing && (
        <Modal title="Editar Lead" onClose={() => setEditing(false)}>
          <EditLeadForm
            lead={lead}
            stages={stages}
            services={services}
            onSaved={() => { setEditing(false); fetchLead(); }}
          />
        </Modal>
      )}

      {showDelete && (
        <Modal title="Excluir Lead" onClose={() => setShowDelete(false)}>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Tem certeza que deseja excluir o lead <strong>{lead.name}</strong>? Todos os dados associados (servicos, conversas, tarefas) serao perdidos. Esta acao nao pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDelete(false)}
                className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  setDeleting(true);
                  const res = await fetch(`/api/leads/${lead.id}`, { method: "DELETE" });
                  if (res.ok) {
                    router.push("/crm/leads");
                  } else {
                    const data = await res.json().catch(() => ({}));
                    alert(data.error || "Erro ao excluir lead");
                    setDeleting(false);
                  }
                }}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition disabled:opacity-50"
              >
                {deleting ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function StageSelector({
  leadServiceId,
  currentStage,
  stages,
  onChanged,
}: {
  leadServiceId: string;
  currentStage: any;
  stages: any[];
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function changeStage(stageId: string) {
    if (stageId === currentStage?.id) { setOpen(false); return; }
    setUpdating(true);
    setOpen(false);
    await fetch(`/api/deals/${leadServiceId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stageId }),
    });
    setUpdating(false);
    onChanged();
  }

  if (!currentStage) {
    return (
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(!open)}
          disabled={updating}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground cursor-pointer hover:bg-muted/80 transition"
        >
          {updating ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <>
              Sem estagio
              <ChevronDown className="w-3 h-3" />
            </>
          )}
        </button>
        {open && (
          <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 min-w-[160px] py-1">
            {stages.map((s) => (
              <button
                key={s.id}
                onClick={() => changeStage(s.id)}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted/50 transition flex items-center gap-2"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: s.color }}
                />
                {s.name}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        disabled={updating}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs text-white cursor-pointer hover:opacity-90 transition"
        style={{ backgroundColor: currentStage?.color || "#6366f1" }}
      >
        {updating ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <>
            {currentStage?.name}
            <ChevronDown className="w-3 h-3" />
          </>
        )}
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 min-w-[160px] py-1">
          {stages.map((s) => (
            <button
              key={s.id}
              onClick={() => changeStage(s.id)}
              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-muted/50 transition flex items-center gap-2 ${
                s.id === currentStage?.id ? "font-semibold" : ""
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: s.color }}
              />
              {s.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function EditLeadForm({
  lead,
  stages,
  services,
  onSaved,
}: {
  lead: any;
  stages: any[];
  services: any[];
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [leadServices, setLeadServices] = useState<any[]>(
    (lead.services || []).map((ls: any) => ({
      id: ls.id,
      serviceId: ls.serviceId || ls.service?.id,
      serviceName: ls.service?.name,
      value: ls.value || "",
      stageId: ls.stageId || ls.stage?.id || "",
      isExisting: true,
    }))
  );
  const [showAddService, setShowAddService] = useState(false);
  const [newService, setNewService] = useState({ serviceId: "", value: "", stageId: stages[0]?.id || "" });

  const existingServiceIds = leadServices.map((ls: any) => ls.serviceId);
  const availableServices = services.filter((s: any) => !existingServiceIds.includes(s.id));

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const fd = new FormData(e.currentTarget);

    const leadRes = await fetch(`/api/leads/${lead.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        phone: fd.get("phone"),
        email: fd.get("email") || null,
        company: fd.get("company") || null,
        notes: fd.get("notes") || null,
      }),
    });
    if (!leadRes.ok) {
      const data = await leadRes.json().catch(() => ({}));
      setError(data.error || "Erro ao salvar lead");
      setLoading(false);
      return;
    }

    for (const ls of leadServices) {
      if (!ls.isExisting) {
        const res = await fetch("/api/deals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            leadId: lead.id,
            serviceId: ls.serviceId,
            stageId: ls.stageId || null,
            value: ls.value ? parseFloat(ls.value) : null,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error || "Erro ao adicionar servico");
          setLoading(false);
          return;
        }
      } else {
        const original = (lead.services || []).find((s: any) => s.id === ls.id);
        const changed =
          String(ls.value || "") !== String(original?.value || "") ||
          ls.stageId !== (original?.stageId || original?.stage?.id || "");
        if (changed) {
          const res = await fetch(`/api/deals/${ls.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              value: ls.value ? parseFloat(ls.value) : null,
              stageId: ls.stageId || null,
            }),
          });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            setError(data.error || "Erro ao atualizar servico");
            setLoading(false);
            return;
          }
        }
      }
    }

    onSaved();
  }

  function addNewService() {
    if (!newService.serviceId) return;
    const svc = services.find((s: any) => s.id === newService.serviceId);
    setLeadServices([...leadServices, {
      id: `new-${Date.now()}`,
      serviceId: newService.serviceId,
      serviceName: svc?.name || "",
      value: newService.value,
      stageId: newService.stageId,
      isExisting: false,
    }]);
    setNewService({ serviceId: "", value: "", stageId: stages[0]?.id || "" });
    setShowAddService(false);
  }

  function updateLeadService(index: number, field: string, value: string) {
    const updated = [...leadServices];
    updated[index] = { ...updated[index], [field]: value };
    setLeadServices(updated);
  }

  const inputClass = "w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>}

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Nome</label>
          <input name="name" defaultValue={lead.name} required className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Telefone</label>
          <input name="phone" defaultValue={lead.phone} required className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input name="email" type="email" defaultValue={lead.email || ""} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Empresa</label>
          <input name="company" defaultValue={lead.company || ""} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Observacoes</label>
          <textarea name="notes" rows={2} defaultValue={lead.notes || ""} className={inputClass} />
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold">Servicos</p>
          {availableServices.length > 0 && (
            <button
              type="button"
              onClick={() => setShowAddService(true)}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar
            </button>
          )}
        </div>

        {leadServices.length === 0 && !showAddService && (
          <p className="text-xs text-muted-foreground">Nenhum servico</p>
        )}

        <div className="space-y-3">
          {leadServices.map((ls, i) => (
            <div key={ls.id} className="border border-border rounded-lg p-3 space-y-2">
              <div className="bg-muted/50 rounded-lg px-3 py-1.5">
                <p className="text-xs text-muted-foreground">Servico</p>
                <p className="text-sm font-medium">{ls.serviceName}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-muted-foreground mb-0.5">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={ls.value}
                    onChange={(e) => updateLeadService(i, "value", e.target.value)}
                    className={inputClass}
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-0.5">Estagio</label>
                  <select
                    value={ls.stageId}
                    onChange={(e) => updateLeadService(i, "stageId", e.target.value)}
                    className={inputClass + " bg-card"}
                  >
                    <option value="">Sem estagio</option>
                    {stages.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              {!ls.isExisting && (
                <button
                  type="button"
                  onClick={() => setLeadServices(leadServices.filter((_, j) => j !== i))}
                  className="text-xs text-red-500 hover:underline"
                >
                  Remover
                </button>
              )}
            </div>
          ))}

          {showAddService && (
            <div className="border border-dashed border-primary/40 rounded-lg p-3 space-y-2">
              <div>
                <label className="block text-xs text-muted-foreground mb-0.5">Servico</label>
                <select
                  value={newService.serviceId}
                  onChange={(e) => setNewService({ ...newService, serviceId: e.target.value })}
                  className={inputClass + " bg-card"}
                >
                  <option value="" disabled>Selecione...</option>
                  {availableServices.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-muted-foreground mb-0.5">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newService.value}
                    onChange={(e) => setNewService({ ...newService, value: e.target.value })}
                    className={inputClass}
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-0.5">Estagio</label>
                  <select
                    value={newService.stageId}
                    onChange={(e) => setNewService({ ...newService, stageId: e.target.value })}
                    className={inputClass + " bg-card"}
                  >
                    <option value="">Sem estagio</option>
                    {stages.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addNewService}
                  disabled={!newService.serviceId}
                  className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  Adicionar
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddService(false)}
                  className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
      >
        {loading ? "Salvando..." : "Salvar"}
      </button>
    </form>
  );
}

function ServiceCustomFields({
  leadService,
  onSaved,
}: {
  leadService: any;
  onSaved: () => void;
}) {
  const fields = getServiceFields(leadService.service.slug);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<Record<string, string>>(
    () => (leadService.customData as Record<string, string>) || {}
  );

  if (fields.length === 0) return null;

  const filled = fields.filter((f) => values[f.key] && String(values[f.key]).trim() !== "");

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/deals/${leadService.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customData: values }),
    });
    setSaving(false);
    if (res.ok) {
      setEditing(false);
      onSaved();
    }
  }

  function getOptionLabel(field: ServiceField, value: string) {
    if (field.type !== "select" || !field.options) return value;
    return field.options.find((o) => o.value === value)?.label || value;
  }

  if (!editing) {
    return (
      <div className="mt-2 border-t border-border pt-2">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-semibold text-muted-foreground">
            Detalhes do serviço ({filled.length}/{fields.length} preenchidos)
          </p>
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-primary hover:underline"
          >
            {filled.length === 0 ? "Preencher" : "Editar"}
          </button>
        </div>
        {filled.length > 0 && (
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
            {filled.map((f) => (
              <div key={f.key} className="truncate">
                <span className="text-muted-foreground">{f.label}: </span>
                <span className="font-medium">{getOptionLabel(f, values[f.key])}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-2 border-t border-border pt-2 space-y-2 bg-muted/30 -mx-3 -mb-3 px-3 pb-3 rounded-b-lg">
      <p className="text-xs font-semibold text-muted-foreground">Detalhes do serviço</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {fields.map((f) => (
          <div key={f.key} className={f.type === "textarea" ? "md:col-span-2" : ""}>
            <label className="text-xs text-muted-foreground block mb-0.5">{f.label}</label>
            {f.type === "select" ? (
              <select
                value={values[f.key] || ""}
                onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                className="w-full px-2 py-1 border border-border rounded text-xs bg-card focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">—</option>
                {f.options?.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : f.type === "textarea" ? (
              <textarea
                value={values[f.key] || ""}
                onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                rows={2}
                placeholder={f.placeholder}
                className="w-full px-2 py-1 border border-border rounded text-xs bg-card focus:outline-none focus:ring-1 focus:ring-primary"
              />
            ) : (
              <input
                type="text"
                value={values[f.key] || ""}
                onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                placeholder={f.placeholder}
                className="w-full px-2 py-1 border border-border rounded text-xs bg-card focus:outline-none focus:ring-1 focus:ring-primary"
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2 justify-end">
        <button
          onClick={() => {
            setValues((leadService.customData as Record<string, string>) || {});
            setEditing(false);
          }}
          className="px-3 py-1 text-xs rounded border border-border hover:bg-muted"
        >
          Cancelar
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="px-3 py-1 text-xs rounded bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </div>
  );
}
