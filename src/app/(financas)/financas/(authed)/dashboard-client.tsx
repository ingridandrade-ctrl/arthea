"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  ArrowLeftRight,
} from "lucide-react";
import { PageHeader } from "@/components/financas/page-header";
import { formatCurrency } from "@/lib/utils";
import { ACCOUNT_TYPE_LABEL } from "@/lib/financas/defaults";

type DashboardData = {
  household: { partnerAName: string; partnerBName: string; currency: string };
  period: { year: number; month: number; label: string };
  totals: { balance: number; income: number; expense: number; net: number };
  accounts: {
    id: string;
    name: string;
    type: keyof typeof ACCOUNT_TYPE_LABEL;
    color: string;
    balance: number;
  }[];
  expensesByCategory: {
    categoryId: string | null;
    name: string;
    color: string;
    amount: number;
  }[];
  byOwner: Record<string, { income: number; expense: number }>;
  monthlySeries: { month: string; income: number; expense: number }[];
};

function thisMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function DashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [month, setMonth] = useState(thisMonth());
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/financas/dashboard?month=${month}`);
    const d = await res.json();
    setData(d);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [month]);

  if (loading || !data) {
    return (
      <div>
        <PageHeader title="Visão geral" description="Carregando..." />
      </div>
    );
  }

  const totalExpenseInCategories = data.expensesByCategory.reduce(
    (acc, c) => acc + c.amount,
    0
  );

  const maxBar = Math.max(
    ...data.monthlySeries.flatMap((m) => [m.income, m.expense]),
    1
  );

  return (
    <div>
      <PageHeader
        title={`Olá, ${data.household.partnerAName} & ${data.household.partnerBName}`}
        description="Visão geral das finanças do casal."
        actions={
          <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-1 py-1">
            <button
              onClick={() => setMonth(shiftMonth(month, -1))}
              className="p-1.5 rounded hover:bg-muted"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium px-2 capitalize">
              {data.period.label}
            </span>
            <button
              onClick={() => setMonth(shiftMonth(month, 1))}
              className="p-1.5 rounded hover:bg-muted"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          icon={<Wallet className="w-5 h-5" />}
          label="Saldo total"
          value={data.totals.balance}
          tone={data.totals.balance >= 0 ? "neutral" : "negative"}
        />
        <KpiCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Receitas do mês"
          value={data.totals.income}
          tone="positive"
        />
        <KpiCard
          icon={<TrendingDown className="w-5 h-5" />}
          label="Despesas do mês"
          value={data.totals.expense}
          tone="negative"
        />
        <KpiCard
          icon={<ArrowLeftRight className="w-5 h-5" />}
          label="Resultado do mês"
          value={data.totals.net}
          tone={data.totals.net >= 0 ? "positive" : "negative"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-4">Últimos 6 meses</h2>
          {data.monthlySeries.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados.</p>
          ) : (
            <div className="space-y-3">
              {data.monthlySeries.map((m) => (
                <div key={m.month}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">
                      {monthLabel(m.month)}
                    </span>
                    <span className="tabular-nums">
                      <span className="text-success">{formatCurrency(m.income)}</span>
                      {"  /  "}
                      <span className="text-destructive">{formatCurrency(m.expense)}</span>
                    </span>
                  </div>
                  <div className="flex gap-1 h-3">
                    <div
                      className="bg-success rounded-sm"
                      style={{ width: `${(m.income / maxBar) * 100}%` }}
                    />
                    <div
                      className="bg-destructive rounded-sm"
                      style={{ width: `${(m.expense / maxBar) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-4">Por dono (mês atual)</h2>
          <OwnerRow
            label={data.household.partnerAName}
            data={data.byOwner.PARTNER_A}
          />
          <OwnerRow
            label={data.household.partnerBName}
            data={data.byOwner.PARTNER_B}
          />
          <OwnerRow label="Casal" data={data.byOwner.COUPLE} last />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-4">
            Despesas por categoria
          </h2>
          {data.expensesByCategory.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma despesa neste mês.
            </p>
          ) : (
            <div className="space-y-2.5">
              {data.expensesByCategory.slice(0, 8).map((c) => {
                const pct =
                  totalExpenseInCategories > 0
                    ? (c.amount / totalExpenseInCategories) * 100
                    : 0;
                return (
                  <div key={c.categoryId || "none"}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: c.color }}
                        />
                        {c.name}
                      </span>
                      <span className="tabular-nums text-muted-foreground">
                        {formatCurrency(c.amount)}{" "}
                        <span className="text-xs">({pct.toFixed(0)}%)</span>
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: c.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Suas contas</h2>
            <Link
              href="/financas/contas"
              className="text-xs text-primary hover:underline"
            >
              Gerenciar
            </Link>
          </div>
          {data.accounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma conta.</p>
          ) : (
            <div className="space-y-3">
              {data.accounts.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: a.color }}
                    />
                    <div>
                      <p className="text-sm font-medium">{a.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {ACCOUNT_TYPE_LABEL[a.type]}
                      </p>
                    </div>
                  </div>
                  <p
                    className={`text-sm font-semibold tabular-nums ${
                      a.balance < 0 ? "text-destructive" : ""
                    }`}
                  >
                    {formatCurrency(a.balance)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "positive" | "negative" | "neutral";
}) {
  const color =
    tone === "positive"
      ? "text-success"
      : tone === "negative"
      ? "text-destructive"
      : "";
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-muted-foreground">{label}</p>
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <p className={`text-2xl font-bold tabular-nums ${color}`}>
        {formatCurrency(value)}
      </p>
    </div>
  );
}

function OwnerRow({
  label,
  data,
  last,
}: {
  label: string;
  data: { income: number; expense: number };
  last?: boolean;
}) {
  return (
    <div className={`py-3 ${!last ? "border-b border-border" : ""}`}>
      <p className="text-sm font-medium mb-1">{label}</p>
      <div className="flex justify-between text-xs">
        <span className="text-success tabular-nums">
          + {formatCurrency(data.income)}
        </span>
        <span className="text-destructive tabular-nums">
          − {formatCurrency(data.expense)}
        </span>
      </div>
    </div>
  );
}

function monthLabel(yyyymm: string): string {
  const [y, m] = yyyymm.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
}
