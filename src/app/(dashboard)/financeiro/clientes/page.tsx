"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Search, Pencil, Trash2, FileText, ArrowLeft } from "lucide-react";
import { Modal } from "@/components/ui/modal";

const CLIENT_TYPES = [
  { key: "ALL", label: "Todos" },
  { key: "ACTIVE", label: "Ativos" },
  { key: "TEMPORARY", label: "Temporários" },
  { key: "INACTIVE", label: "Inativos" },
];

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Ativo", PAUSED: "Pausado", CANCELED: "Cancelado", COMPLETED: "Concluído",
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  PAUSED: "bg-yellow-100 text-yellow-700",
  CANCELED: "bg-red-100 text-red-700",
  COMPLETED: "bg-blue-100 text-blue-700",
};

const TYPE_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  TEMPORARY: "bg-orange-100 text-orange-700",
  INACTIVE: "bg-gray-100 text-gray-600",
};

export default function ClientesPage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  function fetchClients() {
    setLoading(true);
    const params = new URLSearchParams();
    if (typeFilter !== "ALL") params.set("clientType", typeFilter);
    if (search) params.set("search", search);
    fetch(`/api/contracts?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => { setContracts(data); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(() => { fetchClients(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [typeFilter]);
  useEffect(() => {
    fetch("/api/services").then((r) => r.json()).then(setServices).catch(() => {});
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Excluir este cliente e todas as faturas vinculadas?")) return;
    await fetch(`/api/contracts/${id}`, { method: "DELETE" });
    fetchClients();
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const tags = ((fd.get("tags") as string) || "")
      .split(",").map((s) => s.trim()).filter(Boolean);
    const serviceIds = fd.getAll("serviceIds").map((s) => String(s)).filter(Boolean);
    const payload: any = {
      monthlyValue: Number(fd.get("monthlyValue")),
      durationMonths: Number(fd.get("durationMonths")),
      paymentDay: Number(fd.get("paymentDay")),
      serviceIds,
      clientType: fd.get("clientType"),
      status: fd.get("status"),
      niche: (fd.get("niche") as string) || null,
      tags,
      paymentLink: (fd.get("paymentLink") as string) || null,
      notes: (fd.get("notes") as string) || null,
      startDate: fd.get("startDate"),
    };
    if (editing) {
      await fetch(`/api/contracts/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      payload.clientName = fd.get("clientName");
      payload.clientPhone = fd.get("clientPhone") || null;
      payload.clientEmail = fd.get("clientEmail") || null;
      payload.clientCompany = fd.get("clientCompany") || null;
      payload.generateInvoices = fd.get("generateInvoices") === "on";
      await fetch(`/api/contracts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    setShowForm(false); setEditing(null); fetchClients();
  }

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/financeiro" className="inline-flex items-center gap-1 hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Financeiro
        </Link>
        <span>/</span>
        <span className="text-foreground">Clientes</span>
      </nav>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-sm text-muted-foreground">Gerencie clientes ativos, temporários e inativos</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Novo cliente
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
          {CLIENT_TYPES.map((t) => (
            <button
              key={t.key}
              onClick={() => setTypeFilter(t.key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${typeFilter === t.key ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-1.5 flex-1 max-w-sm">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") fetchClients(); }}
            placeholder="Buscar por nome, contrato ou nicho..."
            className="flex-1 bg-transparent text-sm focus:outline-none"
          />
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground bg-muted/50">
              <th className="px-4 py-3 font-medium">Contrato</th>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Serviço</th>
              <th className="px-4 py-3 font-medium">Nicho</th>
              <th className="px-4 py-3 font-medium">Mensal</th>
              <th className="px-4 py-3 font-medium">Duração</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Faturas</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">Carregando...</td></tr>
            ) : contracts.length === 0 ? (
              <tr><td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">Nenhum cliente encontrado.</td></tr>
            ) : contracts.map((c: any) => {
              const paid = (c.invoices || []).filter((i: any) => i.status === "PAID").length;
              const overdue = (c.invoices || []).filter((i: any) => i.status === "OVERDUE" || (i.status === "PENDING" && new Date(i.dueDate) < new Date())).length;
              return (
                <tr key={c.id} className="border-t border-border hover:bg-muted/30 transition">
                  <td className="px-4 py-3">
                    <Link href={`/financeiro/contratos/${c.id}`} className="font-medium text-primary hover:underline">{c.number}</Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{c.lead?.name}</div>
                    {c.lead?.company && <div className="text-xs text-muted-foreground">{c.lead.company}</div>}
                    {c.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {c.tags.map((tg: string) => (
                          <span key={tg} className="px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-100 text-indigo-700">#{tg}</span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {c.services && c.services.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {c.services.map((s: any) => (
                          <span key={s.id} className="px-2 py-0.5 rounded-full text-[10px] font-medium text-white" style={{ backgroundColor: s.color }}>
                            {s.name}
                          </span>
                        ))}
                      </div>
                    ) : c.service ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium text-white" style={{ backgroundColor: c.service.color }}>
                        {c.service.name}
                      </span>
                    ) : <span className="text-muted-foreground text-xs">-</span>}
                  </td>
                  <td className="px-4 py-3 text-xs">{c.niche || "-"}</td>
                  <td className="px-4 py-3 font-semibold">{formatCurrency(c.monthlyValue)}</td>
                  <td className="px-4 py-3 text-xs">{c.durationMonths} meses</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${TYPE_COLORS[c.clientType] || ""}`}>
                      {c.clientType === "ACTIVE" ? "Ativo" : c.clientType === "TEMPORARY" ? "Temporário" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_COLORS[c.status] || ""}`}>
                      {STATUS_LABELS[c.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className="text-green-600">{paid} pagas</span>
                    {overdue > 0 && <span className="text-red-600 ml-2">{overdue} vencidas</span>}
                    <div className="text-muted-foreground">{c._count?.invoices || 0} no total</div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-1">
                      <Link href={`/financeiro/contratos/${c.id}`} className="p-1.5 rounded hover:bg-muted" title="Ver faturas">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                      </Link>
                      <button onClick={() => { setEditing(c); setShowForm(true); }} className="p-1.5 rounded hover:bg-muted" title="Editar">
                        <Pencil className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded hover:bg-red-50" title="Excluir">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal
          title={editing ? `Editar cliente — ${editing.number}` : "Novo cliente"}
          onClose={() => { setShowForm(false); setEditing(null); }}
          maxWidth="max-w-2xl"
        >
          <form onSubmit={handleSave} className="space-y-4">
            {!editing && (
              <fieldset className="border border-border rounded-lg p-4 space-y-3">
                <legend className="text-xs font-semibold text-muted-foreground px-1">Dados do cliente</legend>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">Nome *</label>
                    <input name="clientName" required className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Telefone</label>
                    <input name="clientPhone" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">E-mail</label>
                    <input name="clientEmail" type="email" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Empresa</label>
                    <input name="clientCompany" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
                  </div>
                </div>
              </fieldset>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Tipo de cliente</label>
                <select name="clientType" defaultValue={editing?.clientType || "ACTIVE"} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
                  <option value="ACTIVE">Ativo</option>
                  <option value="TEMPORARY">Temporário</option>
                  <option value="INACTIVE">Inativo</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Status do contrato</label>
                <select name="status" defaultValue={editing?.status || "ACTIVE"} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
                  <option value="ACTIVE">Ativo</option>
                  <option value="PAUSED">Pausado</option>
                  <option value="CANCELED">Cancelado</option>
                  <option value="COMPLETED">Concluído</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1">Serviços (selecione um ou mais)</label>
                <div className="flex flex-wrap gap-2 p-2 border border-border rounded-lg">
                  {services.map((s) => {
                    const checked = (editing?.serviceIds && editing.serviceIds.length > 0
                      ? editing.serviceIds
                      : editing?.serviceId ? [editing.serviceId] : []).includes(s.id);
                    return (
                      <label key={s.id} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full border border-border cursor-pointer text-xs hover:bg-muted has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:checked]:border-primary">
                        <input type="checkbox" name="serviceIds" value={s.id} defaultChecked={checked} className="sr-only" />
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                        {s.name}
                      </label>
                    );
                  })}
                  {services.length === 0 && <span className="text-xs text-muted-foreground">Nenhum serviço cadastrado.</span>}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Nicho</label>
                <input name="niche" defaultValue={editing?.niche || ""} placeholder="Ex.: imobiliária, advocacia..." className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Valor mensal (R$)</label>
                <input name="monthlyValue" type="number" step="0.01" required defaultValue={editing?.monthlyValue ?? ""} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Duração (meses)</label>
                <input name="durationMonths" type="number" required defaultValue={editing?.durationMonths ?? 12} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Dia de pagamento</label>
                <input name="paymentDay" type="number" min="1" max="31" required defaultValue={editing?.paymentDay ?? 10} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Início do contrato</label>
                <input
                  name="startDate"
                  type="date"
                  required
                  defaultValue={editing?.startDate ? new Date(editing.startDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Tags (separadas por vírgula)</label>
              <input name="tags" defaultValue={(editing?.tags || []).join(", ")} placeholder="Ex.: premium, retorno-alto" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Link de pagamento padrão</label>
              <input name="paymentLink" defaultValue={editing?.paymentLink || ""} placeholder="https://..." className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Observações</label>
              <textarea name="notes" rows={2} defaultValue={editing?.notes || ""} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>

            {!editing && (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="generateInvoices" defaultChecked />
                Gerar faturas automaticamente para o período do contrato
              </label>
            )}

            <button type="submit" className="w-full bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:opacity-90 transition">
              {editing ? "Salvar alterações" : "Criar cliente"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
