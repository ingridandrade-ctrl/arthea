"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { FileText, Plus } from "lucide-react";
import Link from "next/link";

export default function ContratosPage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ACTIVE");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/contracts?status=${filter}`)
      .then((r) => r.json())
      .then((data) => { setContracts(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [filter]);

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-700",
    PAUSED: "bg-yellow-100 text-yellow-700",
    CANCELED: "bg-red-100 text-red-700",
    COMPLETED: "bg-blue-100 text-blue-700",
  };

  const statusLabels: Record<string, string> = {
    ACTIVE: "Ativo",
    PAUSED: "Pausado",
    CANCELED: "Cancelado",
    COMPLETED: "Concluido",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Contratos</h1>
      </div>

      <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
        {["ACTIVE", "PAUSED", "CANCELED", "COMPLETED"].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${filter === s ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {statusLabels[s]}
          </button>
        ))}
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground bg-muted/50">
              <th className="px-4 py-3 font-medium">Numero</th>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Servico</th>
              <th className="px-4 py-3 font-medium">Valor Mensal</th>
              <th className="px-4 py-3 font-medium">Duracao</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Faturas</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Carregando...</td></tr>
            ) : contracts.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Nenhum contrato encontrado</td></tr>
            ) : contracts.map((c: any) => (
              <tr key={c.id} className="border-t border-border hover:bg-muted/30 transition">
                <td className="px-4 py-3">
                  <Link href={`/financeiro/contratos/${c.id}`} className="font-medium text-primary hover:underline">
                    {c.number}
                  </Link>
                </td>
                <td className="px-4 py-3">{c.lead?.name}</td>
                <td className="px-4 py-3">
                  {c.service && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium text-white" style={{ backgroundColor: c.service.color }}>
                      {c.service.name}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 font-semibold">{formatCurrency(c.monthlyValue)}</td>
                <td className="px-4 py-3">{c.durationMonths} meses</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[c.status]}`}>
                    {statusLabels[c.status]}
                  </span>
                </td>
                <td className="px-4 py-3">{c._count?.invoices || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
