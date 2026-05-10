"use client";

import { useEffect, useState } from "react";
import { CreditCard, CheckCircle2, Clock, AlertTriangle, Lock, Sparkles, Trash2, Pencil } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/financas/page-header";
import { formatCurrency } from "@/lib/utils";

type Account = { id: string; name: string; color: string; type: string; archived: boolean };

type Settings = { partnerAName: string; partnerBName: string };

type Category = { id: string; name: string };

type Owner = "PARTNER_A" | "PARTNER_B" | "COUPLE";

type InvoiceTx = {
  id: string;
  amount: number;
  description: string;
  date: string;
  owner: "PARTNER_A" | "PARTNER_B" | "COUPLE";
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
  OPEN: "text-muted-foreground",
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
  const [editingTx, setEditingTx] = useState<InvoiceTx | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-3">
        <PageHeader
          title="Cartões de crédito"
          description="Acompanhe faturas, marque como paga e veja as compras de cada mês."
        />
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

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : cards.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <CreditCard className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground mb-2">Nenhum cartão cadastrado.</p>
          <p className="text-xs text-muted-foreground">
            Vá em <strong>Contas</strong>, crie uma nova com tipo "Cartão de crédito" e informe os dias de
            fechamento e vencimento.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-5">
            {cards.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
                className={`px-3 py-2 rounded-lg border text-sm font-medium ${
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
                            {monthName(inv.month)} / {inv.year}
                          </h3>
                          <span className={`flex items-center gap-1 text-xs ${STATUS_COLOR[inv.status]}`}>
                            <Icon className="w-3.5 h-3.5" />
                            {STATUS_LABEL[inv.status]}
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
                        {inv.status !== "PAID" && inv.total > 0 && (
                          <button
                            onClick={() => setPaying(inv)}
                            className="mt-2 text-sm px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90"
                          >
                            Marcar como paga
                          </button>
                        )}
                      </div>
                    </div>
                    {inv.transactions.length > 0 && (
                      <div className="border-t border-border">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/30 text-muted-foreground text-left">
                            <tr>
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
                                className="border-t border-border hover:bg-muted/30 cursor-pointer"
                                onClick={() => setEditingTx(t)}
                              >
                                <td className="px-4 py-2 text-muted-foreground">
                                  {new Date(t.date).toLocaleDateString("pt-BR")}
                                </td>
                                <td className="px-4 py-2">{t.description}</td>
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
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
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
    </div>
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
    const res = await fetch("/api/financas/import/commit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId, rows: toSend }),
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
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm">
              <strong>{includedCount}</strong> de <strong>{rows.length}</strong> compras
              selecionadas — total{" "}
              <strong className="tabular-nums">{formatCurrency(total)}</strong>
            </p>
            <button
              type="button"
              onClick={() => setStep("paste")}
              className="text-xs text-muted-foreground hover:underline"
            >
              ← Voltar e colar de novo
            </button>
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
                {rows.map((r, i) => (
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
