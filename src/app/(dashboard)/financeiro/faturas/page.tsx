"use client";

import { useEffect, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Check } from "lucide-react";

export default function FaturasPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  function fetchInvoices() {
    setLoading(true);
    const params = filter ? `?status=${filter}` : "";
    fetch(`/api/invoices${params}`)
      .then((r) => r.json())
      .then((data) => { setInvoices(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(() => { fetchInvoices(); }, [filter]);

  async function markPaid(id: string) {
    await fetch(`/api/invoices/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PAID", paidAt: new Date().toISOString() }),
    });
    fetchInvoices();
  }

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    PAID: "bg-green-100 text-green-700",
    OVERDUE: "bg-red-100 text-red-700",
    CANCELED: "bg-gray-100 text-gray-500",
    REFUNDED: "bg-purple-100 text-purple-700",
  };

  const statusLabels: Record<string, string> = {
    PENDING: "Pendente", PAID: "Paga", OVERDUE: "Vencida", CANCELED: "Cancelada", REFUNDED: "Reembolsada",
  };

  const tabs = [
    { key: "", label: "Todas" },
    { key: "PENDING", label: "Pendentes" },
    { key: "OVERDUE", label: "Vencidas" },
    { key: "PAID", label: "Pagas" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Faturas</h1>

      <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${filter === t.key ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground bg-muted/50">
              <th className="px-4 py-3 font-medium">Numero</th>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Contrato</th>
              <th className="px-4 py-3 font-medium">Valor</th>
              <th className="px-4 py-3 font-medium">Vencimento</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Acao</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Carregando...</td></tr>
            ) : invoices.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Nenhuma fatura encontrada</td></tr>
            ) : invoices.map((inv: any) => (
              <tr key={inv.id} className="border-t border-border hover:bg-muted/30 transition">
                <td className="px-4 py-3 font-medium">{inv.number}</td>
                <td className="px-4 py-3">{inv.lead?.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{inv.contract?.number || "-"}</td>
                <td className="px-4 py-3 font-semibold">{formatCurrency(inv.amount)}</td>
                <td className="px-4 py-3">{formatDate(inv.dueDate)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[inv.status] || ""}`}>
                    {statusLabels[inv.status] || inv.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {(inv.status === "PENDING" || inv.status === "OVERDUE") && (
                    <button onClick={() => markPaid(inv.id)} className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium">
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
  );
}
