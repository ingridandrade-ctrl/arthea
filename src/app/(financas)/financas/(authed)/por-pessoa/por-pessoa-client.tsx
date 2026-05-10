"use client";

import { useEffect, useMemo, useState } from "react";
import { User, Users, Wallet } from "lucide-react";
import { PageHeader } from "@/components/financas/page-header";
import { formatCurrency } from "@/lib/utils";

type CategoryAgg = {
  id: string | null;
  name: string;
  color: string;
  amount: number;
};

type Bucket = { total: number; byCategory: CategoryAgg[] };

type Person = { own: Bucket; couple: Bucket; total: number };

type Data = {
  partnerAName: string;
  partnerBName: string;
  partnerA: Person;
  partnerB: Person;
};

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
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const { from, to } = rangeFor(period);
    const params = new URLSearchParams();
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
  }, [period]);

  return (
    <div>
      <PageHeader
        title="Por pessoa"
        description="Quanto cada um gastou: próprios + sua parte das despesas do casal."
      />

      <div className="flex flex-wrap gap-2 mb-5">
        {(Object.keys(PERIOD_LABEL) as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1.5 rounded-lg border text-sm ${
              period === p
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border hover:bg-muted"
            }`}
          >
            {PERIOD_LABEL[p]}
          </button>
        ))}
      </div>

      {loading || !data ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          <PersonCard name={data.partnerAName} person={data.partnerA} />
          <PersonCard name={data.partnerBName} person={data.partnerB} />
        </div>
      )}
    </div>
  );
}

function PersonCard({ name, person }: { name: string; person: Person }) {
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
      />
      <Section
        icon={<Users className="w-4 h-4" />}
        label="Compartilhados (sua parte)"
        sublabel="Sua fatia das despesas marcadas como Casal"
        bucket={person.couple}
      />
    </div>
  );
}

function Section({
  icon,
  label,
  sublabel,
  bucket,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  bucket: Bucket;
}) {
  const max = bucket.byCategory.reduce((m, c) => Math.max(m, c.amount), 0);
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
      {bucket.byCategory.length === 0 ? (
        <p className="px-5 py-3 text-xs text-muted-foreground italic">Nada nesse período.</p>
      ) : (
        <div className="px-5 py-3 space-y-2">
          {bucket.byCategory.map((c) => {
            const pct = max > 0 ? (c.amount / max) * 100 : 0;
            return (
              <div key={c.id ?? "__none__"}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: c.color }}
                    />
                    {c.name}
                  </span>
                  <span className="tabular-nums font-medium">{formatCurrency(c.amount)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: c.color }}
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
