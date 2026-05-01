"use client";

import { useEffect, useMemo, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import {
  ArrowLeft, Check, ExternalLink, FileCheck2, Pencil, Plus, Search, Trash2,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente", PAID: "Paga", OVERDUE: "Vencida", CANCELED: "Cancelada", REFUNDED: "Reembolsada",
};
const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  PAID: "bg-green-100 text-green-700",
  OVERDUE: "bg-red-100 text-red-700",
  CANCELED: "bg-gray-100 text-gray-500",
  REFUNDED: "bg-purple-100 text-purple-700",
};
const STATUS_TABS = [
  { key: "", label: "Todas" },
  { key: "PENDING", label: "Pendentes" },
  { key: "OVERDUE", label: "Vencidas" },
  { key: "PAID", label: "Pagas" },
  { key: "CANCELED", label: "Canceladas" },
];
const CLIENT_TYPES = [
  { key: "", label: "Todos" },
  { key: "ACTIVE", label: "Ativos" },
  { key: "TEMPORARY", label: "Temporários" },
  { key: "INACTIVE", label: "Inativos" },
];

function currentMonthYM() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function FaturasPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [clientType, setClientType] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [month, setMonth] = useState(currentMonthYM());
  const [includeAllMonths, setIncludeAllMonths] = useState(false);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  function fetchInvoices() {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (clientType) params.set("clientType", clientType);
    if (serviceId) params.set("serviceId", serviceId);
    if (!includeAllMonths && month) params.set("month", month);
    if (search) params.set("search", search);
    fetch(`/api/invoices?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => { setInvoices(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(() => { fetchInvoices(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [statusFilter, clientType, serviceId, month, includeAllMonths]);

  useEffect(() => {
    fetch("/api/services").then((r) => r.json()).then((d) => setServices(Array.isArray(d) ? d : [])).catch(() => {});
    fetch("/api/contracts").then((r) => r.json()).then((d) => setContracts(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  async function markPaid(id: string) {
    await fetch(`/api/invoices/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PAID", paidAt: new Date().toISOString() }),
    });
    fetchInvoices();
  }

  async function toggleIssued(id: string, value: boolean) {
    await fetch(`/api/invoices/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceIssued: value }),
    });
    fetchInvoices();
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta fatura?")) return;
    await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    fetchInvoices();
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload: any = {
      contractId: (fd.get("contractId") as string) || null,
      amount: Number(fd.get("amount")),
      dueDate: fd.get("dueDate"),
      description: fd.get("description") || null,
      paymentLink: fd.get("paymentLink") || null,
      paymentMethod: fd.get("paymentMethod") || null,
      installmentNumber: fd.get("installmentNumber") ? Number(fd.get("installmentNumber")) : null,
      totalInstallments: fd.get("totalInstallments") ? Number(fd.get("totalInstallments")) : null,
      invoiceIssued: fd.get("invoiceIssued") === "on",
      invoiceNumber: fd.get("invoiceNumber") || null,
      status: fd.get("status"),
      serviceId: (fd.get("serviceId") as string) || null,
    };

    if (editing) {
      await fetch(`/api/invoices/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      // For manual invoices, allow leadId via contract OR new client
      if (!payload.contractId) {
        payload.clientName = fd.get("clientName");
        payload.clientPhone = fd.get("clientPhone") || null;
      }
      await fetch(`/api/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    setShowForm(false); setEditing(null); fetchInvoices();
  }

  const totals = useMemo(() => {
    const t = { total: 0, paid: 0, pending: 0, overdue: 0 };
    const now = new Date();
    for (const inv of invoices) {
      t.total += inv.amount;
      if (inv.status === "PAID") t.paid += inv.amount;
      else if (inv.status === "OVERDUE" || (inv.status === "PENDING" && new Date(inv.dueDate) < now)) t.overdue += inv.amount;
      else if (inv.status === "PENDING") t.pending += inv.amount;
    }
    return t;
  }, [invoices]);

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/financeiro" className="inline-flex items-center gap-1 hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Financeiro
        </Link>
        <span>/</span>
        <span className="text-foreground">Faturas</span>
      </nav>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Faturas e pagamentos</h1>
          <p className="text-sm text-muted-foreground">Filtre por mês, tipo de cliente, status. Adicione faturas avulsas.</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Nova fatura
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="Total no filtro" value={formatCurrency(totals.total)} />
        <SummaryCard label="Pagas" value={formatCurrency(totals.paid)} color="text-green-600" />
        <SummaryCard label="Pendentes" value={formatCurrency(totals.pending)} color="text-amber-600" />
        <SummaryCard label="Vencidas" value={formatCurrency(totals.overdue)} color="text-red-600" />
      </div>

      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
            {STATUS_TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setStatusFilter(t.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${statusFilter === t.key ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
            {CLIENT_TYPES.map((t) => (
              <button
                key={t.key}
                onClick={() => setClientType(t.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${clientType === t.key ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Mês</span>
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} disabled={includeAllMonths} className="px-2 py-1 border border-border rounded-md text-sm disabled:opacity-50" />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={includeAllMonths} onChange={(e) => setIncludeAllMonths(e.target.checked)} />
            Todos os meses
          </label>

          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Serviço</span>
            <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} className="px-2 py-1 border border-border rounded-md text-sm">
              <option value="">Todos</option>
              {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>

          <div className="flex items-center gap-2 bg-muted/40 rounded-lg px-3 py-1.5 flex-1 max-w-sm">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") fetchInvoices(); }}
              placeholder="Número, cliente, descrição..."
              className="flex-1 bg-transparent text-sm focus:outline-none"
            />
            <button onClick={fetchInvoices} className="text-xs text-primary hover:underline">Buscar</button>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground bg-muted/50">
              <th className="px-4 py-3 font-medium">Número</th>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Contrato</th>
              <th className="px-4 py-3 font-medium">Parcela</th>
              <th className="px-4 py-3 font-medium">Serviço</th>
              <th className="px-4 py-3 font-medium">Valor</th>
              <th className="px-4 py-3 font-medium">Vencimento</th>
              <th className="px-4 py-3 font-medium">Pgto</th>
              <th className="px-4 py-3 font-medium">NF</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={11} className="px-4 py-8 text-center text-muted-foreground">Carregando...</td></tr>
            ) : invoices.length === 0 ? (
              <tr><td colSpan={11} className="px-4 py-8 text-center text-muted-foreground">Nenhuma fatura encontrada com esses filtros.</td></tr>
            ) : invoices.map((inv: any) => (
              <tr key={inv.id} className="border-t border-border hover:bg-muted/30 transition">
                <td className="px-4 py-3 font-medium">{inv.number}</td>
                <td className="px-4 py-3">
                  <div>{inv.lead?.name}</div>
                  {inv.contract?.clientType && (
                    <span className="text-[10px] text-muted-foreground">
                      {inv.contract.clientType === "ACTIVE" ? "Ativo" : inv.contract.clientType === "TEMPORARY" ? "Temporário" : "Inativo"}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{inv.contract?.number || "-"}</td>
                <td className="px-4 py-3 text-xs">
                  {inv.installmentNumber && inv.totalInstallments
                    ? `${inv.installmentNumber}/${inv.totalInstallments}`
                    : "-"}
                </td>
                <td className="px-4 py-3">
                  {inv.service ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium text-white" style={{ backgroundColor: inv.service.color }}>
                      {inv.service.name}
                    </span>
                  ) : <span className="text-muted-foreground text-xs">-</span>}
                </td>
                <td className="px-4 py-3 font-semibold">{formatCurrency(inv.amount)}</td>
                <td className="px-4 py-3 text-xs">{formatDate(inv.dueDate)}</td>
                <td className="px-4 py-3">
                  {inv.paymentLink ? (
                    <a href={inv.paymentLink} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" /> link
                    </a>
                  ) : <span className="text-xs text-muted-foreground">-</span>}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleIssued(inv.id, !inv.invoiceIssued)}
                    className={`flex items-center gap-1 text-xs ${inv.invoiceIssued ? "text-green-600" : "text-muted-foreground"}`}
                  >
                    <FileCheck2 className="w-3 h-3" />
                    {inv.invoiceIssued ? `Emitida${inv.invoiceNumber ? ` (${inv.invoiceNumber})` : ""}` : "Pendente"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_COLORS[inv.status] || ""}`}>
                    {STATUS_LABELS[inv.status] || inv.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-1">
                    {(inv.status === "PENDING" || inv.status === "OVERDUE") && (
                      <button onClick={() => markPaid(inv.id)} className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium">
                        <Check className="w-3 h-3" /> Pagar
                      </button>
                    )}
                    <button onClick={() => { setEditing(inv); setShowForm(true); }} className="p-1 rounded hover:bg-muted">
                      <Pencil className="w-3 h-3 text-muted-foreground" />
                    </button>
                    <button onClick={() => handleDelete(inv.id)} className="p-1 rounded hover:bg-red-50">
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal
          title={editing ? `Editar fatura — ${editing.number}` : "Nova fatura"}
          onClose={() => { setShowForm(false); setEditing(null); }}
          maxWidth="max-w-xl"
        >
          <form onSubmit={handleSave} className="space-y-3">
            {!editing && (
              <div>
                <label className="block text-xs font-medium mb-1">Vincular a um cliente existente</label>
                <select name="contractId" defaultValue="" className="w-full px-3 py-2 border border-border rounded-lg text-sm">
                  <option value="">-- Cliente avulso (preencher abaixo) --</option>
                  {contracts.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.number} — {c.lead?.name} ({c.clientType === "TEMPORARY" ? "temporário" : c.clientType === "INACTIVE" ? "inativo" : "ativo"})
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <label className="block text-xs font-medium mb-1">Nome do cliente (avulso)</label>
                    <input name="clientName" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Telefone (avulso)</label>
                    <input name="clientPhone" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Valor (R$)</label>
                <input name="amount" type="number" step="0.01" required defaultValue={editing?.amount ?? ""} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Vencimento</label>
                <input name="dueDate" type="date" required
                  defaultValue={editing ? new Date(editing.dueDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Status</label>
                <select name="status" defaultValue={editing?.status || "PENDING"} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
                  <option value="PENDING">Pendente</option>
                  <option value="PAID">Paga</option>
                  <option value="OVERDUE">Vencida</option>
                  <option value="CANCELED">Cancelada</option>
                  <option value="REFUNDED">Reembolsada</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Serviço</label>
                <select name="serviceId" defaultValue={editing?.serviceId || ""} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
                  <option value="">Nenhum</option>
                  {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Parcela</label>
                <input name="installmentNumber" type="number" defaultValue={editing?.installmentNumber ?? ""} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Total parcelas</label>
                <input name="totalInstallments" type="number" defaultValue={editing?.totalInstallments ?? ""} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Forma de pagamento</label>
                <input name="paymentMethod" defaultValue={editing?.paymentMethod || ""} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Nº NF</label>
                <input name="invoiceNumber" defaultValue={editing?.invoiceNumber || ""} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Link de pagamento</label>
              <input name="paymentLink" defaultValue={editing?.paymentLink || ""} placeholder="https://..." className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Descrição</label>
              <input name="description" defaultValue={editing?.description || ""} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="invoiceIssued" defaultChecked={!!editing?.invoiceIssued} />
              Nota fiscal emitida
            </label>

            <button type="submit" className="w-full bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:opacity-90 transition">
              {editing ? "Salvar alterações" : "Criar fatura"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function SummaryCard({ label, value, color = "" }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}
