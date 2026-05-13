"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Lock,
  CreditCard,
  AlertTriangle,
  Users,
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";

const PRESETS = [
  { key: "month", label: "Mês atual" },
  { key: "last30", label: "Últimos 30 dias" },
  { key: "last90", label: "Últimos 90 dias" },
  { key: "ytd", label: "Ano (YTD)" },
  { key: "year", label: "Ano completo" },
  { key: "custom", label: "Personalizado" },
];

const CATEGORY_LABELS: Record<string, string> = {
  TOOL: "Ferramentas",
  SALARY: "Salários",
  TAX: "Impostos",
  MARKETING: "Marketing",
  INFRASTRUCTURE: "Infraestrutura",
  OTHER: "Outros",
};

const CATEGORY_COLORS: Record<string, string> = {
  TOOL: "#6366f1",
  SALARY: "#22c55e",
  TAX: "#ef4444",
  MARKETING: "#f59e0b",
  INFRASTRUCTURE: "#06b6d4",
  OTHER: "#6b7280",
};

function rangeFromPreset(preset: string): { from: string; to: string } {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  if (preset === "month") {
    const f = new Date(now.getFullYear(), now.getMonth(), 1);
    const t = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { from: fmt(f), to: fmt(t) };
  }
  if (preset === "last30") {
    const f = new Date(now); f.setDate(f.getDate() - 30);
    return { from: fmt(f), to: fmt(now) };
  }
  if (preset === "last90") {
    const f = new Date(now); f.setDate(f.getDate() - 90);
    return { from: fmt(f), to: fmt(now) };
  }
  if (preset === "ytd") {
    return { from: fmt(new Date(now.getFullYear(), 0, 1)), to: fmt(now) };
  }
  if (preset === "year") {
    return { from: fmt(new Date(now.getFullYear(), 0, 1)), to: fmt(new Date(now.getFullYear(), 11, 31)) };
  }
  return { from: fmt(new Date(now.getFullYear(), now.getMonth(), 1)), to: fmt(now) };
}

export default function FinanceiroPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [preset, setPreset] = useState("month");
  const initial = rangeFromPreset("month");
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);

  useEffect(() => {
    fetch("/api/financeiro/dashboard")
      .then((r) => {
        if (r.ok) {
          setUnlocked(true);
          return r.json();
        }
        throw new Error("locked");
      })
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function refresh() {
    setLoading(true);
    const [dRes, eRes] = await Promise.all([
      fetch(`/api/financeiro/dashboard?from=${from}&to=${to}`),
      fetch(`/api/financeiro/expenses?from=${from}&to=${to}`),
    ]);
    if (dRes.ok) setData(await dRes.json());
    if (eRes.ok) setExpenses(await eRes.json());
    setLoading(false);
  }

  useEffect(() => { if (unlocked) refresh(); }, [from, to, unlocked]);

  function applyPreset(p: string) {
    setPreset(p);
    if (p !== "custom") {
      const r = rangeFromPreset(p);
      setFrom(r.from); setTo(r.to);
    }
  }

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
      refresh();
    } else {
      setError("Senha incorreta");
    }
  }

  async function saveExpense(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      description: fd.get("description"),
      amount: Number(fd.get("amount")),
      category: fd.get("category"),
      date: fd.get("date"),
      recurring: fd.get("recurring") === "on",
      notes: fd.get("notes") || null,
      tags: ((fd.get("tags") as string) || "").split(",").map((s) => s.trim()).filter(Boolean),
    };
    const url = editingExpense ? `/api/financeiro/expenses/${editingExpense.id}` : "/api/financeiro/expenses";
    const method = editingExpense ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setShowExpenseForm(false);
      setEditingExpense(null);
      refresh();
    }
  }

  async function deleteExpense(id: string) {
    if (!confirm("Excluir esta saída?")) return;
    await fetch(`/api/financeiro/expenses/${id}`, { method: "DELETE" });
    refresh();
  }

  const series = data?.series || [];
  const maxSeries = useMemo(() => {
    let max = 0;
    for (const s of series) {
      max = Math.max(max, s.income, s.expense);
    }
    return max || 1;
  }, [series]);

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
            {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>}
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha do financeiro"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary text-center"
              autoFocus
            />
            <button type="submit" className="w-full bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:opacity-90 transition">
              Desbloquear
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const t = data.totals;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Financeiro</h1>
          <p className="text-sm text-muted-foreground">Visão geral de entradas e saídas — totalmente editável</p>
        </div>
        <div className="flex gap-2">
          <Link href="/financeiro/clientes" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition">
            Clientes
          </Link>
          <Link href="/financeiro/faturas" className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition">
            Faturas
          </Link>
          <button
            onClick={() => { setEditingExpense(null); setShowExpenseForm(true); }}
            className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Nova saída
          </button>
        </div>
      </div>

      {/* Filtros de data */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => applyPreset(p.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${preset === p.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <label className="flex items-center gap-2">
            <span className="text-muted-foreground">De</span>
            <input
              type="date"
              value={from}
              onChange={(e) => { setFrom(e.target.value); setPreset("custom"); }}
              className="px-2 py-1 border border-border rounded-md text-sm"
            />
          </label>
          <label className="flex items-center gap-2">
            <span className="text-muted-foreground">Até</span>
            <input
              type="date"
              value={to}
              onChange={(e) => { setTo(e.target.value); setPreset("custom"); }}
              className="px-2 py-1 border border-border rounded-md text-sm"
            />
          </label>
        </div>
      </div>

      {/* Cards principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Entradas" value={formatCurrency(t.income)} icon={ArrowUpCircle} color="text-green-600" bgColor="bg-green-50" />
        <StatCard title="Saídas" value={formatCurrency(t.expense)} icon={ArrowDownCircle} color="text-red-600" bgColor="bg-red-50" />
        <StatCard
          title="Lucro líquido"
          value={formatCurrency(t.profit)}
          icon={t.profit >= 0 ? TrendingUp : TrendingDown}
          color={t.profit >= 0 ? "text-green-600" : "text-red-600"}
          bgColor={t.profit >= 0 ? "bg-green-50" : "bg-red-50"}
        />
        <StatCard title="MRR ativo" value={formatCurrency(t.mrr)} icon={DollarSign} color="text-blue-600" bgColor="bg-blue-50" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Pendentes (período)" value={formatCurrency(t.pending)} icon={CreditCard} color="text-amber-600" bgColor="bg-amber-50" />
        <StatCard title="Vencidas" value={formatCurrency(t.overdue)} icon={AlertTriangle} color="text-red-600" bgColor="bg-red-50" alert={t.overdueCount > 0} />
        <StatCard title="Clientes ativos" value={String(t.activeContracts)} icon={Users} color="text-indigo-600" bgColor="bg-indigo-50" />
        <StatCard title="Ticket médio" value={formatCurrency(t.avgTicket)} icon={CreditCard} color="text-purple-600" bgColor="bg-purple-50" />
      </div>

      {/* Gráfico simples + Categorias */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">Entradas vs Saídas</h2>
          {series.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Sem movimentações no período selecionado.</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
              {series.map((s: any) => (
                <div key={s.date} className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{new Date(s.date).toLocaleDateString("pt-BR")}</span>
                    <span>
                      <span className="text-green-600">+{formatCurrency(s.income)}</span>
                      {" / "}
                      <span className="text-red-600">-{formatCurrency(s.expense)}</span>
                    </span>
                  </div>
                  <div className="flex gap-1 h-3">
                    <div className="bg-green-500 rounded" style={{ width: `${(s.income / maxSeries) * 100}%` }} />
                    <div className="bg-red-400 rounded" style={{ width: `${(s.expense / maxSeries) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">Saídas por categoria</h2>
          {data.expensesByCategory.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem saídas no período.</p>
          ) : (
            <div className="space-y-3">
              {data.expensesByCategory.map((c: any) => {
                const total = data.expensesByCategory.reduce((acc: number, x: any) => acc + x.total, 0) || 1;
                const pct = (c.total / total) * 100;
                return (
                  <div key={c.category}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{CATEGORY_LABELS[c.category] || c.category}</span>
                      <span className="font-semibold">{formatCurrency(c.total)}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: CATEGORY_COLORS[c.category] || "#6366f1" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Receita por serviço + projeção */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">Receita por serviço (período)</h2>
          {data.revenueByService.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma receita no período.</p>
          ) : (
            <div className="space-y-3">
              {data.revenueByService.map((item: any) => {
                const max = Math.max(...data.revenueByService.map((r: any) => r.revenue), 1);
                return (
                  <div key={item.serviceId || item.service}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{item.service}</span>
                      <span className="font-semibold">{formatCurrency(item.revenue)}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="h-2 rounded-full" style={{ width: `${(item.revenue / max) * 100}%`, backgroundColor: item.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">Projeção (3 meses, MRR)</h2>
          <div className="text-center py-6">
            <p className="text-3xl font-bold text-green-600">{formatCurrency(t.projection3Months)}</p>
            <p className="text-sm text-muted-foreground mt-1">Receita projetada</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-muted/50 rounded-lg p-3">
                <p className="text-lg font-bold">{formatCurrency((t.projectionMonths || [t.mrr, t.mrr, t.mrr])[i])}</p>
                <p className="text-xs text-muted-foreground">Mês {i + 1}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lista de saídas (editáveis) */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">Saídas no período</h2>
          <button
            onClick={() => { setEditingExpense(null); setShowExpenseForm(true); }}
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Adicionar
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground bg-muted/50">
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Descrição</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 font-medium">Valor</th>
              <th className="px-4 py-3 font-medium">Tags</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Nenhuma saída registrada no período.</td></tr>
            ) : expenses.map((e: any) => (
              <tr key={e.id} className="border-t border-border hover:bg-muted/30 transition">
                <td className="px-4 py-3">{new Date(e.date).toLocaleDateString("pt-BR")}</td>
                <td className="px-4 py-3">
                  <div className="font-medium">{e.description}</div>
                  {e.notes && <div className="text-xs text-muted-foreground">{e.notes}</div>}
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium text-white"
                    style={{ backgroundColor: CATEGORY_COLORS[e.category] || "#6b7280" }}>
                    {CATEGORY_LABELS[e.category] || e.category}
                  </span>
                </td>
                <td className="px-4 py-3 font-semibold text-red-600">- {formatCurrency(e.amount)}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {(e.tags || []).join(", ") || "-"}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-2">
                    <button onClick={() => { setEditingExpense(e); setShowExpenseForm(true); }} className="p-1 rounded hover:bg-muted">
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button onClick={() => deleteExpense(e.id)} className="p-1 rounded hover:bg-red-50">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showExpenseForm && (
        <Modal title={editingExpense ? "Editar saída" : "Nova saída"} onClose={() => { setShowExpenseForm(false); setEditingExpense(null); }}>
          <form onSubmit={saveExpense} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Descrição</label>
              <input name="description" required defaultValue={editingExpense?.description || ""} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Valor (R$)</label>
                <input name="amount" type="number" step="0.01" required defaultValue={editingExpense?.amount || ""} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Data</label>
                <input
                  name="date"
                  type="date"
                  required
                  defaultValue={editingExpense ? new Date(editingExpense.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Categoria</label>
              <select name="category" defaultValue={editingExpense?.category || "OTHER"} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tags (separadas por vírgula)</label>
              <input name="tags" defaultValue={(editingExpense?.tags || []).join(", ")} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Observações</label>
              <textarea name="notes" rows={2} defaultValue={editingExpense?.notes || ""} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="recurring" defaultChecked={!!editingExpense?.recurring} />
              Recorrente
            </label>
            <button type="submit" className="w-full bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:opacity-90 transition">
              {editingExpense ? "Salvar alterações" : "Adicionar saída"}
            </button>
          </form>
        </Modal>
      )}
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
