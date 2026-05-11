"use client";

import { useEffect, useState } from "react";
import { User, Users, Wallet, CreditCard, Tag } from "lucide-react";
import { PageHeader } from "@/components/financas/page-header";
import { FilterBar, FilterGroup, SegControl } from "@/components/financas/filters";
import { formatCurrency } from "@/lib/utils";
import { GroupedBars } from "@/components/financas/charts";

type CategoryAgg = {
  id: string | null;
  name: string;
  color: string;
  amount: number;
};

type AccountAgg = {
  id: string;
  name: string;
  color: string;
  type: string;
  amount: number;
};

type Bucket = {
  total: number;
  byCategory: CategoryAgg[];
  byAccount: AccountAgg[];
};

type Person = { own: Bucket; couple: Bucket; total: number };

type Data = {
  partnerAName: string;
  partnerBName: string;
  partnerA: Person;
  partnerB: Person;
};

type GroupBy = "category" | "account";

type Period = "this_month" | "last_month" | "year" | "all";

function rangeFor(p: Period): { from: string | null; to: string | null } {
  const now = new Date();
  if (p === "this_month") {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return { from: from.toISOString(), to: to.toISOString() };
  }
  if (p === "last_month") {
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    return { from: from.toISOString(), to: to.toISOString() };
  }
  if (p === "year") {
    const from = new Date(now.getFullYear(), 0, 1);
    const to = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    return { from: from.toISOString(), to: to.toISOString() };
  }
  return { from: null, to: null };
}

const PERIOD_LABEL: Record<Period, string> = {
  this_month: "Este mês",
  last_month: "Mês passado",
  year: "Este ano",
  all: "Tudo",
};

export function PorPessoaClient() {
  const [period, setPeriod] = useState<Period>("this_month");
  const cardGrouping = "fatura_month" as const;
  const [groupBy, setGroupBy] = useState<GroupBy>("category");
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const { from, to } = rangeFor(period);
    const params = new URLSearchParams({ cardGrouping });
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    fetch(`/api/financas/per-person?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [period, cardGrouping]);

  return (
    <div>
      <PageHeader
        title="Por pessoa"
        description="Quanto cada um gastou: próprios + sua parte das despesas do casal."
      />

      <FilterBar>
        <FilterGroup label="Período">
          <SegControl
            value={period}
            onChange={(v) => setPeriod(v as Period)}
            options={(Object.keys(PERIOD_LABEL) as Period[]).map((p) => ({
              value: p,
              label: PERIOD_LABEL[p],
            }))}
          />
        </FilterGroup>

        <FilterGroup label="Agrupar por">
          <SegControl
            value={groupBy}
            onChange={(v) => setGroupBy(v)}
            options={[
              { value: "category", label: "Categoria", icon: <Tag className="w-3.5 h-3.5" /> },
              { value: "account", label: "Origem", icon: <CreditCard className="w-3.5 h-3.5" /> },
            ]}
          />
        </FilterGroup>

      </FilterBar>

      {loading || !data ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <>
          <div className="bg-card border border-border rounded-xl p-5 mb-4">
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="text-sm font-semibold">
                {data.partnerAName} vs {data.partnerBName}
              </h2>
              <p className="text-xs text-muted-foreground">
                Comparativo por {groupBy === "category" ? "categoria" : "origem"}
              </p>
            </div>
            <ComparisonChart data={data} groupBy={groupBy} />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <PersonCard name={data.partnerAName} person={data.partnerA} groupBy={groupBy} />
            <PersonCard name={data.partnerBName} person={data.partnerB} groupBy={groupBy} />
          </div>
        </>
      )}
    </div>
  );
}

function ComparisonChart({
  data,
  groupBy,
}: {
  data: Data;
  groupBy: GroupBy;
}) {
  const aggregate = (bucket: Bucket) =>
    groupBy === "category"
      ? bucket.byCategory.map((c) => ({ key: c.id ?? "__none__", label: c.name, amount: c.amount }))
      : bucket.byAccount.map((a) => ({ key: a.id, label: a.name, amount: a.amount }));

  const aA = new Map<string, { label: string; amount: number }>();
  for (const it of [...aggregate(data.partnerA.own), ...aggregate(data.partnerA.couple)]) {
    const prev = aA.get(it.key);
    aA.set(it.key, { label: it.label, amount: (prev?.amount ?? 0) + it.amount });
  }
  const aB = new Map<string, { label: string; amount: number }>();
  for (const it of [...aggregate(data.partnerB.own), ...aggregate(data.partnerB.couple)]) {
    const prev = aB.get(it.key);
    aB.set(it.key, { label: it.label, amount: (prev?.amount ?? 0) + it.amount });
  }

  const keys = new Set<string>([...aA.keys(), ...aB.keys()]);
  const rows = Array.from(keys).map((k) => ({
    key: k,
    label: aA.get(k)?.label ?? aB.get(k)?.label ?? "—",
    [data.partnerAName]: aA.get(k)?.amount ?? 0,
    [data.partnerBName]: aB.get(k)?.amount ?? 0,
    _total: (aA.get(k)?.amount ?? 0) + (aB.get(k)?.amount ?? 0),
  }));

  rows.sort((x, y) => y._total - x._total);
  const top = rows.slice(0, 8);

  if (top.length === 0) {
    return <p className="text-sm text-muted-foreground py-6 text-center">Sem dados no período.</p>;
  }

  return (
    <GroupedBars
      data={top}
      series={[
        { key: data.partnerAName, name: data.partnerAName, color: "var(--color-primary)" },
        { key: data.partnerBName, name: data.partnerBName, color: "#94a3b8" },
      ]}
      layout="horizontal"
      height={Math.max(220, top.length * 36 + 60)}
    />
  );
}

function PersonCard({
  name,
  person,
  groupBy,
}: {
  name: string;
  person: Person;
  groupBy: GroupBy;
}) {
  const grand = person.total;
  const ownPct = grand > 0 ? (person.own.total / grand) * 100 : 0;
  const couplePct = grand > 0 ? (person.couple.total / grand) * 100 : 0;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">{name}</h3>
        </div>
        <p className="text-3xl font-bold tabular-nums">{formatCurrency(grand)}</p>
        <p className="text-xs text-muted-foreground mt-1">Total gasto no período</p>

        {grand > 0 && (
          <div className="mt-4 flex h-2 rounded-full overflow-hidden bg-muted">
            <div
              className="bg-primary"
              style={{ width: `${ownPct}%` }}
              title={`Próprios: ${ownPct.toFixed(0)}%`}
            />
            <div
              className="bg-accent"
              style={{ width: `${couplePct}%`, backgroundColor: "#94a3b8" }}
              title={`Casal: ${couplePct.toFixed(0)}%`}
            />
          </div>
        )}
      </div>

      <Section
        icon={<Wallet className="w-4 h-4" />}
        label="Próprios"
        sublabel="Despesas marcadas como suas"
        bucket={person.own}
        groupBy={groupBy}
      />
      <Section
        icon={<Users className="w-4 h-4" />}
        label="Compartilhados (sua parte)"
        sublabel="Sua fatia das despesas marcadas como Casal"
        bucket={person.couple}
        groupBy={groupBy}
      />
    </div>
  );
}

function Section({
  icon,
  label,
  sublabel,
  bucket,
  groupBy,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  bucket: Bucket;
  groupBy: GroupBy;
}) {
  const items =
    groupBy === "category"
      ? bucket.byCategory.map((c) => ({
          key: c.id ?? "__none__",
          name: c.name,
          color: c.color,
          amount: c.amount,
        }))
      : bucket.byAccount.map((a) => ({
          key: a.id,
          name: a.name,
          color: a.color,
          amount: a.amount,
        }));

  const max = items.reduce((m, it) => Math.max(m, it.amount), 0);

  return (
    <div className="border-b border-border last:border-b-0">
      <div className="px-5 py-3 flex items-center justify-between bg-muted/30">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium">
            {icon}
            {label}
          </div>
          <p className="text-xs text-muted-foreground">{sublabel}</p>
        </div>
        <p className="text-lg font-semibold tabular-nums">{formatCurrency(bucket.total)}</p>
      </div>
      {items.length === 0 ? (
        <p className="px-5 py-3 text-xs text-muted-foreground italic">Nada nesse período.</p>
      ) : (
        <div className="px-5 py-3 space-y-2">
          {items.map((it) => {
            const pct = max > 0 ? (it.amount / max) * 100 : 0;
            return (
              <div key={it.key}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: it.color }}
                    />
                    {it.name}
                  </span>
                  <span className="tabular-nums font-medium">{formatCurrency(it.amount)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: it.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
