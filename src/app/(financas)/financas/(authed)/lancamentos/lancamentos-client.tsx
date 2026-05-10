"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, Download } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/financas/page-header";
import { formatCurrency } from "@/lib/utils";

type Account = { id: string; name: string; color: string; type: string; archived?: boolean };
type Category = {
  id: string;
  name: string;
  kind: "INCOME" | "EXPENSE";
  color: string;
  archived: boolean;
};
type Transaction = {
  id: string;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amount: number;
  date: string;
  description: string;
  notes: string | null;
  owner: "PARTNER_A" | "PARTNER_B" | "COUPLE";
  paidByOwner: "PARTNER_A" | "PARTNER_B" | null;
  splitRatio: number | null;
  account: { id: string; name: string; color: string };
  toAccount: { id: string; name: string; color: string } | null;
  category: { id: string; name: string; color: string } | null;
};
type Settings = { partnerAName: string; partnerBName: string; currency: string };

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function firstDayOfMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export function LancamentosClient() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [creating, setCreating] = useState(false);

  const [from, setFrom] = useState(firstDayOfMonth());
  const [to, setTo] = useState(todayISO());
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [owner, setOwner] = useState("");
  const [type, setType] = useState("");
  const [q, setQ] = useState("");

  async function loadStatic() {
    const [accRes, catRes, setRes] = await Promise.all([
      fetch("/api/financas/accounts"),
      fetch("/api/financas/categories"),
      fetch("/api/financas/settings"),
    ]);
    setAccounts(await accRes.json());
    setCategories(await catRes.json());
    setSettings(await setRes.json());
  }

  async function loadTx() {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to + "T23:59:59");
    if (accountId) params.set("accountId", accountId);
    if (categoryId) params.set("categoryId", categoryId);
    if (owner) params.set("owner", owner);
    if (type) params.set("type", type);
    if (q) params.set("q", q);
    const res = await fetch(`/api/financas/transactions?${params.toString()}`);
    const data = await res.json();
    setTransactions(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    loadStatic();
  }, []);

  useEffect(() => {
    loadTx();
  }, [from, to, accountId, categoryId, owner, type, q]);

  async function remove(id: string) {
    if (!confirm("Excluir este lançamento?")) return;
    await fetch(`/api/financas/transactions/${id}`, { method: "DELETE" });
    loadTx();
  }

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of transactions) {
      if (t.type === "INCOME") income += t.amount;
      else if (t.type === "EXPENSE") expense += t.amount;
    }
    return { income, expense, net: income - expense };
  }, [transactions]);

  const ownerLabel = (o: string) => {
    if (!settings) return o;
    if (o === "PARTNER_A") return settings.partnerAName;
    if (o === "PARTNER_B") return settings.partnerBName;
    return "Casal";
  };

  return (
    <div>
      <PageHeader
        title="Lançamentos"
        description="Receitas, despesas e transferências entre contas."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const params = new URLSearchParams();
                if (from) params.set("from", from);
                if (to) params.set("to", to + "T23:59:59");
                window.location.href = `/api/financas/export?${params.toString()}`;
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted text-sm"
            >
              <Download className="w-4 h-4" />
              Exportar CSV
            </button>
            <button
              onClick={() => setCreating(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition"
            >
              <Plus className="w-4 h-4" />
              Novo lançamento
            </button>
          </div>
        }
      />

      <div className="bg-card border border-border rounded-xl p-4 mb-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <FilterField label="De">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full px-2 py-1.5 rounded-md border border-border bg-background text-sm"
          />
        </FilterField>
        <FilterField label="Até">
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full px-2 py-1.5 rounded-md border border-border bg-background text-sm"
          />
        </FilterField>
        <FilterField label="Conta">
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full px-2 py-1.5 rounded-md border border-border bg-background text-sm"
          >
            <option value="">Todas</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Categoria">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-2 py-1.5 rounded-md border border-border bg-background text-sm"
          >
            <option value="">Todas</option>
            {categories.filter((c) => !c.archived).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Dono">
          <select
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            className="w-full px-2 py-1.5 rounded-md border border-border bg-background text-sm"
          >
            <option value="">Todos</option>
            <option value="PARTNER_A">{settings?.partnerAName ?? "Pessoa A"}</option>
            <option value="PARTNER_B">{settings?.partnerBName ?? "Pessoa B"}</option>
            <option value="COUPLE">Casal</option>
          </select>
        </FilterField>
        <FilterField label="Tipo">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-2 py-1.5 rounded-md border border-border bg-background text-sm"
          >
            <option value="">Todos</option>
            <option value="INCOME">Receita</option>
            <option value="EXPENSE">Despesa</option>
            <option value="TRANSFER">Transferência</option>
          </select>
        </FilterField>
        <FilterField label="Buscar">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Descrição..."
            className="w-full px-2 py-1.5 rounded-md border border-border bg-background text-sm"
          />
        </FilterField>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <SummaryCard label="Receitas" value={totals.income} positive />
        <SummaryCard label="Despesas" value={totals.expense} negative />
        <SummaryCard label="Saldo do período" value={totals.net} positive={totals.net >= 0} negative={totals.net < 0} />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-muted-foreground">Carregando...</p>
        ) : transactions.length === 0 ? (
          <p className="p-12 text-sm text-muted-foreground text-center">
            Nenhum lançamento no período. Clique em "Novo lançamento" para começar.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Descrição</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
                <th className="px-4 py-3 font-medium">Conta</th>
                <th className="px-4 py-3 font-medium">Dono</th>
                <th className="px-4 py-3 font-medium text-right">Valor</th>
                <th className="px-4 py-3 font-medium w-20"></th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {new Date(t.date).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <TypeIcon type={t.type} />
                      <span>{t.description}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {t.type === "TRANSFER" ? (
                      <span className="text-muted-foreground">Transferência</span>
                    ) : t.category ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: t.category.color }}
                        />
                        {t.category.name}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {t.type === "TRANSFER" && t.toAccount ? (
                      <span>
                        {t.account.name} → {t.toAccount.name}
                      </span>
                    ) : (
                      t.account.name
                    )}
                  </td>
                  <td className="px-4 py-3">{ownerLabel(t.owner)}</td>
                  <td className={`px-4 py-3 text-right font-medium tabular-nums ${
                    t.type === "INCOME" ? "text-success" : t.type === "EXPENSE" ? "text-destructive" : ""
                  }`}>
                    {t.type === "EXPENSE" ? "−" : t.type === "INCOME" ? "+" : ""}
                    {formatCurrency(t.amount)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setEditing(t)}
                      className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => remove(t.id)}
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

      {creating && (
        <TransactionModal
          accounts={accounts}
          categories={categories}
          settings={settings}
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            loadTx();
          }}
        />
      )}
      {editing && (
        <TransactionModal
          transaction={editing}
          accounts={accounts}
          categories={categories}
          settings={settings}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            loadTx();
          }}
        />
      )}
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs">
      <span className="text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function SummaryCard({
  label,
  value,
  positive,
  negative,
}: {
  label: string;
  value: number;
  positive?: boolean;
  negative?: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`text-xl font-bold mt-1 tabular-nums ${
          positive ? "text-success" : negative ? "text-destructive" : ""
        }`}
      >
        {formatCurrency(value)}
      </p>
    </div>
  );
}

function TypeIcon({ type }: { type: "INCOME" | "EXPENSE" | "TRANSFER" }) {
  if (type === "INCOME") return <ArrowUpCircle className="w-4 h-4 text-success" />;
  if (type === "EXPENSE") return <ArrowDownCircle className="w-4 h-4 text-destructive" />;
  return <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />;
}

function TransactionModal({
  transaction,
  accounts,
  categories,
  settings,
  onClose,
  onSaved,
}: {
  transaction?: Transaction;
  accounts: Account[];
  categories: Category[];
  settings: Settings | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [type, setType] = useState<"INCOME" | "EXPENSE" | "TRANSFER">(
    transaction?.type || "EXPENSE"
  );
  const [amount, setAmount] = useState(transaction?.amount?.toString() || "");
  const [date, setDate] = useState(
    transaction
      ? new Date(transaction.date).toISOString().slice(0, 10)
      : todayISO()
  );
  const [description, setDescription] = useState(transaction?.description || "");
  const [notes, setNotes] = useState(transaction?.notes || "");
  const [owner, setOwner] = useState<"PARTNER_A" | "PARTNER_B" | "COUPLE">(
    transaction?.owner || "COUPLE"
  );
  const [paidByOwner, setPaidByOwner] = useState<"PARTNER_A" | "PARTNER_B" | "">(
    transaction?.paidByOwner || ""
  );
  const [splitPercentA, setSplitPercentA] = useState(
    typeof transaction?.splitRatio === "number" ? Math.round(transaction.splitRatio * 100) : 50
  );
  const [accountId, setAccountId] = useState(
    transaction?.account.id || accounts.find((a) => !a.archived)?.id || ""
  );
  const [toAccountId, setToAccountId] = useState(
    transaction?.toAccount?.id || ""
  );
  const [categoryId, setCategoryId] = useState(transaction?.category?.id || "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const filteredCategories = categories.filter(
    (c) => !c.archived && c.kind === (type === "INCOME" ? "INCOME" : "EXPENSE")
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const numericAmount = parseFloat(amount.replace(",", "."));
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Valor inválido");
      setSaving(false);
      return;
    }
    const url = transaction
      ? `/api/financas/transactions/${transaction.id}`
      : "/api/financas/transactions";
    const res = await fetch(url, {
      method: transaction ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        amount: numericAmount,
        date,
        description,
        notes: notes || null,
        owner,
        paidByOwner: type === "EXPENSE" ? (paidByOwner || null) : null,
        splitRatio:
          type === "EXPENSE" && owner === "COUPLE"
            ? Math.min(Math.max(splitPercentA, 0), 100) / 100
            : null,
        accountId,
        toAccountId: type === "TRANSFER" ? toAccountId : null,
        categoryId: type === "TRANSFER" ? null : categoryId || null,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data?.error || "Erro ao salvar");
      setSaving(false);
      return;
    }
    onSaved();
  }

  return (
    <Modal
      title={transaction ? "Editar lançamento" : "Novo lançamento"}
      onClose={onClose}
      maxWidth="max-w-lg"
    >
      <form onSubmit={submit} className="space-y-4">
        {!transaction && (
          <div className="grid grid-cols-3 gap-2">
            {(["EXPENSE", "INCOME", "TRANSFER"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`px-3 py-2 rounded-lg border text-sm font-medium transition ${
                  type === t
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:bg-muted"
                }`}
              >
                {t === "EXPENSE" ? "Despesa" : t === "INCOME" ? "Receita" : "Transferência"}
              </button>
            ))}
          </div>
        )}

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
              placeholder="0,00"
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
          <label className="block text-sm font-medium mb-1">Descrição</label>
          <input
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Mercado da semana"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            {type === "TRANSFER" ? "De (conta de origem)" : "Conta"}
          </label>
          <select
            required
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background"
          >
            {accounts.filter((a) => !a.archived).map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        {type === "TRANSFER" ? (
          <div>
            <label className="block text-sm font-medium mb-1">Para (conta de destino)</label>
            <select
              required
              value={toAccountId}
              onChange={(e) => setToAccountId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background"
            >
              <option value="">Selecione...</option>
              {accounts
                .filter((a) => !a.archived && a.id !== accountId)
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium mb-1">Categoria</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background"
            >
              <option value="">Sem categoria</option>
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Quem é</label>
          <div className="grid grid-cols-3 gap-2">
            {(["PARTNER_A", "PARTNER_B", "COUPLE"] as const).map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => setOwner(o)}
                className={`px-3 py-2 rounded-lg border text-sm transition ${
                  owner === o
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:bg-muted"
                }`}
              >
                {o === "PARTNER_A"
                  ? settings?.partnerAName ?? "Pessoa A"
                  : o === "PARTNER_B"
                  ? settings?.partnerBName ?? "Pessoa B"
                  : "Casal"}
              </button>
            ))}
          </div>
        </div>

        {type === "EXPENSE" && (
          <div className="bg-muted/30 rounded-lg p-3 space-y-3">
            <p className="text-xs text-muted-foreground">
              Acerto do casal (opcional). Se quem pagou for diferente de quem é a despesa, isso entra
              no cálculo de quem deve a quem.
            </p>
            <div>
              <label className="block text-xs font-medium mb-1">Quem pagou</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaidByOwner("")}
                  className={`px-3 py-1.5 rounded-lg border text-xs ${
                    paidByOwner === "" ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
                  }`}
                >
                  Não acertar
                </button>
                <button
                  type="button"
                  onClick={() => setPaidByOwner("PARTNER_A")}
                  className={`px-3 py-1.5 rounded-lg border text-xs ${
                    paidByOwner === "PARTNER_A" ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
                  }`}
                >
                  {settings?.partnerAName ?? "Pessoa A"}
                </button>
                <button
                  type="button"
                  onClick={() => setPaidByOwner("PARTNER_B")}
                  className={`px-3 py-1.5 rounded-lg border text-xs ${
                    paidByOwner === "PARTNER_B" ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
                  }`}
                >
                  {settings?.partnerBName ?? "Pessoa B"}
                </button>
              </div>
            </div>
            {owner === "COUPLE" && paidByOwner && (
              <div>
                <label className="block text-xs font-medium mb-1">
                  Divisão: {settings?.partnerAName ?? "A"} {splitPercentA}% / {settings?.partnerBName ?? "B"} {100 - splitPercentA}%
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={splitPercentA}
                  onChange={(e) => setSplitPercentA(parseInt(e.target.value, 10))}
                  className="w-full"
                />
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">
            Observações <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background resize-none"
          />
        </div>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-2 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-border hover:bg-muted"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
