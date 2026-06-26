"use client";

import { useEffect, useState, useDeferredValue } from "react";
import { useServiceFilter } from "@/lib/hooks/use-service-filter";
import { formatPhone } from "@/lib/utils";
import { Plus, Search, X, Pencil, Trash2, CheckSquare, Square, MinusSquare } from "lucide-react";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";

interface LeadService {
  service: { id: string; name: string; color: string; slug: string };
}

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  company: string | null;
  source: string;
  status: string;
  services: LeadService[];
  deals: any[];
  createdAt: string;
}

export default function LeadsPage() {
  const { activeService } = useServiceFilter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<"delete" | "status" | null>(null);
  const [bulkStatus, setBulkStatus] = useState("NEW");
  const [bulkLoading, setBulkLoading] = useState(false);

  async function fetchLeads() {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeService !== "all") params.set("service", activeService);
    if (deferredSearch) params.set("search", deferredSearch);
    const res = await fetch(`/api/leads?${params}`);
    const data = await res.json();
    setLeads(Array.isArray(data) ? data : []);
    setLoading(false);
    setSelectedIds(new Set());
  }

  useEffect(() => {
    fetchLeads();
  }, [activeService, deferredSearch]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === leads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(leads.map((l) => l.id)));
    }
  }

  async function handleBulkDelete() {
    setBulkLoading(true);
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      await fetch(`/api/leads/${id}`, { method: "DELETE" });
    }
    setBulkLoading(false);
    setBulkAction(null);
    fetchLeads();
  }

  async function handleBulkStatusChange() {
    setBulkLoading(true);
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      await fetch(`/api/leads/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: bulkStatus }),
      });
    }
    setBulkLoading(false);
    setBulkAction(null);
    fetchLeads();
  }

  const allSelected = leads.length > 0 && selectedIds.size === leads.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < leads.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Leads</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" />
          Novo Lead
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por nome, telefone, email ou empresa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-medium text-primary">
            {selectedIds.size} lead{selectedIds.size !== 1 ? "s" : ""} selecionado{selectedIds.size !== 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setBulkAction("status"); setBulkStatus("NEW"); }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-border hover:bg-muted transition"
            >
              Alterar Status
            </button>
            <button
              onClick={() => setBulkAction("delete")}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition"
            >
              Excluir Selecionados
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="p-1.5 rounded-lg hover:bg-muted transition"
              title="Limpar seleção"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground bg-muted/50">
                <th className="px-4 py-3 w-10">
                  <button onClick={toggleSelectAll} className="flex items-center">
                    {allSelected ? (
                      <CheckSquare className="w-4 h-4 text-primary" />
                    ) : someSelected ? (
                      <MinusSquare className="w-4 h-4 text-primary" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-300" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Telefone</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Empresa</th>
                <th className="px-4 py-3 font-medium">Serviços</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Origem</th>
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">
                    Carregando...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhum lead encontrado
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className={`border-t border-border hover:bg-muted/30 transition ${
                      selectedIds.has(lead.id) ? "bg-primary/5" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <button onClick={() => toggleSelect(lead.id)} className="flex items-center">
                        {selectedIds.has(lead.id) ? (
                          <CheckSquare className="w-4 h-4 text-primary" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-300 hover:text-gray-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/crm/leads/${lead.id}`} className="font-medium text-primary hover:underline">
                        {lead.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{formatPhone(lead.phone)}</td>
                    <td className="px-4 py-3">{lead.email || "-"}</td>
                    <td className="px-4 py-3">{lead.company || "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {lead.services.length > 0 ? (
                          lead.services.map((ls) => (
                            <span
                              key={ls.service.id}
                              className="px-2 py-0.5 rounded-full text-[10px] font-medium text-white"
                              style={{ backgroundColor: ls.service.color }}
                            >
                              {ls.service.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="px-4 py-3">
                      <SourceBadge source={lead.source} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(lead.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingLead(lead); }}
                          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeletingLead(lead); }}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 transition"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal - New Lead */}
      {showForm && (
        <LeadFormModal
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            fetchLeads();
          }}
        />
      )}

      {/* Modal - Edit Lead */}
      {editingLead && (
        <Modal title="Editar Lead" onClose={() => setEditingLead(null)}>
          <EditLeadInlineForm
            lead={editingLead}
            onSaved={() => { setEditingLead(null); fetchLeads(); }}
          />
        </Modal>
      )}

      {/* Modal - Delete Single */}
      {deletingLead && (
        <Modal title="Excluir Lead" onClose={() => setDeletingLead(null)}>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Tem certeza que deseja excluir o lead <strong>{deletingLead.name}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingLead(null)}
                className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  setDeleting(true);
                  const res = await fetch(`/api/leads/${deletingLead.id}`, { method: "DELETE" });
                  if (res.ok) {
                    setDeletingLead(null);
                    fetchLeads();
                  } else {
                    const data = await res.json().catch(() => ({}));
                    alert(data.error || "Erro ao excluir lead");
                  }
                  setDeleting(false);
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

      {/* Modal - Bulk Delete */}
      {bulkAction === "delete" && (
        <Modal title="Excluir Leads Selecionados" onClose={() => setBulkAction(null)}>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Tem certeza que deseja excluir <strong>{selectedIds.size} lead{selectedIds.size !== 1 ? "s" : ""}</strong>? Todos os dados associados (deals, conversas, tarefas) serão perdidos. Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setBulkAction(null)}
                className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={bulkLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition disabled:opacity-50"
              >
                {bulkLoading ? `Excluindo (${selectedIds.size})...` : `Excluir ${selectedIds.size}`}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal - Bulk Status Change */}
      {bulkAction === "status" && (
        <Modal title="Alterar Status" onClose={() => setBulkAction(null)}>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Alterar o status de <strong>{selectedIds.size} lead{selectedIds.size !== 1 ? "s" : ""}</strong> para:
            </p>
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="NEW">Novo</option>
              <option value="CONTACTED">Contatado</option>
              <option value="QUALIFIED">Qualificado</option>
              <option value="UNQUALIFIED">Desqualificado</option>
            </select>
            <div className="flex gap-3">
              <button
                onClick={() => setBulkAction(null)}
                className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleBulkStatusChange}
                disabled={bulkLoading}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
              >
                {bulkLoading ? "Salvando..." : "Alterar Status"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function LeadFormModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [services, setServices] = useState<any[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setServices(data);
      })
      .catch(() => {});
  }, []);

  function toggleService(id: string) {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const body = {
      name: formData.get("name"),
      phone: formData.get("phone"),
      email: formData.get("email") || undefined,
      company: formData.get("company") || undefined,
      source: formData.get("source"),
      serviceIds: selectedServiceIds.length > 0 ? selectedServiceIds : undefined,
      notes: formData.get("notes") || undefined,
    };

    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Erro ao criar lead");
      setLoading(false);
      return;
    }

    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Novo Lead</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome *</label>
            <input name="name" required className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Telefone (WhatsApp) *</label>
            <input name="phone" required placeholder="5511999999999" className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input name="email" type="email" className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Empresa</label>
            <input name="company" className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          {services.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-1">Serviços</label>
              <div className="flex flex-wrap gap-2">
                {services.map((s: any) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleService(s.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                      selectedServiceIds.includes(s.id)
                        ? "text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                    style={
                      selectedServiceIds.includes(s.id)
                        ? { backgroundColor: s.color }
                        : undefined
                    }
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Origem</label>
            <select name="source" className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="MANUAL">Manual</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="WEBSITE">Website</option>
              <option value="REFERRAL">Indicação</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Observações</label>
            <textarea name="notes" rows={3} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "Salvando..." : "Salvar Lead"}
          </button>
        </form>
      </div>
    </div>
  );
}

function EditLeadInlineForm({ lead, onSaved }: { lead: Lead; onSaved: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [services, setServices] = useState<any[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(
    lead.services.map((ls) => ls.service.id)
  );
  const [status, setStatus] = useState(lead.status);

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setServices(data); })
      .catch(() => {});
  }, []);

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
        status,
        notes: fd.get("notes") || null,
        serviceIds: selectedServiceIds,
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
        <label className="block text-sm font-medium mb-1">Nome *</label>
        <input name="name" defaultValue={lead.name} required className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Telefone *</label>
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
        <label className="block text-sm font-medium mb-1">Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="NEW">Novo</option>
          <option value="CONTACTED">Contatado</option>
          <option value="QUALIFIED">Qualificado</option>
          <option value="UNQUALIFIED">Desqualificado</option>
        </select>
      </div>
      {services.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-1">Serviços</label>
          <div className="flex flex-wrap gap-2">
            {services.map((s: any) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedServiceIds((prev) => prev.includes(s.id) ? prev.filter((x) => x !== s.id) : [...prev, s.id])}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${selectedServiceIds.includes(s.id) ? "text-white" : "bg-muted text-muted-foreground"}`}
                style={selectedServiceIds.includes(s.id) ? { backgroundColor: s.color } : undefined}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}
      <div>
        <label className="block text-sm font-medium mb-1">Observações</label>
        <textarea name="notes" rows={3} defaultValue={(lead as any).notes || ""} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
      </div>
      <button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:opacity-90 transition disabled:opacity-50">
        {loading ? "Salvando..." : "Salvar"}
      </button>
    </form>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    NEW: "bg-blue-100 text-blue-700",
    CONTACTED: "bg-yellow-100 text-yellow-700",
    QUALIFIED: "bg-green-100 text-green-700",
    UNQUALIFIED: "bg-red-100 text-red-700",
  };
  const labels: Record<string, string> = {
    NEW: "Novo",
    CONTACTED: "Contatado",
    QUALIFIED: "Qualificado",
    UNQUALIFIED: "Desqualificado",
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || ""}`}>
      {labels[status] || status}
    </span>
  );
}

function SourceBadge({ source }: { source: string }) {
  const labels: Record<string, string> = {
    WHATSAPP: "WhatsApp",
    WEBSITE: "Website",
    MANUAL: "Manual",
    REFERRAL: "Indicação",
    QUIZ: "Quiz",
  };
  return (
    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
      {labels[source] || source}
    </span>
  );
}
