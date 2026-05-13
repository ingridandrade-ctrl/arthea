"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatCurrency, formatDate, formatDateBR } from "@/lib/utils";
import { ArrowLeft, Pencil, Check, Plus, Trash2, ExternalLink, FileCheck2 } from "lucide-react";
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

export default function ContratoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [contract, setContract] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [formAmount, setFormAmount] = useState<number>(0);
  const [formInstallments, setFormInstallments] = useState<number>(0);

  function openInvoiceForm(inv: any | null) {
    setEditingInvoice(inv);
    setFormAmount(inv?.amount ?? contract?.monthlyValue ?? 0);
    setFormInstallments(inv?.totalInstallments ?? contract?.durationMonths ?? 0);
    setShowInvoiceForm(true);
  }

  function fetchContract() {
    fetch(`/api/contracts/${params.id}`)
      .then((r) => r.json())
      .then((data) => { setContract(data); setLoading(false); });
  }

  useEffect(() => { fetchContract(); }, [params.id]);
  useEffect(() => {
    fetch("/api/services").then((r) => r.json()).then(setServices).catch(() => {});
  }, []);

  async function markInvoicePaid(invoiceId: string) {
    await fetch(`/api/invoices/${invoiceId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PAID", paidAt: new Date().toISOString(), paymentMethod: "PIX" }),
    });
    fetchContract();
  }

  async function toggleInvoiceIssued(invoiceId: string, value: boolean) {
    await fetch(`/api/invoices/${invoiceId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceIssued: value }),
    });
    fetchContract();
  }

  async function deleteInvoice(id: string) {
    if (!confirm("Excluir esta fatura?")) return;
    await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    fetchContract();
  }

  async function handleEditSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const tags = ((fd.get("tags") as string) || "").split(",").map((s) => s.trim()).filter(Boolean);
    await fetch(`/api/contracts/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        monthlyValue: parseFloat(fd.get("monthlyValue") as string),
        durationMonths: parseInt(fd.get("durationMonths") as string),
        paymentDay: parseInt(fd.get("paymentDay") as string),
        notes: fd.get("notes") || null,
        clientType: fd.get("clientType"),
        status: fd.get("status"),
        niche: fd.get("niche") || null,
        tags,
        paymentLink: fd.get("paymentLink") || null,
        serviceId: (fd.get("serviceId") as string) || null,
      }),
    });
    setEditing(false); fetchContract();
  }

  async function saveInvoice(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const serviceIds = fd.getAll("serviceIds").map((s) => String(s)).filter(Boolean);
    const payload: any = {
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
      serviceIds,
    };
    if (editingInvoice) {
      await fetch(`/api/invoices/${editingInvoice.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      payload.contractId = contract.id;
      payload.leadId = contract.leadId;
      payload.generateRemaining = fd.get("generateRemaining") === "on";
      payload.paymentDay = contract.paymentDay;
      await fetch(`/api/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    setShowInvoiceForm(false);
    setEditingInvoice(null);
    fetchContract();
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!contract) return <div className="text-center py-8 text-muted-foreground">Cliente não encontrado</div>;

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/financeiro" className="hover:text-foreground">Financeiro</Link>
        <span>/</span>
        <Link href="/financeiro/clientes" className="hover:text-foreground">Clientes</Link>
        <span>/</span>
        <span className="text-foreground">{contract.number}</span>
      </nav>
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <h1 className="text-2xl font-bold">Cliente {contract.number}</h1>
        <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg hover:bg-muted">
          <Pencil className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-card rounded-xl border border-border p-6 space-y-3">
          <h2 className="text-lg font-semibold">Detalhes</h2>
          <div className="space-y-2 text-sm">
            <Row label="Cliente" value={contract.lead?.name} />
            <Row label="Empresa" value={contract.lead?.company || "-"} />
            <Row label="Tipo" value={contract.clientType === "ACTIVE" ? "Ativo" : contract.clientType === "TEMPORARY" ? "Temporário" : "Inativo"} />
            <Row label="Status" value={contract.status} />
            <Row label="Serviço" value={contract.service?.name || "-"} />
            <Row label="Nicho" value={contract.niche || "-"} />
            <Row label="Valor mensal" value={formatCurrency(contract.monthlyValue)} highlight />
            <Row label="Duração" value={`${contract.durationMonths} meses`} />
            <Row label="Dia pgto" value={`Dia ${contract.paymentDay}`} />
            <Row label="Início" value={formatDate(contract.startDate)} />
            {contract.tags?.length > 0 && (
              <div className="pt-2">
                <p className="text-xs text-muted-foreground mb-1">Tags</p>
                <div className="flex flex-wrap gap-1">
                  {contract.tags.map((t: string) => (
                    <span key={t} className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-100 text-indigo-700">#{t}</span>
                  ))}
                </div>
              </div>
            )}
            {contract.paymentLink && (
              <div className="pt-2">
                <a href={contract.paymentLink} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" /> Link de pagamento
                </a>
              </div>
            )}
          </div>
          {contract.notes && <div className="pt-2 border-t border-border"><p className="text-sm text-muted-foreground">{contract.notes}</p></div>}
        </div>

        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Faturas ({contract.invoices?.length || 0})</h2>
            <button
              onClick={() => { openInvoiceForm(null); }}
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Adicionar fatura
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="pb-2 font-medium">Número</th>
                  <th className="pb-2 font-medium">Parcela</th>
                  <th className="pb-2 font-medium">Valor</th>
                  <th className="pb-2 font-medium">Vencimento</th>
                  <th className="pb-2 font-medium">Pgto</th>
                  <th className="pb-2 font-medium">NF</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {contract.invoices?.length === 0 ? (
                  <tr><td colSpan={8} className="py-8 text-center text-muted-foreground text-xs">Nenhuma fatura.</td></tr>
                ) : contract.invoices?.map((inv: any) => (
                  <tr key={inv.id} className="border-b border-border last:border-0">
                    <td className="py-2 font-medium">{inv.number}</td>
                    <td className="py-2 text-xs">
                      {inv.installmentNumber && inv.totalInstallments
                        ? `${inv.installmentNumber}/${inv.totalInstallments}`
                        : "-"}
                    </td>
                    <td className="py-2">{formatCurrency(inv.amount)}</td>
                    <td className="py-2 text-xs">{formatDateBR(inv.dueDate)}</td>
                    <td className="py-2">
                      {inv.paymentLink && (
                        <a href={inv.paymentLink} target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" /> link
                        </a>
                      )}
                    </td>
                    <td className="py-2">
                      <button
                        onClick={() => toggleInvoiceIssued(inv.id, !inv.invoiceIssued)}
                        className={`flex items-center gap-1 text-xs ${inv.invoiceIssued ? "text-green-600" : "text-muted-foreground"}`}
                      >
                        <FileCheck2 className="w-3 h-3" />
                        {inv.invoiceIssued ? "Emitida" : "Pendente"}
                      </button>
                    </td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_COLORS[inv.status] || ""}`}>
                        {STATUS_LABELS[inv.status] || inv.status}
                      </span>
                    </td>
                    <td className="py-2 text-right">
                      <div className="inline-flex gap-1">
                        {inv.status !== "PAID" && (
                          <button onClick={() => markInvoicePaid(inv.id)} className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium">
                            <Check className="w-3 h-3" /> Pagar
                          </button>
                        )}
                        <button onClick={() => { openInvoiceForm(inv); }} className="p-1 rounded hover:bg-muted">
                          <Pencil className="w-3 h-3 text-muted-foreground" />
                        </button>
                        <button onClick={() => deleteInvoice(inv.id)} className="p-1 rounded hover:bg-red-50">
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {editing && (
        <Modal title="Editar cliente" onClose={() => setEditing(false)} maxWidth="max-w-2xl">
          <form onSubmit={handleEditSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Tipo</label>
                <select name="clientType" defaultValue={contract.clientType} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
                  <option value="ACTIVE">Ativo</option>
                  <option value="TEMPORARY">Temporário</option>
                  <option value="INACTIVE">Inativo</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Status</label>
                <select name="status" defaultValue={contract.status} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
                  <option value="ACTIVE">Ativo</option>
                  <option value="PAUSED">Pausado</option>
                  <option value="CANCELED">Cancelado</option>
                  <option value="COMPLETED">Concluído</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1">Serviços</label>
                <div className="flex flex-wrap gap-2 p-2 border border-border rounded-lg">
                  {services.map((s) => {
                    const checked = ((contract.serviceIds && contract.serviceIds.length > 0)
                      ? contract.serviceIds
                      : contract.serviceId ? [contract.serviceId] : []).includes(s.id);
                    return (
                      <label key={s.id} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full border border-border cursor-pointer text-xs hover:bg-muted has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:checked]:border-primary">
                        <input type="checkbox" name="serviceIds" value={s.id} defaultChecked={checked} className="sr-only" />
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                        {s.name}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Nicho</label>
                <input name="niche" defaultValue={contract.niche || ""} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Valor mensal (R$)</label>
                <input name="monthlyValue" type="number" step="0.01" defaultValue={contract.monthlyValue} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Duração (meses)</label>
                <input name="durationMonths" type="number" defaultValue={contract.durationMonths} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Dia pgto</label>
                <input name="paymentDay" type="number" min="1" max="31" defaultValue={contract.paymentDay} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Tags (vírgula)</label>
                <input name="tags" defaultValue={(contract.tags || []).join(", ")} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Link de pagamento padrão</label>
              <input name="paymentLink" defaultValue={contract.paymentLink || ""} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Observações</label>
              <textarea name="notes" rows={3} defaultValue={contract.notes || ""} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <button type="submit" className="w-full bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:opacity-90 transition">
              Salvar
            </button>
          </form>
        </Modal>
      )}

      {showInvoiceForm && (
        <Modal
          title={editingInvoice ? `Editar fatura — ${editingInvoice.number}` : "Adicionar fatura"}
          onClose={() => { setShowInvoiceForm(false); setEditingInvoice(null); }}
          maxWidth="max-w-xl"
        >
          <form onSubmit={saveInvoice} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Valor por parcela (R$) *</label>
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  required
                  defaultValue={editingInvoice?.amount ?? contract.monthlyValue}
                  onChange={(e) => setFormAmount(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                />
                {formInstallments > 1 && formAmount > 0 && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {formInstallments} parcelas de {formatCurrency(formAmount)} — Total: <strong>{formatCurrency(formAmount * formInstallments)}</strong>
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Vencimento</label>
                <input name="dueDate" type="date" required
                  defaultValue={editingInvoice ? new Date(editingInvoice.dueDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Status</label>
                <select name="status" defaultValue={editingInvoice?.status || "PENDING"} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
                  <option value="PENDING">Pendente</option>
                  <option value="PAID">Paga</option>
                  <option value="OVERDUE">Vencida</option>
                  <option value="CANCELED">Cancelada</option>
                  <option value="REFUNDED">Reembolsada</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1">Serviços</label>
                <div className="flex flex-wrap gap-2 p-2 border border-border rounded-lg">
                  {services.map((s) => {
                    const initial = (editingInvoice?.serviceIds && editingInvoice.serviceIds.length > 0)
                      ? editingInvoice.serviceIds
                      : editingInvoice?.serviceId
                      ? [editingInvoice.serviceId]
                      : (contract.serviceIds && contract.serviceIds.length > 0)
                      ? contract.serviceIds
                      : contract.serviceId ? [contract.serviceId] : [];
                    return (
                      <label key={s.id} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full border border-border cursor-pointer text-xs hover:bg-muted has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:checked]:border-primary">
                        <input type="checkbox" name="serviceIds" value={s.id} defaultChecked={initial.includes(s.id)} className="sr-only" />
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                        {s.name}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Parcela</label>
                <input name="installmentNumber" type="number" defaultValue={editingInvoice?.installmentNumber ?? ""} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Total parcelas</label>
                <input
                  name="totalInstallments"
                  type="number"
                  defaultValue={editingInvoice?.totalInstallments ?? contract.durationMonths}
                  onChange={(e) => setFormInstallments(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Forma de pagamento</label>
                <select name="paymentMethod" defaultValue={editingInvoice?.paymentMethod || ""} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
                  <option value="">Selecione</option>
                  {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Nº NF</label>
                <input name="invoiceNumber" defaultValue={editingInvoice?.invoiceNumber || ""} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Link de pagamento</label>
              <input name="paymentLink" defaultValue={editingInvoice?.paymentLink || contract.paymentLink || ""} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Descrição</label>
              <input name="description" defaultValue={editingInvoice?.description || ""} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="invoiceIssued" defaultChecked={!!editingInvoice?.invoiceIssued} />
              Nota fiscal já emitida
            </label>
            {!editingInvoice && (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="generateRemaining" defaultChecked />
                Gerar parcelas restantes automaticamente (uma por mês)
              </label>
            )}
            <button type="submit" className="w-full bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:opacity-90 transition">
              {editingInvoice ? "Salvar alterações" : "Adicionar fatura"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

const PAYMENT_METHODS = [
  "PIX",
  "Cartão de crédito",
  "Cartão de débito",
  "Boleto",
  "Transferência bancária",
  "Dinheiro",
  "Outro",
];

function Row({ label, value, highlight }: { label: string; value: any; highlight?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={highlight ? "font-semibold text-green-600" : "font-medium"}>{value}</span>
    </div>
  );
}
