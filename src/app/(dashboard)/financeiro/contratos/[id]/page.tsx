"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowLeft, Pencil, Check } from "lucide-react";
import { Modal } from "@/components/ui/modal";

export default function ContratoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  function fetchContract() {
    fetch(`/api/contracts/${params.id}`)
      .then((r) => r.json())
      .then((data) => { setContract(data); setLoading(false); });
  }

  useEffect(() => { fetchContract(); }, [params.id]);

  async function markInvoicePaid(invoiceId: string) {
    await fetch(`/api/invoices/${invoiceId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PAID", paidAt: new Date().toISOString(), paymentMethod: "PIX" }),
    });
    fetchContract();
  }

  async function handleEditSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await fetch(`/api/contracts/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        monthlyValue: parseFloat(fd.get("monthlyValue") as string),
        durationMonths: parseInt(fd.get("durationMonths") as string),
        paymentDay: parseInt(fd.get("paymentDay") as string),
        notes: fd.get("notes") || null,
      }),
    });
    setEditing(false);
    fetchContract();
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!contract) return <div className="text-center py-8 text-muted-foreground">Contrato nao encontrado</div>;

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    PAID: "bg-green-100 text-green-700",
    OVERDUE: "bg-red-100 text-red-700",
    CANCELED: "bg-gray-100 text-gray-500",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold">Contrato {contract.number}</h1>
        <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg hover:bg-muted">
          <Pencil className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-card rounded-xl border border-border p-6 space-y-3">
          <h2 className="text-lg font-semibold">Detalhes</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Cliente</span><span className="font-medium">{contract.lead?.name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Servico</span><span className="font-medium">{contract.service?.name || "-"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Valor Mensal</span><span className="font-semibold text-green-600">{formatCurrency(contract.monthlyValue)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Duracao</span><span>{contract.durationMonths} meses</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Dia Pgto</span><span>Dia {contract.paymentDay}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Inicio</span><span>{formatDate(contract.startDate)}</span></div>
          </div>
          {contract.notes && <div className="pt-2 border-t border-border"><p className="text-sm text-muted-foreground">{contract.notes}</p></div>}
        </div>

        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">Faturas ({contract.invoices?.length || 0})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="pb-2 font-medium">Numero</th>
                  <th className="pb-2 font-medium">Descricao</th>
                  <th className="pb-2 font-medium">Valor</th>
                  <th className="pb-2 font-medium">Vencimento</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Acao</th>
                </tr>
              </thead>
              <tbody>
                {contract.invoices?.map((inv: any) => (
                  <tr key={inv.id} className="border-b border-border last:border-0">
                    <td className="py-2 font-medium">{inv.number}</td>
                    <td className="py-2">{inv.description}</td>
                    <td className="py-2">{formatCurrency(inv.amount)}</td>
                    <td className="py-2">{formatDate(inv.dueDate)}</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[inv.status] || ""}`}>
                        {inv.status === "PAID" ? "Paga" : inv.status === "PENDING" ? "Pendente" : inv.status === "OVERDUE" ? "Vencida" : inv.status}
                      </span>
                    </td>
                    <td className="py-2">
                      {inv.status !== "PAID" && (
                        <button onClick={() => markInvoicePaid(inv.id)} className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium">
                          <Check className="w-3 h-3" /> Pagar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {editing && (
        <Modal title="Editar Contrato" onClose={() => setEditing(false)}>
          <form onSubmit={handleEditSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Valor Mensal (R$)</label>
              <input name="monthlyValue" type="number" step="0.01" defaultValue={contract.monthlyValue} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Duracao (meses)</label>
              <input name="durationMonths" type="number" defaultValue={contract.durationMonths} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Dia de Pagamento</label>
              <input name="paymentDay" type="number" min="1" max="31" defaultValue={contract.paymentDay} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Observacoes</label>
              <textarea name="notes" rows={3} defaultValue={contract.notes || ""} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <button type="submit" className="w-full bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:opacity-90 transition">
              Salvar
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
