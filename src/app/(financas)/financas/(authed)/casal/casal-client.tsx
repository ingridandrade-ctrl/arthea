"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, ArrowRight, Users, Scale, HandCoins, TrendingDown, BarChart3 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/financas/page-header";
import { formatCurrency } from "@/lib/utils";
import { CategoryDonut, IncomeExpenseLine } from "@/components/financas/charts";

type Settings = { partnerAName: string; partnerBName: string };

type Settlement = {
  id: string;
  amount: number;
  fromOwner: "PARTNER_A" | "PARTNER_B";
  toOwner: "PARTNER_A" | "PARTNER_B";
  date: string;
  notes: string | null;
  periodStart: string | null;
  periodEnd: string | null;
};

type Balance = {
  netBalance: number;
  whoOwes: "PARTNER_A" | "PARTNER_B" | null;
  amount: number;
  details: {
    aPaidForCouple: number;
    bPaidForCouple: number;
    aPaidForB: number;
    bPaidForA: number;
    settlementsAtoB: number;
    settlementsBtoA: number;
  };
};

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type DashboardLite = {
  totals: { income: number; expense: number };
  expensesByCategory: { name: string; color: string; amount: number }[];
  monthlySeries: { month: string; income: number; expense: number }[];
};

export function CasalClient() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [dash, setDash] = useState<DashboardLite | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    const [s, d, dashRes] = await Promise.all([
      fetch("/api/financas/settings").then((r) => r.json()),
      fetch("/api/financas/settlements").then((r) => r.json()),
      fetch("/api/financas/dashboard").then((r) => r.json()),
    ]);
    setSettings(s);
    setSettlements(d.settlements || []);
    setBalance(d.balance);
    setDash({
      totals: dashRes.totals,
      expensesByCategory: dashRes.expensesByCategory || [],
      monthlySeries: dashRes.monthlySeries || [],
    });
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id: string) {
    if (!confirm("Excluir este acerto?")) return;
    await fetch(`/api/financas/settlements/${id}`, { method: "DELETE" });
    load();
  }

  const ownerName = (o: "PARTNER_A" | "PARTNER_B") =>
    o === "PARTNER_A" ? settings?.partnerAName ?? "A" : settings?.partnerBName ?? "B";

  return (
    <div>
      <PageHeader
        title="Casal"
        description="Análise dos gastos do casal e acertos entre vocês."
        actions={
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90"
          >
            <Plus className="w-4 h-4" />
            Registrar acerto
          </button>
        }
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <>
          {dash && (
            <>
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Visão geral do casal
                </h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                <div className="bg-card border border-border rounded-xl p-5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-muted-foreground">Despesas do mês (casal)</p>
                    <TrendingDown className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <p className="text-2xl font-bold tabular-nums text-destructive">
                    {formatCurrency(dash.totals.expense)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Soma de tudo que vocês dois gastaram juntos
                  </p>
                </div>

                <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
                  <h3 className="text-sm font-semibold mb-3">Últimos 6 meses</h3>
                  <IncomeExpenseLine data={dash.monthlySeries} height={180} />
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-5 mb-6">
                <h3 className="text-sm font-semibold mb-3">Despesas do mês por categoria</h3>
                {dash.expensesByCategory.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    Nenhuma despesa neste mês.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <CategoryDonut
                      data={dash.expensesByCategory.map((c) => ({
                        name: c.name,
                        amount: c.amount,
                        color: c.color,
                      }))}
                      size={220}
                    />
                    <ul className="space-y-1 text-xs max-h-56 overflow-y-auto">
                      {dash.expensesByCategory.slice(0, 10).map((c, i) => {
                        const total = dash.expensesByCategory.reduce((s, x) => s + x.amount, 0);
                        const pct = total > 0 ? (c.amount / total) * 100 : 0;
                        return (
                          <li key={i} className="flex items-center justify-between gap-2">
                            <span className="flex items-center gap-2 min-w-0">
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: c.color }}
                              />
                              <span className="truncate">{c.name}</span>
                            </span>
                            <span className="tabular-nums shrink-0">
                              {formatCurrency(c.amount)}{" "}
                              <span className="text-muted-foreground">({pct.toFixed(0)}%)</span>
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mb-3 mt-8">
                <Scale className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Acertos entre vocês
                </h2>
              </div>
            </>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Scale className="w-5 h-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Saldo atual</h2>
              </div>
              {!balance || balance.amount < 0.01 ? (
                <div className="text-center py-6">
                  <p className="text-2xl font-bold text-success">Tudo certo!</p>
                  <p className="text-sm text-muted-foreground mt-1">Ninguém deve nada a ninguém.</p>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <span className="text-base">{ownerName(balance.whoOwes!)}</span>
                    <ArrowRight className="w-5 h-5 text-muted-foreground" />
                    <span className="text-base">
                      {ownerName(balance.whoOwes === "PARTNER_A" ? "PARTNER_B" : "PARTNER_A")}
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-primary tabular-nums">
                    {formatCurrency(balance.amount)}
                  </p>
                </div>
              )}
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <HandCoins className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Composição</h2>
              </div>
              {balance ? (
                <ul className="space-y-2 text-sm">
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">{ownerName("PARTNER_A")} pagou pelo casal</span>
                    <span className="tabular-nums">{formatCurrency(balance.details.aPaidForCouple)}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">{ownerName("PARTNER_B")} pagou pelo casal</span>
                    <span className="tabular-nums">{formatCurrency(balance.details.bPaidForCouple)}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">
                      {ownerName("PARTNER_A")} pagou por {ownerName("PARTNER_B")}
                    </span>
                    <span className="tabular-nums">{formatCurrency(balance.details.aPaidForB)}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">
                      {ownerName("PARTNER_B")} pagou por {ownerName("PARTNER_A")}
                    </span>
                    <span className="tabular-nums">{formatCurrency(balance.details.bPaidForA)}</span>
                  </li>
                  <li className="flex justify-between border-t border-border pt-2">
                    <span className="text-muted-foreground">Acertos {ownerName("PARTNER_A")} → {ownerName("PARTNER_B")}</span>
                    <span className="tabular-nums">{formatCurrency(balance.details.settlementsAtoB)}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Acertos {ownerName("PARTNER_B")} → {ownerName("PARTNER_A")}</span>
                    <span className="tabular-nums">{formatCurrency(balance.details.settlementsBtoA)}</span>
                  </li>
                </ul>
              ) : null}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Histórico de acertos</h2>
            </div>
            {settlements.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground text-center">
                Nenhum acerto registrado.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/30 text-left text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 font-medium">Data</th>
                    <th className="px-4 py-2 font-medium">De</th>
                    <th className="px-4 py-2 font-medium">Para</th>
                    <th className="px-4 py-2 font-medium text-right">Valor</th>
                    <th className="px-4 py-2 font-medium">Observação</th>
                    <th className="w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {settlements.map((s) => (
                    <tr key={s.id} className="border-t border-border hover:bg-muted/30">
                      <td className="px-4 py-2">{new Date(s.date).toLocaleDateString("pt-BR")}</td>
                      <td className="px-4 py-2">{ownerName(s.fromOwner)}</td>
                      <td className="px-4 py-2">{ownerName(s.toOwner)}</td>
                      <td className="px-4 py-2 text-right tabular-nums font-medium">
                        {formatCurrency(s.amount)}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">{s.notes || "—"}</td>
                      <td className="px-4 py-2 text-right">
                        <button
                          onClick={() => remove(s.id)}
                          className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {creating && balance && settings && (
        <SettlementModal
          settings={settings}
          suggested={balance}
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function SettlementModal({
  settings,
  suggested,
  onClose,
  onSaved,
}: {
  settings: Settings;
  suggested: Balance;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [fromOwner, setFromOwner] = useState<"PARTNER_A" | "PARTNER_B">(
    suggested.whoOwes ?? "PARTNER_A"
  );
  const [toOwner, setToOwner] = useState<"PARTNER_A" | "PARTNER_B">(
    suggested.whoOwes === "PARTNER_A" ? "PARTNER_B" : "PARTNER_A"
  );
  const [amount, setAmount] = useState(
    suggested.amount > 0 ? suggested.amount.toFixed(2) : ""
  );
  const [date, setDate] = useState(todayISO());
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    if (fromOwner === toOwner) {
      setError("Selecione duas pessoas diferentes");
      setSaving(false);
      return;
    }
    const numericAmount = parseFloat(amount.replace(",", "."));
    const res = await fetch("/api/financas/settlements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: numericAmount,
        fromOwner,
        toOwner,
        date,
        notes: notes || null,
      }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d?.error || "Erro");
      setSaving(false);
      return;
    }
    onSaved();
  }

  const ownerName = (o: "PARTNER_A" | "PARTNER_B") =>
    o === "PARTNER_A" ? settings.partnerAName : settings.partnerBName;

  return (
    <Modal title="Registrar acerto" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Quando um pagou ao outro (Pix, dinheiro, etc) para zerar a dívida.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">De (quem pagou)</label>
            <select
              value={fromOwner}
              onChange={(e) => {
                const v = e.target.value as "PARTNER_A" | "PARTNER_B";
                setFromOwner(v);
                if (v === toOwner) setToOwner(v === "PARTNER_A" ? "PARTNER_B" : "PARTNER_A");
              }}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background"
            >
              <option value="PARTNER_A">{ownerName("PARTNER_A")}</option>
              <option value="PARTNER_B">{ownerName("PARTNER_B")}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Para (quem recebeu)</label>
            <select
              value={toOwner}
              onChange={(e) => setToOwner(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background"
            >
              <option value="PARTNER_A">{ownerName("PARTNER_A")}</option>
              <option value="PARTNER_B">{ownerName("PARTNER_B")}</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Valor</label>
            <input
              required
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Data</label>
            <input
              required
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Observação <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Pix no dia 10/05"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background"
          />
        </div>
        {error && <div className="text-sm text-destructive bg-destructive/10 p-2 rounded-lg">{error}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-border hover:bg-muted">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Registrar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
