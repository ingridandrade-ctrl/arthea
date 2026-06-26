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
  AlertCircle,
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

const PRIORITY_STYLES: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-green-100 text-green-700",
};

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
        {/* Service tags */}
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
        {/* Info Card */}
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

        {/* Deals + Diagnostics */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">Deals</h2>
          {lead.deals.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum deal</p>
          ) : (
            <div className="space-y-3">
              {lead.deals.map((deal: any) => (
                <div key={deal.id} className="border border-border rounded-lg p-3 space-y-2">
                  <p className="font-medium text-sm">{deal.title}</p>
                  <div className="flex items-center gap-2">
                    <StageSelector
                      dealId={deal.id}
                      currentStage={deal.stage}
                      stages={stages}
                      onChanged={fetchLead}
                    />
                    {deal.value && (
                      <span className="text-xs text-muted-foreground">
                        {formatCurrency(deal.value)}
                      </span>
                    )}
                  </div>

                  {/* Diagnostic notes */}
                  {deal.diagnosticNotes?.problems?.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Problemas identificados
                      </p>
                      {deal.diagnosticNotes.problems.map((p: any) => (
                        <div
                          key={p.id}
                          className={`flex items-start gap-2 text-xs p-1.5 rounded ${
                            PRIORITY_STYLES[p.priority] || ""
                          }`}
                        >
                          <span className="font-medium">{p.description}</span>
                          {p.suggestedService && (
                            <span className="text-[10px] opacity-75">
                              → {p.suggestedService}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Follow-ups */}
                  {deal.followUps?.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Follow-ups
                      </p>
                      {deal.followUps.map((fu: any) => (
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

        {/* Conversations */}
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
              Tem certeza que deseja excluir o lead <strong>{lead.name}</strong>? Todos os dados associados (deals, conversas, tarefas) serao perdidos. Esta acao nao pode ser desfeita.
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
  dealId,
  currentStage,
  stages,
  onChanged,
}: {
  dealId: string;
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
    await fetch(`/api/deals/${dealId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stageId }),
    });
    setUpdating(false);
    onChanged();
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
  const [deals, setDeals] = useState<any[]>(
    lead.deals.map((d: any) => ({
      id: d.id,
      title: d.title,
      value: d.value || "",
      stageId: d.stageId,
      serviceId: d.serviceId,
      isNew: false,
    }))
  );
  const [showNewDeal, setShowNewDeal] = useState(false);
  const [newDeal, setNewDeal] = useState({ title: "", value: "", serviceId: "", stageId: stages[0]?.id || "" });

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

    for (const deal of deals) {
      if (deal.isNew) {
        const res = await fetch("/api/deals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: deal.title,
            leadId: lead.id,
            serviceId: deal.serviceId,
            stageId: deal.stageId,
            value: deal.value ? parseFloat(deal.value) : null,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error || "Erro ao criar deal");
          setLoading(false);
          return;
        }
      } else {
        const original = lead.deals.find((d: any) => d.id === deal.id);
        const changed =
          deal.title !== original?.title ||
          String(deal.value || "") !== String(original?.value || "") ||
          deal.stageId !== original?.stageId;
        if (changed) {
          const res = await fetch(`/api/deals/${deal.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: deal.title,
              value: deal.value ? parseFloat(deal.value) : null,
              stageId: deal.stageId,
            }),
          });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            setError(data.error || "Erro ao atualizar deal");
            setLoading(false);
            return;
          }
        }
      }
    }

    onSaved();
  }

  function addNewDeal() {
    if (!newDeal.title || !newDeal.serviceId || !newDeal.stageId) return;
    setDeals([...deals, { ...newDeal, id: `new-${Date.now()}`, isNew: true }]);
    setNewDeal({ title: "", value: "", serviceId: "", stageId: stages[0]?.id || "" });
    setShowNewDeal(false);
  }

  function updateDeal(index: number, field: string, value: string) {
    const updated = [...deals];
    updated[index] = { ...updated[index], [field]: value };
    setDeals(updated);
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
          <label className="block text-sm font-medium mb-1">Observações</label>
          <textarea name="notes" rows={2} defaultValue={lead.notes || ""} className={inputClass} />
        </div>
      </div>

      {/* Deals section */}
      <div className="border-t border-border pt-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold">Deals</p>
          <button
            type="button"
            onClick={() => setShowNewDeal(true)}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <Plus className="w-3.5 h-3.5" /> Adicionar
          </button>
        </div>

        {deals.length === 0 && !showNewDeal && (
          <p className="text-xs text-muted-foreground">Nenhum deal</p>
        )}

        <div className="space-y-3">
          {deals.map((deal, i) => (
            <div key={deal.id} className="border border-border rounded-lg p-3 space-y-2">
              <div>
                <label className="block text-xs text-muted-foreground mb-0.5">Título</label>
                <input
                  value={deal.title}
                  onChange={(e) => updateDeal(i, "title", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-muted-foreground mb-0.5">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={deal.value}
                    onChange={(e) => updateDeal(i, "value", e.target.value)}
                    className={inputClass}
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-0.5">Estágio</label>
                  <select
                    value={deal.stageId}
                    onChange={(e) => updateDeal(i, "stageId", e.target.value)}
                    className={inputClass + " bg-card"}
                  >
                    {stages.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              {deal.isNew && (
                <button
                  type="button"
                  onClick={() => setDeals(deals.filter((_, j) => j !== i))}
                  className="text-xs text-red-500 hover:underline"
                >
                  Remover
                </button>
              )}
            </div>
          ))}

          {showNewDeal && (
            <div className="border border-dashed border-primary/40 rounded-lg p-3 space-y-2">
              <div>
                <label className="block text-xs text-muted-foreground mb-0.5">Título</label>
                <input
                  value={newDeal.title}
                  onChange={(e) => setNewDeal({ ...newDeal, title: e.target.value })}
                  className={inputClass}
                  placeholder="Nome do deal"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-muted-foreground mb-0.5">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newDeal.value}
                    onChange={(e) => setNewDeal({ ...newDeal, value: e.target.value })}
                    className={inputClass}
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-0.5">Serviço</label>
                  <select
                    value={newDeal.serviceId}
                    onChange={(e) => setNewDeal({ ...newDeal, serviceId: e.target.value })}
                    className={inputClass + " bg-card"}
                  >
                    <option value="" disabled>Selecione...</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-0.5">Estágio</label>
                <select
                  value={newDeal.stageId}
                  onChange={(e) => setNewDeal({ ...newDeal, stageId: e.target.value })}
                  className={inputClass + " bg-card"}
                >
                  {stages.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addNewDeal}
                  disabled={!newDeal.title || !newDeal.serviceId}
                  className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  Adicionar
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewDeal(false)}
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
