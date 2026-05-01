"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import {
  DollarSign,
  TrendingUp,
  FileText,
  AlertTriangle,
  Lock,
  CreditCard,
  BarChart3,
  Users,
} from "lucide-react";
import Link from "next/link";

export default function FinanceiroPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);

  // Check if already unlocked
  useEffect(() => {
    fetch("/api/financeiro/stats")
      .then((r) => {
        if (r.ok) {
          setUnlocked(true);
          return r.json();
        }
        throw new Error("locked");
      })
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/financeiro/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setUnlocked(true);
      setLoading(true);
      // Fetch stats
      const statsRes = await fetch("/api/financeiro/stats");
      if (statsRes.ok) setStats(await statsRes.json());
      // Fetch contracts
      const cRes = await fetch("/api/contracts?status=ACTIVE");
      if (cRes.ok) setContracts(await cRes.json());
      // Fetch overdue invoices
      const iRes = await fetch("/api/invoices?status=PENDING");
      if (iRes.ok) setInvoices(await iRes.json());
      setLoading(false);
    } else {
      setError("Senha incorreta");
    }
  }

  if (!unlocked) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-card rounded-xl border border-border p-8 w-full max-w-sm text-center">
          <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Modulo Financeiro</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Digite a senha para acessar os dados financeiros
          </p>
          <form onSubmit={handleUnlock} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>
            )}
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha do financeiro"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary text-center"
              autoFocus
            />
            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:opacity-90 transition"
            >
              Desbloquear
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Financeiro</h1>
          <p className="text-sm text-muted-foreground">Visao geral financeira da agencia</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/financeiro/contratos"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition"
          >
            Contratos
          </Link>
          <Link
            href="/financeiro/faturas"
            className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition"
          >
            Faturas
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="MRR" value={formatCurrency(stats.mrr)} icon={TrendingUp} color="text-green-600" bgColor="bg-green-50" />
        <StatCard title="Receita do Mes" value={formatCurrency(stats.monthRevenue)} icon={DollarSign} color="text-blue-600" bgColor="bg-blue-50" />
        <StatCard title="Receita YTD" value={formatCurrency(stats.yearRevenue)} icon={BarChart3} color="text-purple-600" bgColor="bg-purple-50" />
        <StatCard title="Ticket Medio" value={formatCurrency(stats.avgTicket)} icon={CreditCard} color="text-indigo-600" bgColor="bg-indigo-50" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Contratos Ativos" value={stats.activeContracts.toString()} icon={FileText} color="text-teal-600" bgColor="bg-teal-50" />
        <StatCard title="Faturas Vencidas" value={stats.overdueInvoices.toString()} icon={AlertTriangle} color="text-red-600" bgColor="bg-red-50" alert={stats.overdueInvoices > 0} />
        <StatCard title="Pagas este Mes" value={stats.paidThisMonth.toString()} icon={DollarSign} color="text-green-600" bgColor="bg-green-50" />
        <StatCard title="Churn Rate" value={`${stats.churnRate}%`} icon={Users} color="text-orange-600" bgColor="bg-orange-50" />
      </div>

      {/* Revenue by Service */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">Receita por Servico</h2>
          <div className="space-y-3">
            {stats.revenueByService.map((item: any) => {
              const maxRev = Math.max(...stats.revenueByService.map((r: any) => r.revenue), 1);
              const width = (item.revenue / maxRev) * 100;
              return (
                <div key={item.service}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{item.service}</span>
                    <span className="font-semibold">{formatCurrency(item.revenue)}/mes</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="h-2 rounded-full" style={{ width: `${width}%`, backgroundColor: item.color }} />
                  </div>
                </div>
              );
            })}
            {stats.revenueByService.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum contrato ativo ainda</p>
            )}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">Projecao</h2>
          <div className="space-y-4">
            <div className="text-center py-8">
              <p className="text-3xl font-bold text-green-600">{formatCurrency(stats.projection3Months)}</p>
              <p className="text-sm text-muted-foreground mt-1">Receita projetada (3 meses)</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-lg font-bold">{formatCurrency(stats.mrr)}</p>
                <p className="text-xs text-muted-foreground">Mes 1</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-lg font-bold">{formatCurrency(stats.mrr)}</p>
                <p className="text-xs text-muted-foreground">Mes 2</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-lg font-bold">{formatCurrency(stats.mrr)}</p>
                <p className="text-xs text-muted-foreground">Mes 3</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, bgColor, alert }: {
  title: string; value: string; icon: any; color: string; bgColor: string; alert?: boolean;
}) {
  return (
    <div className={`bg-card rounded-xl border p-4 ${alert ? "border-red-300" : "border-border"}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="text-xl font-bold mt-1">{value}</p>
        </div>
        <div className={`${bgColor} p-2 rounded-lg`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
    </div>
  );
}
