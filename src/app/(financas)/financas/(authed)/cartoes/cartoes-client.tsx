"use client";

import { useEffect, useState } from "react";
import { CreditCard, CheckCircle2, Clock, AlertTriangle, Lock, Sparkles, Trash2, Pencil, CalendarClock } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/financas/page-header";
import { formatCurrency } from "@/lib/utils";

type Account = {
  id: string;
  name: string;
  color: string;
  type: string;
  archived: boolean;
  creditLimit?: number | null;
  closingDay?: number | null;
  dueDay?: number | null;
  initialBalance?: number;
  owner?: "PARTNER_A" | "PARTNER_B" | "COUPLE";
};

type Settings = { partnerAName: string; partnerBName: string };

type Category = { id: string; name: string };

type Owner = "PARTNER_A" | "PARTNER_B" | "COUPLE";

type InvoiceTx = {
  id: string;
  amount: number;
  description: string;
  date: string;
  owner: "PARTNER_A" | "PARTNER_B" | "COUPLE";
  installmentGroupId: string | null;
  installmentIndex: number | null;
  installmentTotal: number | null;
  installmentProjected: boolean;
  category: { id: string; name: string; color: string } | null;
};

type Invoice = {
  id: string;
  accountId: string;
  year: number;
  month: number;
  closingDate: string;
  dueDate: string;
  paidAt: string | null;
  status: "OPEN" | "CLOSED" | "PAID" | "OVERDUE";
  total: number;
  account: { id: string; name: string; color: string; closingDay: number | null; dueDay: number | null };
  paymentAccount: { id: string; name: string } | null;
  transactions: InvoiceTx[];
};

const STATUS_LABEL: Record<Invoice["status"], string> = {
  OPEN: "Aberta",
  CLOSED: "Fechada",
  PAID: "Paga",
  OVERDUE: "Atrasada",
};

const STATUS_ICON: Record<Invoice["status"], any> = {
  OPEN: Clock,
  CLOSED: Lock,
  PAID: CheckCircle2,
  OVERDUE: AlertTriangle,
};

const STATUS_COLOR: Record<Invoice["status"], string> = {
  OPEN: "text-foreground",
  CLOSED: "text-warning",
  PAID: "text-success",
  OVERDUE: "text-destructive",
};

function monthName(month: number) {
  return new Date(2000, month - 1, 1).toLocaleDateString("pt-BR", { month: "long" });
}

function ownerLabel(owner: "PARTNER_A" | "PARTNER_B" | "COUPLE", settings: Settings | null) {
  if (owner === "PARTNER_A") return settings?.partnerAName ?? "Pessoa A";
  if (owner === "PARTNER_B") return settings?.partnerBName ?? "Pessoa B";
  return "Casal";
}

export function CartoesClient() {
  const [cards, setCards] = useState<Account[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [allAccounts, setAllAccounts] = useState<Account[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [paying, setPaying] = useState<Invoice | null>(null);
  const [importing, setImporting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingCard, setEditingCard] = useState<Account | null>(null);
  const [editingTx, setEditingTx] = useState<InvoiceTx | null>(null);
  const [bulkDateInvoice, setBulkDateInvoice] = useState<Invoice | null>(null);
  const [selectedTxIds, setSelectedTxIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  function toggleSelect(id: string) {
    setSelectedTxIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function selectAll(ids: string[]) {
    setSelectedTxIds((prev) => {
      const next = new Set(prev);
      const allSelected = ids.every((id) => next.has(id));
      if (allSelected) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  }
  async function bulkDeleteSelected() {
    const ids = Array.from(selectedTxIds);
    if (ids.length === 0) return;
    if (!confirm(`Excluir ${ids.length} compra${ids.length === 1 ? "" : "s"} selecionada${ids.length === 1 ? "" : "s"}?`)) return;
    const res = await fetch("/api/financas/transactions/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    if (res.ok) {
      setSelectedTxIds(new Set());
      load();
    }
  }

  async function load() {
    setLoading(true);
    const [accs, invs, st, cats] = await Promise.all([
      fetch("/api/financas/accounts").then((r) => r.json()),
      fetch("/api/financas/invoices").then((r) => r.json()),
      fetch("/api/financas/settings").then((r) => r.json()),
      fetch("/api/financas/categories").then((r) => r.json()),
    ]);
    const ccs = accs.filter((a: Account) => a.type === "CREDIT_CARD" && !a.archived);
    setCards(ccs);
    setAllAccounts(accs);
    setInvoices(invs);
    setSettings(st);
    setAllCategories(cats.filter((c: any) => !c.archived && c.kind === "EXPENSE"));
    setSelected((s) => s || ccs[0]?.id || "");
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const visible = selected ? invoices.filter((i) => i.accountId === selected) : [];
  const projectedCount = invoices.reduce(
    (s, inv) => s + inv.transactions.filter((t) => t.installmentProjected).length,
    0
  );

  async function cleanupProjected() {
    if (
      !confirm(
        `Excluir todas as ${projectedCount} parcelas projetadas?\n\nElas voltam a existir só quando você importar a fatura do mês delas.`
      )
    )
      return;
    const res = await fetch("/api/financas/transactions/cleanup-projected", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (res.ok) load();
  }

  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-3">
        <PageHeader
          title="Cartões de Crédito"
          description="Acompanhe faturas, marque como paga e veja as compras de cada mês."
        />
        <div className="flex items-center gap-2 flex-wrap">
          {projectedCount > 0 && (
            <button
              onClick={cleanupProjected}
              title="Apaga todas as parcelas projetadas que ainda não chegaram"
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-warning/40 text-warning hover:bg-warning/10 text-sm font-medium"
            >
              <Trash2 className="w-4 h-4" />
              Limpar {projectedCount} parcela{projectedCount === 1 ? "" : "s"} projetada{projectedCount === 1 ? "" : "s"}
            </button>
          )}
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted text-sm font-medium"
          >
            <CreditCard className="w-4 h-4" />
            Novo cartão
          </button>
          {cards.length > 0 && (
            <button
              onClick={() => setImporting(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 text-sm font-medium"
            >
              <Sparkles className="w-4 h-4" />
              Importar fatura com IA
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : cards.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <CreditCard className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground mb-3">Nenhum cartão cadastrado.</p>
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 text-sm font-medium"
          >
            <CreditCard className="w-4 h-4" />
            Cadastrar primeiro cartão
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-5">
            {cards.map((c) => (
              <div key={c.id} className="flex items-stretch">
                <button
                  onClick={() => setSelected(c.id)}
                  className={`px-3 py-2 rounded-l-lg border text-sm font-medium ${
                    selected === c.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                    {c.name}
                  </span>
                </button>
                <button
                  onClick={() => setEditingCard(c)}
                  title="Editar cartão"
                  className={`px-2 rounded-r-lg border-y border-r ${
                    selected === c.id
                      ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {visible.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-xl">
              <p className="text-sm text-muted-foreground">
                Nenhuma fatura ainda. Lance uma despesa neste cartão para gerar a primeira.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {visible.map((inv) => {
                const Icon = STATUS_ICON[inv.status];
                return (
                  <div key={inv.id} className="bg-card border border-border rounded-xl">
                    <div className="p-5 flex items-start justify-between flex-wrap gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold capitalize">
                            {new Date(inv.dueDate).toLocaleDateString("pt-BR", {
                              month: "long",
                              year: "numeric",
                            })}
                          </h3>
                          <span
                            className={`inline-flex items-center ${STATUS_COLOR[inv.status]}`}
                            title={STATUS_LABEL[inv.status]}
                            aria-label={STATUS_LABEL[inv.status]}
                          >
                            <Icon className="w-4 h-4" />
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground space-x-3">
                          <span>Fechamento: {new Date(inv.closingDate).toLocaleDateString("pt-BR")}</span>
                          <span>Vencimento: {new Date(inv.dueDate).toLocaleDateString("pt-BR")}</span>
                          {inv.paidAt && (
                            <span>
                              Paga em {new Date(inv.paidAt).toLocaleDateString("pt-BR")}
                              {inv.paymentAccount && ` via ${inv.paymentAccount.name}`}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="text-2xl font-bold tabular-nums">{formatCurrency(inv.total)}</p>
                        <div className="flex flex-col items-end gap-1 mt-2">
                          {inv.status !== "PAID" && inv.total > 0 && (
                            <button
                              onClick={() => setPaying(inv)}
                              className="text-sm px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90"
                            >
                              Marcar como paga
                            </button>
                          )}
                          {inv.transactions.length > 0 && (
                            <button
                              onClick={() => setBulkDateInvoice(inv)}
                              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground"
                              title="Aplicar uma única data a todos os lançamentos desta fatura"
                            >
                              <CalendarClock className="w-3.5 h-3.5" />
                              Definir data única
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    {inv.transactions.length > 0 && (() => {
                      const invTxIds = inv.transactions.map((t) => t.id);
                      const selectedHere = invTxIds.filter((id) => selectedTxIds.has(id));
                      const allSelected = invTxIds.length > 0 && selectedHere.length === invTxIds.length;
                      return (
                      <div className="border-t border-border">
                        {selectedHere.length > 0 && (
                          <div className="bg-destructive/5 border-b border-border px-4 py-2 flex items-center justify-between text-xs">
                            <span>
                              <strong>{selectedHere.length}</strong> de {invTxIds.length} selecionada{selectedHere.length === 1 ? "" : "s"}
                            </span>
                            <button
                              onClick={bulkDeleteSelected}
                              className="flex items-center gap-1 px-3 py-1 rounded text-destructive hover:bg-destructive/10 font-medium"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Excluir selecionadas
                            </button>
                          </div>
                        )}
                        <table className="w-full text-sm">
                          <thead className="bg-muted/30 text-muted-foreground text-left">
                            <tr>
                              <th className="px-2 py-2 font-medium w-8">
                                <input
                                  type="checkbox"
                                  checked={allSelected}
                                  onChange={() => selectAll(invTxIds)}
                                  className="cursor-pointer"
                                />
                              </th>
                              <th className="px-4 py-2 font-medium">Data</th>
                              <th className="px-4 py-2 font-medium">Descrição</th>
                              <th className="px-4 py-2 font-medium">Categoria</th>
                              <th className="px-4 py-2 font-medium">Dono</th>
                              <th className="px-4 py-2 font-medium text-right">Valor</th>
                              <th className="px-4 py-2 font-medium w-10"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {inv.transactions.map((t) => (
                              <tr
                                key={t.id}
                                className={`border-t border-border hover:bg-muted/30 cursor-pointer ${
                                  t.installmentProjected ? "text-muted-foreground italic" : ""
                                } ${selectedTxIds.has(t.id) ? "bg-primary/5" : ""}`}
                                onClick={() => setEditingTx(t)}
                                title={t.installmentProjected ? "Parcela projetada — vai ser confirmada quando você importar a fatura desse mês" : undefined}
                              >
                                <td className="px-2 py-2 w-8" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    checked={selectedTxIds.has(t.id)}
                                    onChange={() => toggleSelect(t.id)}
                                    className="cursor-pointer"
                                  />
                                </td>
                                <td className="px-4 py-2 text-muted-foreground">
                                  {new Date(t.date).toLocaleDateString("pt-BR")}
                                </td>
                                <td className="px-4 py-2">
                                  <span className="flex items-center gap-2">
                                    <span>{t.description}</span>
                                    {t.installmentIndex && t.installmentTotal && (
                                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                        t.installmentProjected
                                          ? "bg-muted text-muted-foreground border border-dashed border-border"
                                          : "bg-primary/10 text-primary"
                                      }`}>
                                        {t.installmentIndex}/{t.installmentTotal}
                                        {t.installmentProjected ? " · projetada" : ""}
                                      </span>
                                    )}
                                  </span>
                                </td>
                                <td className="px-4 py-2">
                                  {t.category ? (
                                    <span className="inline-flex items-center gap-1.5">
                                      <span
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: t.category.color }}
                                      />
                                      {t.category.name}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-muted-foreground italic">sem categoria</span>
                                  )}
                                </td>
                                <td className="px-4 py-2 text-muted-foreground">
                                  {ownerLabel(t.owner, settings)}
                                </td>
                                <td className="px-4 py-2 text-right tabular-nums">{formatCurrency(t.amount)}</td>
                                <td className="px-4 py-2 text-muted-foreground">
                                  <Pencil className="w-3.5 h-3.5" />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {creating && (
        <NewCardModal
          settings={settings}
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            load();
          }}
        />
      )}

      {editingCard && (
        <NewCardModal
          settings={settings}
          card={editingCard}
          onClose={() => setEditingCard(null)}
          onCreated={() => {
            setEditingCard(null);
            load();
          }}
        />
      )}

      {paying && (
        <PayInvoiceModal
          invoice={paying}
          accounts={allAccounts.filter((a) => a.type !== "CREDIT_CARD" && !a.archived)}
          onClose={() => setPaying(null)}
          onPaid={() => {
            setPaying(null);
            load();
          }}
        />
      )}

      {importing && cards.length > 0 && (
        <ImportInvoiceModal
          cards={cards}
          defaultCardId={selected || cards[0].id}
          settings={settings}
          onClose={() => setImporting(false)}
          onImported={() => {
            setImporting(false);
            load();
          }}
        />
      )}

      {editingTx && (
        <EditTransactionModal
          tx={editingTx}
          categories={allCategories}
          settings={settings}
          onClose={() => setEditingTx(null)}
          onSaved={() => {
            setEditingTx(null);
            load();
          }}
        />
      )}

      {bulkDateInvoice && (
        <BulkDateModal
          invoice={bulkDateInvoice}
          onClose={() => setBulkDateInvoice(null)}
          onSaved={() => {
            setBulkDateInvoice(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function BulkDateModal({
  invoice,
  onClose,
  onSaved,
}: {
  invoice: Invoice;
  onClose: () => void;
  onSaved: () => void;
}) {
  const defaultDate = invoice.dueDate
    ? new Date(invoice.dueDate).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(defaultDate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/financas/invoices/${invoice.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "setAllDates", date }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d?.error || "Erro");
      setSaving(false);
      return;
    }
    const data = await res.json().catch(() => ({}));
    alert(`${data.updated || 0} lançamento(s) atualizado(s) para ${new Date(date).toLocaleDateString("pt-BR")}.`);
    onSaved();
  }

  return (
    <Modal title="Definir data única" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Vai mudar a <strong>data</strong> de TODOS os{" "}
          <strong>{invoice.transactions.length} lançamento(s)</strong> desta fatura para a
          data que você escolher. Útil quando a fatura veio com datas de compra mas você
          quer que todos contem na mesma data (ex: vencimento real).
        </p>
        <div>
          <label className="block text-sm font-medium mb-1">Nova data</label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background"
          />
        </div>
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-2 rounded-lg">{error}</div>
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
            {saving ? "Aplicando..." : "Aplicar a todos"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function EditTransactionModal({
  tx,
  categories,
  settings,
  onClose,
  onSaved,
}: {
  tx: InvoiceTx;
  categories: Category[];
  settings: Settings | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [date, setDate] = useState(tx.date.slice(0, 10));
  const [description, setDescription] = useState(tx.description);
  const [amount, setAmount] = useState(String(tx.amount));
  const [categoryId, setCategoryId] = useState(tx.category?.id ?? "");
  const [owner, setOwner] = useState<"PARTNER_A" | "PARTNER_B" | "COUPLE">(tx.owner);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const partnerA = settings?.partnerAName || "Pessoa A";
  const partnerB = settings?.partnerBName || "Pessoa B";

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const numericAmount = parseFloat(amount.replace(",", "."));
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Valor inválido");
      setSaving(false);
      return;
    }
    const res = await fetch(`/api/financas/transactions/${tx.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        description,
        amount: numericAmount,
        categoryId: categoryId || null,
        owner,
      }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d?.error || "Erro ao salvar");
      setSaving(false);
      return;
    }
    onSaved();
  }

  async function remove() {
    if (!confirm("Excluir este lançamento?")) return;
    setDeleting(true);
    const res = await fetch(`/api/financas/transactions/${tx.id}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d?.error || "Erro ao excluir");
      setDeleting(false);
      return;
    }
    onSaved();
  }

  return (
    <Modal title="Editar lançamento" onClose={onClose}>
      <form onSubmit={save} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Data</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Valor</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
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
            className="w-full px-3 py-2 rounded-lg border border-border bg-background"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Categoria</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background"
          >
            <option value="">Sem categoria</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Quem usou</label>
          <div className="grid grid-cols-3 gap-2">
            {(["PARTNER_A", "PARTNER_B", "COUPLE"] as const).map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => setOwner(o)}
                className={`px-3 py-2 rounded-lg border text-sm ${
                  owner === o
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:bg-muted"
                }`}
              >
                {o === "PARTNER_A" ? partnerA : o === "PARTNER_B" ? partnerB : "Casal"}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-2 rounded-lg">{error}</div>
        )}

        <div className="flex justify-between items-center pt-2">
          <button
            type="button"
            onClick={remove}
            disabled={deleting || saving}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-destructive hover:bg-destructive/10 disabled:opacity-50 text-sm"
          >
            <Trash2 className="w-4 h-4" />
            {deleting ? "Excluindo..." : "Excluir"}
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || deleting}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

function PayInvoiceModal({
  invoice,
  accounts,
  onClose,
  onPaid,
}: {
  invoice: Invoice;
  accounts: Account[];
  onClose: () => void;
  onPaid: () => void;
}) {
  const [paymentAccountId, setPaymentAccountId] = useState(accounts[0]?.id || "");
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10));
  const [skipTransfer, setSkipTransfer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload: any = { action: "pay", paidAt };
    if (skipTransfer) {
      payload.skipTransfer = true;
    } else {
      payload.paymentAccountId = paymentAccountId;
    }
    const res = await fetch(`/api/financas/invoices/${invoice.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d?.error || "Erro");
      setSaving(false);
      return;
    }
    onPaid();
  }

  return (
    <Modal title="Pagar fatura" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {skipTransfer ? (
            <>
              A fatura será marcada como paga, <strong>sem</strong> registrar a saída do
              dinheiro. Use isso para faturas antigas que você já pagou na vida real.
            </>
          ) : (
            <>
              Será criada uma transferência de {formatCurrency(invoice.total)} da conta
              escolhida para o cartão, e a fatura será marcada como paga.
            </>
          )}
        </p>

        <label className="flex items-start gap-2 p-3 rounded-lg border border-border bg-muted/30 cursor-pointer hover:bg-muted/50">
          <input
            type="checkbox"
            checked={skipTransfer}
            onChange={(e) => setSkipTransfer(e.target.checked)}
            className="mt-0.5"
          />
          <div className="text-sm">
            <strong>Só marcar como paga, sem registrar saída</strong>
            <p className="text-xs text-muted-foreground mt-0.5">
              Útil pra faturas passadas (importadas com a IA, por exemplo) que você já pagou
              no mundo real e não quer criar uma transferência fake agora.
            </p>
          </div>
        </label>

        {!skipTransfer && (
          <div>
            <label className="block text-sm font-medium mb-1">Pagar com</label>
            <select
              required
              value={paymentAccountId}
              onChange={(e) => setPaymentAccountId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium mb-1">Data do pagamento</label>
          <input
            type="date"
            required
            value={paidAt}
            onChange={(e) => setPaidAt(e.target.value)}
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
            {saving ? "Salvando..." : skipTransfer ? "Marcar como paga" : "Confirmar pagamento"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

type ParsedRow = {
  date: string;
  description: string;
  amount: number;
  categoryId: string | null;
  owner: Owner;
  paidByOwner?: "PARTNER_A" | "PARTNER_B" | null;
  excluded?: boolean;
};

function ImportInvoiceModal({
  cards,
  defaultCardId,
  settings,
  onClose,
  onImported,
}: {
  cards: Account[];
  defaultCardId: string;
  settings: Settings | null;
  onClose: () => void;
  onImported: () => void;
}) {
  const [step, setStep] = useState<"paste" | "review">("paste");
  const [mode, setMode] = useState<"pdf" | "text">("pdf");
  const [accountId, setAccountId] = useState(defaultCardId);
  const [text, setText] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfPassword, setPdfPassword] = useState("");
  const [needsPassword, setNeedsPassword] = useState(false);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const today = new Date();
  const [invoiceMonth, setInvoiceMonth] = useState<string>(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`
  );
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const partnerA = settings?.partnerAName || "Pessoa A";
  const partnerB = settings?.partnerBName || "Pessoa B";

  async function analyze() {
    setBusy(true);
    setError(null);
    let res: Response;
    if (mode === "pdf") {
      if (!pdfFile) {
        setBusy(false);
        setError("Selecione um arquivo PDF");
        return;
      }
      const fd = new FormData();
      fd.append("accountId", accountId);
      fd.append("file", pdfFile);
      if (pdfPassword) fd.append("password", pdfPassword);
      res = await fetch("/api/financas/import/parse-pdf", { method: "POST", body: fd });
    } else {
      res = await fetch("/api/financas/import/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId, text }),
      });
    }
    const rawText = await res.text();
    let data: any = {};
    try {
      data = JSON.parse(rawText);
    } catch {
      // resposta não-JSON (timeout, HTML de erro do Vercel, etc.)
    }
    setBusy(false);
    if (!res.ok) {
      if (data?.code === "needs_password") {
        setNeedsPassword(true);
      }
      const fallback =
        res.status === 504 || res.status === 408
          ? "A análise demorou demais e foi interrompida. Tente um PDF menor ou o modo 'Colar texto'."
          : `Erro ao analisar (HTTP ${res.status}). ${rawText.slice(0, 200)}`;
      setError(data?.error || fallback);
      return;
    }
    if (!data.transactions || data.transactions.length === 0) {
      setError("Nenhuma compra identificada. Verifique se o PDF é a fatura completa.");
      return;
    }
    setCategories(data.categories || []);
    setRows(
      data.transactions.map((t: any) => ({
        date: t.date,
        description: t.description,
        amount: t.amount,
        categoryId: t.categoryId ?? null,
        owner: (t.owner as Owner) || "COUPLE",
        paidByOwner: null,
        excluded: false,
      }))
    );
    setStep("review");
  }

  async function commit() {
    setBusy(true);
    setError(null);
    const toSend = rows
      .filter((r) => !r.excluded)
      .map((r) => ({
        date: r.date,
        description: r.description,
        amount: r.amount,
        categoryId: r.categoryId,
        owner: r.owner,
        paidByOwner: r.paidByOwner ?? null,
      }));
    if (toSend.length === 0) {
      setError("Nenhuma linha selecionada para importar");
      setBusy(false);
      return;
    }
    let invoiceYear: number | undefined;
    let invoiceMonthNum: number | undefined;
    const m = invoiceMonth.match(/^(\d{4})-(\d{2})$/);
    if (m) {
      invoiceYear = parseInt(m[1], 10);
      invoiceMonthNum = parseInt(m[2], 10) - 1;
    }
    const res = await fetch("/api/financas/import/commit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId, rows: toSend, invoiceYear, invoiceMonth: invoiceMonthNum }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data?.error || "Erro ao salvar");
      return;
    }
    onImported();
  }

  function updateRow(i: number, patch: Partial<ParsedRow>) {
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  const visibleRowsWithIdx = rows
    .map((row, i) => ({ row, i }))
    .filter(({ row }) => {
      if (filterFrom && row.date < filterFrom) return false;
      if (filterTo && row.date > filterTo) return false;
      return true;
    });
  const visibleRows = visibleRowsWithIdx.map((x) => x.row);

  function bulkSetExcluded(excluded: boolean) {
    const visibleIdx = new Set(visibleRowsWithIdx.map((x) => x.i));
    setRows((rs) => rs.map((r, i) => (visibleIdx.has(i) ? { ...r, excluded } : r)));
  }

  const total = rows.filter((r) => !r.excluded).reduce((s, r) => s + r.amount, 0);
  const includedCount = rows.filter((r) => !r.excluded).length;

  return (
    <Modal title="Importar fatura com IA" onClose={onClose} maxWidth="max-w-5xl">
      {step === "paste" ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Cartão</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background"
            >
              {cards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode("pdf")}
              className={`px-3 py-2 rounded-lg border text-sm font-medium ${
                mode === "pdf"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border hover:bg-muted"
              }`}
            >
              📄 Enviar PDF
            </button>
            <button
              type="button"
              onClick={() => setMode("text")}
              className={`px-3 py-2 rounded-lg border text-sm font-medium ${
                mode === "text"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border hover:bg-muted"
              }`}
            >
              ✍️ Colar texto
            </button>
          </div>

          {mode === "pdf" ? (
            <div>
              <label className="block text-sm font-medium mb-1">PDF da fatura</label>
              <p className="text-xs text-muted-foreground mb-2">
                Baixe a fatura em PDF pelo app/internet banking e envie aqui. A IA vai ler
                o documento e identificar cada compra. Limite: 4MB.
              </p>
              <label
                className={`flex flex-col items-center justify-center gap-2 px-4 py-8 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
                  pdfFile ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
                }`}
              >
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
                />
                {pdfFile ? (
                  <>
                    <span className="text-2xl">📄</span>
                    <span className="text-sm font-medium">{pdfFile.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {(pdfFile.size / 1024 / 1024).toFixed(2)} MB · clique para trocar
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl">📄</span>
                    <span className="text-sm font-medium">Clique para escolher o PDF</span>
                    <span className="text-xs text-muted-foreground">
                      ou arraste o arquivo aqui
                    </span>
                  </>
                )}
              </label>

              <div className="mt-3">
                <label className="block text-sm font-medium mb-1">
                  Senha do PDF{" "}
                  <span className="text-muted-foreground font-normal">
                    (deixe em branco se não tiver)
                  </span>
                </label>
                <input
                  type="password"
                  value={pdfPassword}
                  onChange={(e) => {
                    setPdfPassword(e.target.value);
                    setNeedsPassword(false);
                  }}
                  placeholder="Senha do arquivo"
                  autoComplete="off"
                  className={`w-full px-3 py-2 rounded-lg border bg-background ${
                    needsPassword ? "border-destructive" : "border-border"
                  }`}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  💡 Geralmente é seu CPF (sem pontos) ou os 4 últimos dígitos do cartão.
                  Confira no e-mail/app do banco.
                </p>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium mb-1">
                Cole aqui o texto da fatura
              </label>
              <p className="text-xs text-muted-foreground mb-2">
                Abra o app do banco, copie a lista de compras (Ctrl+A, Ctrl+C dentro do
                PDF/extrato funciona) e cole abaixo.
              </p>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Ex:&#10;15/04  CARREFOUR        152,30&#10;16/04  IFOOD            48,90&#10;..."
                rows={12}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground mt-1">{text.length} caracteres</p>
            </div>
          )}

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-2 rounded-lg">{error}</div>
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
              type="button"
              onClick={analyze}
              disabled={
                busy ||
                (mode === "pdf" ? !pdfFile : text.trim().length < 20)
              }
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {busy ? "Analisando..." : "Analisar com IA"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 text-sm">
            <strong>⚠️ Quase lá!</strong> A IA já analisou — agora <strong>revise as linhas
            abaixo</strong> (mude categorias, marque quem usou, exclua linhas erradas) e clique
            em <strong>"Confirmar e criar X lançamentos"</strong> no fim da página para
            <strong> salvar</strong>. Se fechar agora, nada é salvo.
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-xs font-medium mb-1">Mês desta fatura</label>
              <input
                type="month"
                value={invoiceMonth}
                onChange={(e) => setInvoiceMonth(e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Tudo cai no vencimento desse mês, independente da data da compra.
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Filtro: data de</label>
              <input
                type="date"
                value={filterFrom}
                onChange={(e) => setFilterFrom(e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Filtro: data até</label>
              <input
                type="date"
                value={filterTo}
                onChange={(e) => setFilterTo(e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm">
              <strong>{includedCount}</strong> de <strong>{rows.length}</strong> compras
              selecionadas — total{" "}
              <strong className="tabular-nums">{formatCurrency(total)}</strong>
              {(filterFrom || filterTo) && (
                <span className="text-xs text-muted-foreground ml-2">
                  ({visibleRows.length} visíveis com o filtro)
                </span>
              )}
            </p>
            <div className="flex items-center gap-2">
              {(filterFrom || filterTo) && (
                <>
                  <button
                    type="button"
                    onClick={() => bulkSetExcluded(true)}
                    className="text-xs px-2 py-1 rounded border border-border hover:bg-destructive/10 hover:text-destructive"
                  >
                    Excluir todas visíveis
                  </button>
                  <button
                    type="button"
                    onClick={() => bulkSetExcluded(false)}
                    className="text-xs px-2 py-1 rounded border border-border hover:bg-muted"
                  >
                    Incluir todas visíveis
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setStep("paste")}
                className="text-xs text-muted-foreground hover:underline"
              >
                ← Voltar e colar de novo
              </button>
            </div>
          </div>
          <div className="border border-border rounded-lg overflow-x-auto max-h-[55vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-muted-foreground text-left sticky top-0 z-10">
                <tr>
                  <th className="px-2 py-2 font-medium w-10"></th>
                  <th className="px-2 py-2 font-medium">Data</th>
                  <th className="px-2 py-2 font-medium">Descrição</th>
                  <th className="px-2 py-2 font-medium text-right">Valor</th>
                  <th className="px-2 py-2 font-medium">Categoria</th>
                  <th className="px-2 py-2 font-medium">Quem usou</th>
                </tr>
              </thead>
              <tbody>
                {visibleRowsWithIdx.map(({ row: r, i }) => (
                  <tr
                    key={i}
                    className={`border-t border-border ${
                      r.excluded ? "opacity-40 line-through" : ""
                    }`}
                  >
                    <td className="px-2 py-1.5">
                      <button
                        onClick={() => updateRow(i, { excluded: !r.excluded })}
                        className="text-muted-foreground hover:text-destructive"
                        title={r.excluded ? "Restaurar" : "Excluir esta linha"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="date"
                        value={r.date}
                        onChange={(e) => updateRow(i, { date: e.target.value })}
                        className="px-1 py-0.5 rounded border border-border bg-background text-xs"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="text"
                        value={r.description}
                        onChange={(e) => updateRow(i, { description: e.target.value })}
                        className="w-full px-1 py-0.5 rounded border border-border bg-background"
                      />
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <input
                        type="number"
                        step="0.01"
                        value={r.amount}
                        onChange={(e) =>
                          updateRow(i, { amount: parseFloat(e.target.value) || 0 })
                        }
                        className="w-24 px-1 py-0.5 rounded border border-border bg-background text-right tabular-nums"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <select
                        value={r.categoryId ?? ""}
                        onChange={(e) =>
                          updateRow(i, { categoryId: e.target.value || null })
                        }
                        className="w-full px-1 py-0.5 rounded border border-border bg-background"
                      >
                        <option value="">— sem categoria —</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <select
                        value={r.owner}
                        onChange={(e) => updateRow(i, { owner: e.target.value as Owner })}
                        className="px-1 py-0.5 rounded border border-border bg-background"
                      >
                        <option value="COUPLE">Casal</option>
                        <option value="PARTNER_A">{partnerA}</option>
                        <option value="PARTNER_B">{partnerB}</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-2 rounded-lg">{error}</div>
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
              type="button"
              onClick={commit}
              disabled={busy || includedCount === 0}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "Salvando..." : `Confirmar e criar ${includedCount} lançamentos`}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}


function NewCardModal({
  settings,
  card,
  onClose,
  onCreated,
}: {
  settings: Settings | null;
  card?: Account | null;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState(card?.name ?? "");
  const [color, setColor] = useState(card?.color ?? "#6366f1");
  const [creditLimit, setCreditLimit] = useState(card?.creditLimit?.toString() ?? "");
  const [closingDay, setClosingDay] = useState(card?.closingDay?.toString() ?? "");
  const [dueDay, setDueDay] = useState(card?.dueDay?.toString() ?? "");
  const [initialBalance, setInitialBalance] = useState(card?.initialBalance?.toString() ?? "0");
  const [owner, setOwner] = useState<"PARTNER_A" | "PARTNER_B" | "COUPLE">(card?.owner ?? "COUPLE");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    if (!name.trim()) {
      setError("Nome obrigatório");
      setSaving(false);
      return;
    }
    if (!closingDay || !dueDay) {
      setError("Dia de fechamento e vencimento são obrigatórios");
      setSaving(false);
      return;
    }
    const url = card ? `/api/financas/accounts/${card.id}` : "/api/financas/accounts";
    const res = await fetch(url, {
      method: card ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        type: "CREDIT_CARD",
        color,
        initialBalance: parseFloat(initialBalance.replace(",", ".")) || 0,
        creditLimit: creditLimit ? parseFloat(creditLimit.replace(",", ".")) : null,
        closingDay: parseInt(closingDay, 10),
        dueDay: parseInt(dueDay, 10),
        owner,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Erro ao salvar");
      return;
    }
    onCreated();
  }

  async function archiveCard() {
    if (!card) return;
    if (!confirm("Arquivar este cartão? Ele some das listas mas os lançamentos antigos continuam.")) return;
    const res = await fetch(`/api/financas/accounts/${card.id}`, { method: "DELETE" });
    if (res.ok) onCreated();
  }

  return (
    <Modal title={card ? "Editar cartão" : "Novo cartão de crédito"} onClose={onClose} maxWidth="max-w-md">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nome do cartão</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Itaú Platinum"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Dono do cartão</label>
          <div className="grid grid-cols-3 gap-2">
            {(["PARTNER_A", "PARTNER_B", "COUPLE"] as const).map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => setOwner(o)}
                className={`px-3 py-2 rounded-lg border text-sm ${
                  owner === o
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:bg-muted"
                }`}
              >
                {o === "PARTNER_A"
                  ? settings?.partnerAName ?? "Você"
                  : o === "PARTNER_B"
                  ? settings?.partnerBName ?? "Parceiro"
                  : "Casal"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Cor</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-9 w-12 rounded border border-border cursor-pointer"
            />
            <span className="text-xs text-muted-foreground">{color}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Dia de fechamento</label>
            <input
              required
              type="number"
              min={1}
              max={31}
              value={closingDay}
              onChange={(e) => setClosingDay(e.target.value)}
              placeholder="Ex: 20"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background"
            />
            <p className="text-[10px] text-muted-foreground mt-1">Quando a fatura fecha</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Dia de vencimento</label>
            <input
              required
              type="number"
              min={1}
              max={31}
              value={dueDay}
              onChange={(e) => setDueDay(e.target.value)}
              placeholder="Ex: 9"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background"
            />
            <p className="text-[10px] text-muted-foreground mt-1">Quando você paga</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Limite do cartão <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <input
            inputMode="decimal"
            value={creditLimit}
            onChange={(e) => setCreditLimit(e.target.value)}
            placeholder="Ex: 5000"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Saldo da fatura em aberto <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <input
            inputMode="decimal"
            value={initialBalance}
            onChange={(e) => setInitialBalance(e.target.value)}
            placeholder="0,00"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background"
          />
          <p className="text-[10px] text-muted-foreground mt-1">
            Se o cartão já tem gasto antes de você cadastrar
          </p>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-between items-center gap-2 pt-2">
          <div>
            {card && (
              <button
                type="button"
                onClick={archiveCard}
                className="px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10"
              >
                Arquivar
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border hover:bg-muted text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 text-sm font-medium"
            >
              {saving ? "Salvando..." : card ? "Salvar" : "Cadastrar"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

