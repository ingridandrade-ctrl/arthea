"use client";

import { useEffect, useState, useDeferredValue, useMemo } from "react";
import { formatPhone } from "@/lib/utils";
import { Plus, Search, X, Pencil, Trash2, CheckSquare, Square, MinusSquare } from "lucide-react";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";
import { getServiceFields, type ServiceField } from "@/lib/service-fields";
import { LEAD_STATUSES, getLeadStatusLabel, getLeadStatusColor } from "@/lib/lead-status";
import { FilterBar, getDateRange, type DatePreset, type FilterService } from "@/components/crm/filter-bar";
import { LEAD_SOURCES, getSourceLabel, getSourceColor } from "@/lib/lead-source";

interface LeadService {
  id: string;
  service: { id: string; name: string; color: string; slug: string };
  stage: { id: string; name: string; color: string } | null;
  stageId?: string | null;
  value?: number | null;
  customData?: Record<string, string> | null;
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
  createdAt: string;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [services, setServices] = useState<FilterService[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [activeService, setActiveService] = useState("all");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<"delete" | "status" | null>(null);
  const [bulkStatus, setBulkStatus] = useState("ATIVO");
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((data) => setServices(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const url = useMemo(() => {
    const params = new URLSearchParams();
    if (activeService !== "all") params.set("service", activeService);
    if (deferredSearch) params.set("search", deferredSearch);
    const range = getDateRange(datePreset, customFrom, customTo);
    if (range) {
      params.set("from", range.from);
      params.set("to", range.to);
    }
    return `/api/leads?${params}`;
  }, [activeService, deferredSearch, datePreset, customFrom, customTo]);

  async function fetchLeads() {
    setLoading(true);
    const res = await fetch(url);
    const data = await res.json();
    setLeads(Array.isArray(data) ? data : []);
    setLoading(false);
    setSelectedIds(new Set());
  }

  useEffect(() => {
    fetchLeads();
  }, [url]);

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
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">Leads</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" />
          Novo Lead
        </button>
      </div>

      {/* Filtros */}
      <FilterBar
        services={services}
        activeService={activeService}
        onServiceChange={setActiveService}
        datePreset={datePreset}
        onDatePresetChange={setDatePreset}
        customFrom={customFrom}
        customTo={customTo}
        onCustomChange={(f, t) => { setCustomFrom(f); setCustomTo(t); }}
      />

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
              onClick={() => { setBulkAction("status"); setBulkStatus("ATIVO"); }}
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
                <th className="px-4 py-3 font-medium">Serviço</th>
                <th className="px-4 py-3 font-medium">Etapa</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Origem</th>
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    Carregando...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
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
                    <td className="px-4 py-3 whitespace-nowrap">{formatPhone(lead.phone)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {lead.services.length > 0 ? (
                          lead.services.map((ls) => <ServiceTag key={ls.service.id} service={ls.service} />)
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {lead.services.length > 0 ? (
                          lead.services.map((ls) =>
                            ls.stage ? <StageTag key={ls.id} stage={ls.stage} /> : <span key={ls.id} className="text-xs text-muted-foreground">—</span>
                          )
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
              Tem certeza que deseja excluir <strong>{selectedIds.size} lead{selectedIds.size !== 1 ? "s" : ""}</strong>? Todos os dados associados (serviços, conversas, tarefas) serão perdidos. Esta ação não pode ser desfeita.
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
              {LEAD_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
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
  const [stagesByService, setStagesByService] = useState<Record<string, any[]>>({});
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [serviceCustomData, setServiceCustomData] = useState<Record<string, Record<string, string>>>({});
  const [serviceStages, setServiceStages] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("ATIVO");
  const [source, setSource] = useState("PROSPECCAO");

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setServices(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    for (const id of selectedServiceIds) {
      if (stagesByService[id]) continue;
      const svc = services.find((s: any) => s.id === id);
      if (!svc) continue;
      fetch(`/api/pipeline/stages?service=${svc.slug}`)
        .then((r) => r.json())
        .then((data) => {
          const stages = data?.stages || [];
          setStagesByService((prev) => ({ ...prev, [id]: stages }));
          setServiceStages((prev) =>
            prev[id] ? prev : { ...prev, [id]: stages[0]?.id || "" }
          );
        })
        .catch(() => {});
    }
  }, [selectedServiceIds, services, stagesByService]);

  function toggleService(id: string) {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function updateCustomField(serviceId: string, key: string, value: string) {
    setServiceCustomData((prev) => ({
      ...prev,
      [serviceId]: { ...(prev[serviceId] || {}), [key]: value },
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const customDataForSubmit: Record<string, Record<string, string>> = {};
    for (const id of selectedServiceIds) {
      const data = serviceCustomData[id];
      if (data && Object.values(data).some((v) => v && String(v).trim() !== "")) {
        customDataForSubmit[id] = data;
      }
    }
    const stageForSubmit: Record<string, string> = {};
    for (const id of selectedServiceIds) {
      if (serviceStages[id]) stageForSubmit[id] = serviceStages[id];
    }
    const body = {
      name: formData.get("name"),
      phone: formData.get("phone"),
      email: formData.get("email") || undefined,
      company: formData.get("company") || undefined,
      source,
      status,
      serviceIds: selectedServiceIds.length > 0 ? selectedServiceIds : undefined,
      serviceCustomData: Object.keys(customDataForSubmit).length > 0 ? customDataForSubmit : undefined,
      serviceStages: Object.keys(stageForSubmit).length > 0 ? stageForSubmit : undefined,
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
      <div className="bg-card rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Origem *</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {LEAD_SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status *</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {LEAD_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
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

              {services
                .filter((s: any) => selectedServiceIds.includes(s.id))
                .map((s: any) => {
                  const stages = stagesByService[s.id] || [];
                  const fields = getServiceFields(s.slug);
                  return (
                    <div
                      key={s.id}
                      className="mt-3 border-l-2 pl-3 py-2 bg-muted/30 rounded-r space-y-2"
                      style={{ borderColor: s.color }}
                    >
                      <p className="text-xs font-semibold text-muted-foreground">
                        {s.name}
                      </p>
                      {stages.length > 0 && (
                        <div>
                          <label className="text-xs text-muted-foreground block mb-0.5">Etapa inicial</label>
                          <select
                            value={serviceStages[s.id] || ""}
                            onChange={(e) =>
                              setServiceStages((prev) => ({ ...prev, [s.id]: e.target.value }))
                            }
                            className="w-full px-2 py-1 border border-border rounded text-xs bg-card focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            {stages.map((st: any) => (
                              <option key={st.id} value={st.id}>{st.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      {fields.length > 0 && (
                        <ServiceFieldsBlock
                          service={s}
                          values={serviceCustomData[s.id] || {}}
                          onChange={(k, v) => updateCustomField(s.id, k, v)}
                          inline
                        />
                      )}
                    </div>
                  );
                })}
            </div>
          )}
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
  const [stagesByService, setStagesByService] = useState<Record<string, any[]>>({});
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(
    lead.services.map((ls) => ls.service.id)
  );
  const [status, setStatus] = useState(lead.status);
  const [source, setSource] = useState(lead.source || "PROSPECCAO");

  // Estado por-serviço — populado a partir do lead atual
  const [serviceCustomData, setServiceCustomData] = useState<Record<string, Record<string, string>>>(
    () => {
      const m: Record<string, Record<string, string>> = {};
      for (const ls of lead.services as any[]) {
        m[ls.service.id] = (ls.customData as Record<string, string>) || {};
      }
      return m;
    },
  );
  const [serviceStages, setServiceStages] = useState<Record<string, string>>(
    () => {
      const m: Record<string, string> = {};
      for (const ls of lead.services as any[]) {
        m[ls.service.id] = ls.stage?.id || ls.stageId || "";
      }
      return m;
    },
  );
  const [serviceValues, setServiceValues] = useState<Record<string, string>>(
    () => {
      const m: Record<string, string> = {};
      for (const ls of lead.services as any[]) {
        m[ls.service.id] = ls.value != null ? String(ls.value) : "";
      }
      return m;
    },
  );

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setServices(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    for (const id of selectedServiceIds) {
      if (stagesByService[id]) continue;
      const svc = services.find((s: any) => s.id === id);
      if (!svc) continue;
      fetch(`/api/pipeline/stages?service=${svc.slug}`)
        .then((r) => r.json())
        .then((data) => {
          const stages = data?.stages || [];
          setStagesByService((prev) => ({ ...prev, [id]: stages }));
          setServiceStages((prev) => (prev[id] ? prev : { ...prev, [id]: stages[0]?.id || "" }));
        })
        .catch(() => {});
    }
  }, [selectedServiceIds, services, stagesByService]);

  function toggleService(id: string) {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function updateCustomField(serviceId: string, key: string, value: string) {
    setServiceCustomData((prev) => ({
      ...prev,
      [serviceId]: { ...(prev[serviceId] || {}), [key]: value },
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);

    const servicesPayload = selectedServiceIds.map((id) => ({
      serviceId: id,
      stageId: serviceStages[id] || null,
      value: serviceValues[id] !== "" ? Number(serviceValues[id]) : null,
      customData: serviceCustomData[id] && Object.keys(serviceCustomData[id]).length > 0
        ? serviceCustomData[id]
        : undefined,
    }));

    const res = await fetch(`/api/leads/${lead.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        phone: fd.get("phone"),
        email: fd.get("email") || null,
        company: fd.get("company") || null,
        source,
        status,
        notes: fd.get("notes") || null,
        services: servicesPayload,
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

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Origem *</label>
          <select value={source} onChange={(e) => setSource(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            {LEAD_SOURCES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Status *</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            {LEAD_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
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
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${selectedServiceIds.includes(s.id) ? "text-white" : "bg-muted text-muted-foreground"}`}
                style={selectedServiceIds.includes(s.id) ? { backgroundColor: s.color } : undefined}
              >
                {s.name}
              </button>
            ))}
          </div>

          {services
            .filter((s: any) => selectedServiceIds.includes(s.id))
            .map((s: any) => {
              const stages = stagesByService[s.id] || [];
              const fields = getServiceFields(s.slug);
              return (
                <div
                  key={s.id}
                  className="mt-3 border-l-2 pl-3 py-2 bg-muted/30 rounded-r space-y-2"
                  style={{ borderColor: s.color }}
                >
                  <p className="text-xs font-semibold text-muted-foreground">{s.name}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {stages.length > 0 && (
                      <div>
                        <label className="text-xs text-muted-foreground block mb-0.5">Etapa</label>
                        <select
                          value={serviceStages[s.id] || ""}
                          onChange={(e) =>
                            setServiceStages((prev) => ({ ...prev, [s.id]: e.target.value }))
                          }
                          className="w-full px-2 py-1 border border-border rounded text-xs bg-card focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="">—</option>
                          {stages.map((st: any) => (
                            <option key={st.id} value={st.id}>{st.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div>
                      <label className="text-xs text-muted-foreground block mb-0.5">Valor (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={serviceValues[s.id] || ""}
                        onChange={(e) =>
                          setServiceValues((prev) => ({ ...prev, [s.id]: e.target.value }))
                        }
                        placeholder="0,00"
                        className="w-full px-2 py-1 border border-border rounded text-xs bg-card focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                  {fields.length > 0 && (
                    <ServiceFieldsBlock
                      service={s}
                      values={serviceCustomData[s.id] || {}}
                      onChange={(k, v) => updateCustomField(s.id, k, v)}
                      inline
                    />
                  )}
                </div>
              );
            })}
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
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getLeadStatusColor(status)}`}>
      {getLeadStatusLabel(status)}
    </span>
  );
}

function SourceBadge({ source }: { source: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getSourceColor(source)}`}>
      {getSourceLabel(source)}
    </span>
  );
}

function ServiceTag({ service }: { service: { name: string; color: string } }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium text-white shadow-sm"
      style={{ backgroundColor: service.color }}
    >
      {service.name}
    </span>
  );
}

function StageTag({ stage }: { stage: { name: string; color: string } }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border"
      style={{
        backgroundColor: stage.color + "1A",
        borderColor: stage.color + "55",
        color: stage.color,
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: stage.color }} />
      {stage.name}
    </span>
  );
}

function ServiceFieldsBlock({
  service,
  values,
  onChange,
  inline = false,
}: {
  service: { name: string; slug: string; color: string };
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  inline?: boolean;
}) {
  const fields = getServiceFields(service.slug);
  if (fields.length === 0) return null;

  const grid = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {fields.map((f: ServiceField) => (
        <div key={f.key} className={f.type === "textarea" ? "md:col-span-2" : ""}>
          <label className="text-xs text-muted-foreground block mb-0.5">{f.label}</label>
          {f.type === "select" ? (
            <select
              value={values[f.key] || ""}
              onChange={(e) => onChange(f.key, e.target.value)}
              className="w-full px-2 py-1 border border-border rounded text-xs bg-card focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">—</option>
              {f.options?.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          ) : f.type === "textarea" ? (
            <textarea
              value={values[f.key] || ""}
              onChange={(e) => onChange(f.key, e.target.value)}
              rows={2}
              placeholder={f.placeholder}
              className="w-full px-2 py-1 border border-border rounded text-xs bg-card focus:outline-none focus:ring-1 focus:ring-primary"
            />
          ) : (
            <input
              type="text"
              value={values[f.key] || ""}
              onChange={(e) => onChange(f.key, e.target.value)}
              placeholder={f.placeholder}
              className="w-full px-2 py-1 border border-border rounded text-xs bg-card focus:outline-none focus:ring-1 focus:ring-primary"
            />
          )}
        </div>
      ))}
    </div>
  );

  if (inline) return grid;

  return (
    <div
      className="mt-3 border-l-2 pl-3 py-2 bg-muted/30 rounded-r"
      style={{ borderColor: service.color }}
    >
      <p className="text-xs font-semibold text-muted-foreground mb-2">
        Detalhes — {service.name}
      </p>
      {grid}
    </div>
  );
}
