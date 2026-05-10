"use client";

import { useEffect, useState } from "react";
import { CreditCard, CheckCircle2, Clock, AlertTriangle, Lock } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/financas/page-header";
import { formatCurrency } from "@/lib/utils";

type Account = { id: string; name: string; color: string; type: string; archived: boolean };

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
  transactions: { id: string; amount: number; description: string; date: string }[];
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

export function CartoesClient() {
  const [cards, setCards] = useState<Account[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [allAccounts, setAllAccounts] = useState<Account[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [paying, setPaying] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [accs, invs] = await Promise.all([
      fetch("/api/financas/accounts").then((r) => r.json()),
      fetch("/api/financas/invoices").then((r) => r.json()),
    ]);
    const ccs = accs.filter((a: Account) => a.type === "CREDIT_CARD" && !a.archived);
    setCards(ccs);
    setAllAccounts(accs);
    setInvoices(invs);
    setSelected((s) => s || ccs[0]?.id || "");
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const visible = selected ? invoices.filter((i) => i.accountId === selected) : [];

  return (
    <div>
      <PageHeader
        title="Cartões de crédito"
        description="Acompanhe faturas, marque como paga e veja as compras de cada mês."
      />

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
                              <th className="px-4 py-2 font-medium text-right">Valor</th>
                            </tr>
                          </thead>
                          <tbody>
                            {inv.transactions.map((t) => (
                              <tr key={t.id} className="border-t border-border">
                                <td className="px-4 py-2 text-muted-foreground">
                                  {new Date(t.date).toLocaleDateString("pt-BR")}
                                </td>
                                <td className="px-4 py-2">{t.description}</td>
                                <td className="px-4 py-2 text-right tabular-nums">{formatCurrency(t.amount)}</td>
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
    </div>
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
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/financas/invoices/${invoice.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "pay", paymentAccountId, paidAt }),
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
          Será criada uma transferência de {formatCurrency(invoice.total)} da conta escolhida para o
          cartão, e a fatura será marcada como paga.
        </p>
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
            {saving ? "Salvando..." : "Confirmar pagamento"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
