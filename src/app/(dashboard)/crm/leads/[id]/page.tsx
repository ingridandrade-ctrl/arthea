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

function EditLeadForm({ lead, onSaved }: { lead: any; onSaved: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`/api/leads/${lead.id}`, {
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
        <label className="block text-sm font-medium mb-1">Nome</label>
        <input name="name" defaultValue={lead.name} required className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Telefone</label>
        <input name="phone" defaultValue={lead.phone} required className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input name="email" type="email" defaultValue={lead.email || ""} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Empresa</label>
        <input name="company" defaultValue={lead.company || ""} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Observacoes</label>
        <textarea name="notes" rows={3} defaultValue={lead.notes || ""} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
      </div>
      <button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:opacity-90 transition disabled:opacity-50">
        {loading ? "Salvando..." : "Salvar"}
      </button>
    </form>
  );
}
