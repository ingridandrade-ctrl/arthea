import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Megaphone,
  Globe,
  MapPin,
  Mail,
  Phone,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Settings,
  Wallet,
  Link2,
} from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ContaAccessCard } from "./_components/conta-access-card";

// Página do cliente — TUDO daquele cliente num lugar.
// Substitui a confusão de "qual frente abrir pra ver dossiê / contratos / etc".

const TAB_ITEMS = [
  { id: "frentes", label: "Projetos", icon: Briefcase },
  { id: "sobre", label: "Sobre", icon: FileText },
  { id: "contratos", label: "Contratos", icon: Wallet },
  { id: "conta", label: "Conta", icon: Settings },
];

const PHASE_LABEL = ["", "Imersão", "Construção", "Rastreamento", "Entrega"];

const TYPE_LABEL: Record<string, string> = {
  STRATEGY: "Estratégia",
  PAID_TRAFFIC: "Tráfego Pago",
  LANDING_PAGE: "Landing page",
  GMB: "Google Meu Negócio",
};

const TYPE_ICON: Record<string, any> = {
  STRATEGY: Briefcase,
  PAID_TRAFFIC: Megaphone,
  LANDING_PAGE: Globe,
  GMB: MapPin,
};

export default async function ClienteDetailPage({
  params,
  searchParams,
}: {
  params: { clientId: string };
  searchParams: { tab?: string };
}) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) redirect("/login");
  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "MANAGER") redirect("/inicio");

  const cliente = await prisma.user.findUnique({
    where: { id: params.clientId },
    include: {
      engagements: {
        include: {
          deliverables: { select: { status: true, updatedAt: true } },
          metaAdAccounts: {
            select: {
              id: true,
              name: true,
              accountId: true,
              connection: { select: { status: true } },
            },
          },
          googleAdsAccounts: {
            select: {
              id: true,
              name: true,
              customerId: true,
              connection: { select: { status: true } },
            },
          },
        },
        orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
      },
      dossier: true,
      contracts: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!cliente || cliente.role !== "CLIENT") notFound();

  const c: any = cliente;
  const activeTab = searchParams.tab && TAB_ITEMS.some((t) => t.id === searchParams.tab) ? searchParams.tab : "frentes";
  const engagements: any[] = c.engagements;
  const allDeliverables = engagements.flatMap((e: any) => e.deliverables as any[]);
  const totalDeliverables = allDeliverables.length;
  const approved = allDeliverables.filter((d: any) => d.status === "APPROVED").length;
  const waiting = allDeliverables.filter((d: any) => d.status === "WAITING_REVIEW").length;
  const pct = totalDeliverables > 0 ? Math.round((approved / totalDeliverables) * 100) : 0;

  const anyMetaIssue = engagements.some((e: any) =>
    e.metaAdAccounts.some((a: any) => a.connection.status !== "ACTIVE"),
  );
  const anyGoogleIssue = engagements.some((e: any) =>
    e.googleAdsAccounts.some((a: any) => a.connection.status !== "ACTIVE"),
  );
  const accent = engagements[0]?.accentColor || "#1D7070";

  return (
    <div className="space-y-6">
      <Link
        href="/clientes"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" /> Clientes
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4 flex-wrap">
        <span
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl flex-shrink-0"
          style={{ background: accent }}
        >
          {(c.name || "?").charAt(0).toUpperCase()}
        </span>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold">{c.name}</h1>
          <div className="flex items-center gap-4 flex-wrap text-sm text-muted-foreground mt-1">
            <span className="inline-flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              {c.email}
            </span>
            {c.phone && (
              <span className="inline-flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                {c.phone}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {waiting > 0 && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border" style={{ background: accent + "14", color: accent, borderColor: accent + "33" }}>
              <Clock className="w-3.5 h-3.5" />
              {waiting} aguardando validação
            </span>
          )}
          {totalDeliverables > 0 && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-muted text-muted-foreground border border-border">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {pct}% aprovadas
            </span>
          )}
          {(anyMetaIssue || anyGoogleIssue) && (
            <span className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              <AlertTriangle className="w-3.5 h-3.5" />
              Conexão com problema
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-1 overflow-x-auto">
          {TAB_ITEMS.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <Link
                key={t.id}
                href={`/clientes/${params.clientId}?tab=${t.id}`}
                className={
                  "inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap " +
                  (active
                    ? "border-[var(--accent)] text-[var(--accent)]"
                    : "border-transparent text-muted-foreground hover:text-foreground")
                }
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === "frentes" && (
        <FrentesTab engagements={engagements} accent={accent} clientId={params.clientId} />
      )}

      {activeTab === "sobre" && <SobreTab dossier={c.dossier} clientId={params.clientId} />}

      {activeTab === "contratos" && <ContratosTab contracts={c.contracts || []} />}

      {activeTab === "conta" && (
        <div className="space-y-4">
          <ContaAccessCard
            clientId={c.id}
            email={c.email}
            scenesEnabled={!!c.scenesEnabled}
            previewEngagementId={engagements.find((e: any) => e.isActive)?.id || engagements[0]?.id || null}
          />
          <div className="bg-card border border-border rounded-2xl p-6">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
              Contas de anúncio linkadas (por projeto)
            </p>
            <PlataformasTab engagements={engagements} />
          </div>
        </div>
      )}
    </div>
  );
}


// ─── Tab: Frentes ───────────────────────────────────────────────

function FrentesTab({ engagements, accent, clientId }: { engagements: any[]; accent: string; clientId: string }) {
  if (engagements.length === 0) {
    return (
      <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center">
        <p className="text-muted-foreground mb-4">Nenhum projeto ainda.</p>
        <p className="text-xs text-muted-foreground">
          Frentes são adicionadas pelo fluxo de cadastro de novo projeto.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {engagements.map((e) => {
        const Icon = TYPE_ICON[e.type] || Briefcase;
        const total = e.deliverables.length;
        const approved = e.deliverables.filter((d: any) => d.status === "APPROVED").length;
        const waiting = e.deliverables.filter((d: any) => d.status === "WAITING_REVIEW").length;
        const pct = total > 0 ? Math.round((approved / total) * 100) : 0;
        const fAccent = e.accentColor || accent;
        return (
          <Link
            key={e.id}
            href={`/clientes/portal/${e.id}`}
            className="group bg-card border border-border rounded-2xl p-5 hover:border-[var(--accent)]/40 hover:shadow-md transition relative overflow-hidden"
          >
            <span className="absolute left-0 top-0 bottom-0 w-1" style={{ background: fAccent }} />
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="text-base font-semibold">{e.name}</h3>
                <p className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1.5">
                  <Icon className="w-3 h-3" />
                  {TYPE_LABEL[e.type]}
                </p>
              </div>
              <span
                className="text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap"
                style={{ background: fAccent + "1A", color: fAccent }}
              >
                Fase {e.currentPhase} · {PHASE_LABEL[e.currentPhase]}
              </span>
            </div>

            {total > 0 && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">{approved}/{total} aprovados</span>
                  <span className="font-semibold" style={{ color: fAccent }}>{pct}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: fAccent + "20" }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: fAccent }} />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-xs mt-3 pt-3 border-t border-border">
              {waiting > 0 ? (
                <span className="inline-flex items-center gap-1.5 font-medium" style={{ color: fAccent }}>
                  <Clock className="w-3 h-3" />
                  {waiting} aguardando
                </span>
              ) : (
                <span className="text-muted-foreground">tudo em dia</span>
              )}
              <ArrowRight className="w-4 h-4" style={{ color: fAccent }} />
            </div>

            {!e.isActive && (
              <div className="absolute top-3 right-3">
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 uppercase tracking-wider">
                  Inativo
                </span>
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}

// ─── Tab: Sobre (Dossier) ───────────────────────────────────────

function SobreTab({ dossier, clientId }: { dossier: any; clientId: string }) {
  if (!dossier) {
    return (
      <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center">
        <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
        <p className="font-medium">Dossiê ainda não preenchido</p>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2">
          O dossiê é onde mora o "Sobre você" do cliente — informações que se aplicam a TODOS os projetos
          (negócio, tom de voz, referências, personas).
        </p>
        <Link
          href={`/clientes/portal/${clientId}?tab=sobre`}
          className="inline-flex items-center gap-1.5 mt-4 text-sm text-[var(--accent)] hover:underline"
        >
          Editar pelo portal antigo <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field label="Sobre o negócio" value={dossier.about || dossier.business} />
        <Field label="Persona / Público" value={dossier.persona || dossier.audience} />
        <Field label="Tom de voz" value={dossier.tone} />
        <Field label="Diferenciais" value={dossier.differentials} />
      </div>
      <p className="text-xs text-muted-foreground mt-6 pt-4 border-t border-border">
        Pra editar:{" "}
        <Link href={`/clientes/portal/${clientId}`} className="text-[var(--accent)] hover:underline">
          abra qualquer projeto
        </Link>{" "}
        e vá em "Sobre" — em breve a edição vem pra esta tela.
      </p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5">{label}</p>
      <p className="text-sm text-foreground whitespace-pre-wrap">{value || <span className="text-muted-foreground italic">não preenchido</span>}</p>
    </div>
  );
}

// ─── Tab: Plataformas ───────────────────────────────────────────

function PlataformasTab({ engagements }: { engagements: any[] }) {
  if (engagements.length === 0) {
    return (
      <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center">
        <p className="text-muted-foreground">Sem projetos — não há plataformas pra linkar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {engagements.map((e) => {
        const Icon = TYPE_ICON[e.type] || Briefcase;
        return (
          <div key={e.id} className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <Icon className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-semibold">{e.name}</h3>
              <span className="text-xs text-muted-foreground">{TYPE_LABEL[e.type]}</span>
            </div>

            <div className="space-y-3">
              <PlatformRow
                label="Meta Ads"
                accounts={e.metaAdAccounts.map((a: any) => ({
                  name: a.name,
                  id: a.accountId,
                  status: a.connection.status,
                }))}
              />
              <PlatformRow
                label="Google Ads"
                accounts={e.googleAdsAccounts.map((a: any) => ({
                  name: a.name,
                  id: a.customerId,
                  status: a.connection.status,
                }))}
              />
            </div>
          </div>
        );
      })}

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-900">
        <p>
          <strong>Linkagem ↔ Conexão</strong>: pra LINKAR uma conta a um projeto, use{" "}
          <Link href="/clientes/meta" className="underline">/clientes/meta</Link> ou{" "}
          <Link href="/clientes/google-ads" className="underline">/clientes/google-ads</Link>.
          <br />
          Em breve essa linkagem vem pra esta tela (PR #3 do roadmap).
        </p>
      </div>
    </div>
  );
}

function PlatformRow({
  label,
  accounts,
}: {
  label: string;
  accounts: Array<{ name: string; id: string; status: string }>;
}) {
  if (accounts.length === 0) {
    return (
      <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">— sem conta linkada</span>
      </div>
    );
  }

  return (
    <div className="py-2 border-b border-border last:border-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium">{label}</span>
      </div>
      {accounts.map((a) => (
        <div key={a.id} className="flex items-center justify-between text-xs py-1">
          <span className="font-mono">{a.name} <span className="text-muted-foreground">({a.id})</span></span>
          <span
            className={
              "inline-flex items-center gap-1 " + (a.status === "ACTIVE" ? "text-emerald-700" : "text-amber-700")
            }
          >
            {a.status === "ACTIVE" ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
            {a.status === "ACTIVE" ? "ativa" : a.status.toLowerCase()}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Tab: Contratos — todos os contratos do cliente (pode ter vários) ──

const CONTRACT_STATUS: Record<string, { label: string; cls: string }> = {
  ACTIVE: { label: "Ativo", cls: "bg-emerald-500/10 text-emerald-700" },
  PAUSED: { label: "Pausado", cls: "bg-amber-500/10 text-amber-700" },
  CANCELED: { label: "Cancelado", cls: "bg-red-500/10 text-red-600" },
  COMPLETED: { label: "Concluído", cls: "bg-muted text-muted-foreground" },
};

function ContratosTab({ contracts }: { contracts: any[] }) {
  const money = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });
  const dt = (v: string | Date | null) =>
    v ? new Date(v).toLocaleDateString("pt-BR") : "—";

  return (
    <div className="space-y-4">
      {contracts.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhum contrato vinculado a esse cliente ainda.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Crie pelo wizard de <Link href="/clientes/novo" className="text-[var(--accent)] hover:underline">novo cliente</Link>{" "}
            ou em <Link href="/financeiro" className="text-[var(--accent)] hover:underline">Financeiro</Link>.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {contracts.map((ct) => {
            const st = CONTRACT_STATUS[ct.status] || CONTRACT_STATUS.ACTIVE;
            return (
              <div key={ct.id} className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-sm font-semibold">{ct.number}</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${st.cls}`}>
                      {st.label}
                    </span>
                  </div>
                  <Link
                    href="/financeiro"
                    className="text-xs text-muted-foreground hover:text-[var(--accent)] inline-flex items-center gap-1"
                  >
                    ver no financeiro <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Valor mensal</p>
                    <p className="font-semibold tabular-nums mt-0.5">{money(ct.monthlyValue)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Duração</p>
                    <p className="font-semibold mt-0.5">{ct.durationMonths} meses</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Início</p>
                    <p className="font-semibold mt-0.5">{dt(ct.startDate)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Vencimento dia</p>
                    <p className="font-semibold mt-0.5">{ct.paymentDay}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


