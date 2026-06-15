"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Briefcase,
  Megaphone,
  Globe,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Copy,
} from "lucide-react";

type Service = {
  id: string;
  name: string;
  description: string | null;
  color: string;
  basePrice: number | null;
  engagementType: string | null;
  defaultDurationMonths: number;
  templateCount: number;
};

type Lead = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  status: string;
};

const TYPE_ICON: Record<string, any> = {
  STRATEGY: Briefcase,
  PAID_TRAFFIC: Megaphone,
  LANDING_PAGE: Globe,
  GMB: MapPin,
};

const TYPE_LABEL: Record<string, string> = {
  STRATEGY: "Estratégia",
  PAID_TRAFFIC: "Tráfego Pago",
  LANDING_PAGE: "Landing page",
  GMB: "Google Meu Negócio",
};

export function NewClientWizard({
  services,
  leads,
}: {
  services: Service[];
  leads: Lead[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [leadId, setLeadId] = useState<string | null>(null);

  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  const [monthlyValue, setMonthlyValue] = useState<string>("");
  const [durationMonths, setDurationMonths] = useState<string>("12");
  const [paymentDay, setPaymentDay] = useState<string>("5");
  const [paymentMethod, setPaymentMethod] = useState<string>("Pix");
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [generateInvoices, setGenerateInvoices] = useState(true);

  // Quando seleciona lead, autopreenche nome/email/phone
  function handleSelectLead(id: string | null) {
    setLeadId(id);
    if (id) {
      const l = leads.find((x) => x.id === id);
      if (l) {
        setName(l.name);
        setEmail(l.email || "");
        setPhone(l.phone);
      }
    }
  }

  // Quando seleciona serviços, sugere duração media e valor base
  function handleToggleService(id: string) {
    setSelectedServiceIds((prev) => {
      const newList = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      // Recalcula valor sugerido
      const total = newList.reduce((sum, sid) => {
        const s = services.find((x) => x.id === sid);
        return sum + (s?.basePrice || 0);
      }, 0);
      if (total > 0) setMonthlyValue(total.toFixed(2));
      // Pega a duração maior entre os serviços
      const maxDur = Math.max(
        ...newList.map((sid) => services.find((x) => x.id === sid)?.defaultDurationMonths || 12),
        12,
      );
      setDurationMonths(String(maxDur));
      return newList;
    });
  }

  // Calcula data fim do contrato
  const endDate = (() => {
    const start = new Date(startDate);
    start.setMonth(start.getMonth() + parseInt(durationMonths || "12"));
    return start.toISOString().slice(0, 10);
  })();

  const totalEntregaveis = selectedServiceIds.reduce((sum, sid) => {
    return sum + (services.find((x) => x.id === sid)?.templateCount || 0);
  }, 0);

  const totalValue = parseFloat(monthlyValue || "0") * parseInt(durationMonths || "0");

  function canGoToStep2() {
    return name.trim().length > 0 && email.trim().length > 0;
  }
  function canGoToStep3() {
    return selectedServiceIds.length > 0;
  }
  function canGoToStep4() {
    return (
      parseFloat(monthlyValue || "0") > 0 &&
      parseInt(durationMonths || "0") > 0 &&
      parseInt(paymentDay || "0") > 0 &&
      parseInt(paymentDay || "0") <= 31
    );
  }

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/clientes/wizard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone: phone || null,
          leadId,
          serviceIds: selectedServiceIds,
          monthlyValue: parseFloat(monthlyValue),
          durationMonths: parseInt(durationMonths),
          paymentDay: parseInt(paymentDay),
          paymentMethod,
          startDate,
          generateInvoices,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao criar cliente");
        setLoading(false);
        return;
      }
      setResult(data);
      setStep(5); // tela de sucesso
    } catch (e: any) {
      setError(e.message || "Erro de rede");
    } finally {
      setLoading(false);
    }
  }

  // Sucesso (passo 5)
  if (step === 5 && result) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-emerald-900">Cliente criado!</h1>
          <p className="text-sm text-emerald-700 mt-2">
            <strong>{name}</strong> foi cadastrado em todos os lugares de uma vez.
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
          <h2 className="font-semibold">Senha provisória do cliente</h2>
          <p className="text-xs text-muted-foreground">
            Envie pro cliente. Ele pode trocar no primeiro login.
          </p>
          <div className="flex items-center gap-2 bg-muted/40 p-3 rounded-lg">
            <code className="font-mono text-lg flex-1">{result.tempPassword}</code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(result.tempPassword);
                alert("Senha copiada!");
              }}
              className="p-2 hover:bg-muted rounded-lg"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <div className="text-xs text-muted-foreground">
            E-mail de login: <strong className="text-foreground">{email}</strong>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 space-y-2">
          <h2 className="font-semibold mb-2">Resumo do que foi criado</h2>
          <p className="text-sm">
            ✓ Cliente <strong>{name}</strong> no portal
          </p>
          <p className="text-sm">
            ✓ {result.engagementIds.length} {result.engagementIds.length === 1 ? "frente" : "frentes"}
          </p>
          <p className="text-sm">✓ 1 contrato no financeiro</p>
          {result.invoiceCount > 0 && (
            <p className="text-sm">
              ✓ {result.invoiceCount} faturas agendadas
            </p>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <Link
            href="/clientes/portal"
            className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted"
          >
            Ver no Portal
          </Link>
          <Link
            href="/clientes/novo"
            className="px-4 py-2 text-sm bg-[var(--accent)] text-white rounded-lg hover:opacity-90"
          >
            Cadastrar outro cliente
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href="/clientes/portal"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" /> Cancelar
      </Link>

      {/* Progress */}
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className={
              "flex-1 h-1.5 rounded-full transition " +
              (n <= step ? "bg-[var(--accent)]" : "bg-muted")
            }
          />
        ))}
      </div>
      <div className="text-xs text-muted-foreground">
        Passo {step} de 4
      </div>

      {/* Step 1 — Identidade */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <h1 className="text-2xl font-bold">Quem é o cliente?</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Dados básicos pra cadastrar no portal, CRM e financeiro de uma vez.
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Nome *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Brescancin Transplante Capilar"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">E-mail *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ingrid@brescancin.com.br"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">Usado pra login do cliente no portal</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">WhatsApp</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(19) 9XXXX-XXXX"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          {leads.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-medium mb-3">Veio de um lead do CRM?</h3>
              <div className="space-y-2 max-h-64 overflow-auto">
                <button
                  onClick={() => handleSelectLead(null)}
                  className={
                    "w-full text-left p-3 rounded-lg border transition " +
                    (!leadId
                      ? "border-[var(--accent)] bg-[var(--accent)]/5"
                      : "border-border hover:border-[var(--accent)]/40")
                  }
                >
                  <p className="text-sm font-medium">Não, cliente novo</p>
                  <p className="text-xs text-muted-foreground">Não vincular a nenhum lead</p>
                </button>
                {leads.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => handleSelectLead(l.id)}
                    className={
                      "w-full text-left p-3 rounded-lg border transition " +
                      (leadId === l.id
                        ? "border-[var(--accent)] bg-[var(--accent)]/5"
                        : "border-border hover:border-[var(--accent)]/40")
                    }
                  >
                    <p className="text-sm font-medium">{l.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {l.email || l.phone} · {l.status}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={() => setStep(2)}
              disabled={!canGoToStep2()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              Próximo: serviços <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2 — Serviços */}
      {step === 2 && (
        <div className="space-y-5">
          <div>
            <h1 className="text-2xl font-bold">Quais serviços a Arthea vai entregar?</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Cada serviço vira uma frente com os entregáveis pré-cadastrados em{" "}
              <Link href="/sistema/servicos" className="text-[var(--accent)] hover:underline">
                /sistema/servicos
              </Link>
              .
            </p>
          </div>

          <div className="space-y-3">
            {services.map((s) => {
              const Icon = TYPE_ICON[s.engagementType || ""] || Briefcase;
              const selected = selectedServiceIds.includes(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => handleToggleService(s.id)}
                  className={
                    "w-full text-left p-5 rounded-2xl border transition flex items-start gap-4 " +
                    (selected
                      ? "border-[var(--accent)] bg-[var(--accent)]/5"
                      : "border-border bg-card hover:border-[var(--accent)]/40")
                  }
                >
                  <div
                    className={
                      "w-5 h-5 rounded border flex-shrink-0 mt-0.5 flex items-center justify-center " +
                      (selected
                        ? "bg-[var(--accent)] border-[var(--accent)]"
                        : "border-border bg-background")
                    }
                  >
                    {selected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: s.color + "1A", color: s.color }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-3 flex-wrap">
                      <h3 className="font-semibold">{s.name}</h3>
                      {s.basePrice && (
                        <span className="text-sm text-muted-foreground">
                          R$ {s.basePrice.toFixed(2)}/mês sugerido
                        </span>
                      )}
                    </div>
                    {s.description && (
                      <p className="text-sm text-muted-foreground mt-1">{s.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      ↳ Cria 1 frente "{TYPE_LABEL[s.engagementType || "STRATEGY"]}" com{" "}
                      <strong>{s.templateCount}</strong> entregáveis pré-cadastrados
                      {s.templateCount === 0 && " (nenhum cadastrado ainda — configure em /sistema/servicos)"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="px-5 py-2.5 text-sm text-muted-foreground hover:text-foreground"
            >
              ← Voltar
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!canGoToStep3()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              Próximo: contrato <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Contrato */}
      {step === 3 && (
        <div className="space-y-5">
          <div>
            <h1 className="text-2xl font-bold">Contrato e pagamento</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Sugestões pré-preenchidas pelos serviços selecionados — pode ajustar.
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Valor mensal (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={monthlyValue}
                  onChange={(e) => setMonthlyValue(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Duração (meses) *</label>
                <input
                  type="number"
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Início *</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Fim (calculado)</label>
                <input
                  type="date"
                  value={endDate}
                  disabled
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-muted/40 text-muted-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Dia de vencimento *</label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={paymentDay}
                  onChange={(e) => setPaymentDay(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">de cada mês</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Forma de pagamento</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                >
                  <option value="Pix">Pix</option>
                  <option value="Boleto">Boleto</option>
                  <option value="Cartão">Cartão</option>
                  <option value="Transferência">Transferência</option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={generateInvoices}
                onChange={(e) => setGenerateInvoices(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">
                Gerar {durationMonths || "0"} faturas mensais automaticamente
              </span>
            </label>

            <div className="bg-muted/40 rounded-xl p-3 text-sm">
              <strong>Total do contrato:</strong> R$ {totalValue.toFixed(2)} ({durationMonths} meses × R${" "}
              {parseFloat(monthlyValue || "0").toFixed(2)})
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(2)}
              className="px-5 py-2.5 text-sm text-muted-foreground hover:text-foreground"
            >
              ← Voltar
            </button>
            <button
              onClick={() => setStep(4)}
              disabled={!canGoToStep4()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              Próximo: confirmar <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 4 — Confirmar */}
      {step === 4 && (
        <div className="space-y-5">
          <div>
            <h1 className="text-2xl font-bold">Pronto pra criar?</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Revisa o que vai ser criado no banco. Tudo numa transação só — se algo falhar, nada
              fica meio criado.
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <ResumoSection title="Cliente no portal">
              <li>
                <strong>{name}</strong>
              </li>
              <li>Login: {email}</li>
              <li>Senha provisória gerada (mostrada na próxima tela)</li>
              {leadId && <li className="text-emerald-700">↔ vinculado ao lead do CRM</li>}
            </ResumoSection>

            <ResumoSection title={`${selectedServiceIds.length} frente${selectedServiceIds.length > 1 ? "s" : ""}`}>
              {selectedServiceIds.map((sid) => {
                const s = services.find((x) => x.id === sid);
                if (!s) return null;
                return (
                  <li key={sid}>
                    <strong>{s.name}</strong> — {s.templateCount} entregáveis pré-criados em fase 1
                  </li>
                );
              })}
              <li className="text-emerald-700 font-medium mt-2">
                Total: {totalEntregaveis} entregáveis nascendo automaticamente
              </li>
            </ResumoSection>

            <ResumoSection title="Contrato no financeiro">
              <li>R$ {parseFloat(monthlyValue || "0").toFixed(2)} / mês</li>
              <li>{durationMonths} meses · Início {startDate} · Fim {endDate}</li>
              <li>
                Vencimento dia {paymentDay} · {paymentMethod}
              </li>
              <li className="font-semibold">Total: R$ {totalValue.toFixed(2)}</li>
            </ResumoSection>

            {generateInvoices && (
              <ResumoSection title={`${durationMonths} faturas`}>
                <li>Uma fatura por mês, vencimento dia {paymentDay}</li>
                <li>Status inicial: PENDING</li>
              </ResumoSection>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <div className="flex justify-between">
            <button
              onClick={() => setStep(3)}
              disabled={loading}
              className="px-5 py-2.5 text-sm text-muted-foreground hover:text-foreground"
            >
              ← Voltar
            </button>
            <button
              onClick={submit}
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Criando..." : "Criar tudo"} <Check className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ResumoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-l-2 border-[var(--accent)] pl-4 py-1">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
        {title}
      </p>
      <ul className="text-sm space-y-0.5 list-none">{children}</ul>
    </div>
  );
}
