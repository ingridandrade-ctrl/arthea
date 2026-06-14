import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Briefcase,
  Globe,
  MapPin,
  Megaphone,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";

// Visão transversal de TODOS os engagements ativos.
// Lê só models existentes (ClientEngagement + relations) — read-only.
// Resolve o "queria ver todos os projetos sem entrar em cada cliente".

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

type FilterParams = {
  type?: string;
  phase?: string;
  view?: string; // "atencao" | "aguardando" | "ativos"
};

export default async function ProjetosPage({
  searchParams,
}: {
  searchParams: FilterParams;
}) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) redirect("/login");
  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "MANAGER") redirect("/inicio");

  // Puxa todos os engagements com dados de cliente + deliverables + status de conexões
  const engagements = await prisma.clientEngagement.findMany({
    where: { isActive: true },
    include: {
      client: { select: { id: true, name: true, email: true } },
      deliverables: { select: { status: true, updatedAt: true } },
      metaAdAccounts: {
        select: { id: true, connection: { select: { status: true } } },
      },
      googleAdsAccounts: {
        select: { id: true, connection: { select: { status: true } } },
      },
    },
    orderBy: [{ client: { name: "asc" } }, { name: "asc" }],
  });

  // Computa indicadores por engagement
  const enriched = engagements.map((e) => {
    const total = e.deliverables.length;
    const approved = e.deliverables.filter((d) => d.status === "APPROVED").length;
    const waiting = e.deliverables.filter((d) => d.status === "WAITING_REVIEW").length;
    const pct = total > 0 ? Math.round((approved / total) * 100) : 0;

    const metaIssue = e.metaAdAccounts.some((a) => a.connection.status !== "ACTIVE");
    const googleIssue = e.googleAdsAccounts.some((a) => a.connection.status !== "ACTIVE");
    const hasMeta = e.metaAdAccounts.length > 0;
    const hasGoogle = e.googleAdsAccounts.length > 0;

    const lastActivity = e.deliverables.reduce<Date | null>((latest, d) => {
      if (!latest || d.updatedAt > latest) return d.updatedAt;
      return latest;
    }, null);

    const inRisk = metaIssue || googleIssue;

    return {
      ...e,
      total,
      approved,
      waiting,
      pct,
      metaIssue,
      googleIssue,
      hasMeta,
      hasGoogle,
      lastActivity,
      inRisk,
    };
  });

  // Aplicar filtros
  let filtered = enriched;
  if (searchParams.type) filtered = filtered.filter((e) => e.type === searchParams.type);
  if (searchParams.phase) filtered = filtered.filter((e) => e.currentPhase === Number(searchParams.phase));
  if (searchParams.view === "atencao") filtered = filtered.filter((e) => e.inRisk);
  if (searchParams.view === "aguardando") filtered = filtered.filter((e) => e.waiting > 0);

  // Counters dos cards do topo
  const counters = {
    total: enriched.length,
    porFase: [1, 2, 3, 4].map((p) => enriched.filter((e) => e.currentPhase === p).length),
    aguardando: enriched.filter((e) => e.waiting > 0).length,
    atencao: enriched.filter((e) => e.inRisk).length,
  };

  const cardClass = (active: boolean) =>
    "block rounded-2xl border p-5 transition " +
    (active
      ? "bg-[var(--accent-soft)] border-[var(--accent)]"
      : "bg-card border-border hover:border-[var(--accent)]/40");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Projetos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Visão transversal de todas as frentes ativas. Onde tá o que, quem aprovou, conexões em risco.
        </p>
      </div>

      {/* Stats cards / filtros */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Link href="/projetos" className={cardClass(!searchParams.view && !searchParams.phase && !searchParams.type)}>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Ativos</p>
          <p className="text-3xl font-bold mt-1 tabular-nums">{counters.total}</p>
          <p className="text-xs text-muted-foreground mt-1">total</p>
        </Link>

        {[1, 2, 3, 4].map((p) => (
          <Link
            key={p}
            href={`/projetos?phase=${p}`}
            className={cardClass(searchParams.phase === String(p))}
          >
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Fase {p}
            </p>
            <p className="text-3xl font-bold mt-1 tabular-nums">{counters.porFase[p - 1]}</p>
            <p className="text-xs text-muted-foreground mt-1">{PHASE_LABEL[p]}</p>
          </Link>
        ))}

        <Link href="/projetos?view=atencao" className={cardClass(searchParams.view === "atencao")}>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-amber-600" /> Atenção
          </p>
          <p className="text-3xl font-bold mt-1 tabular-nums text-amber-700">{counters.atencao}</p>
          <p className="text-xs text-muted-foreground mt-1">conexões</p>
        </Link>
      </div>

      {/* Sub-filtros de view */}
      <div className="flex gap-2 flex-wrap">
        <FilterChip
          active={!searchParams.view || searchParams.view === "todos"}
          href={`/projetos${searchParams.type ? `?type=${searchParams.type}` : ""}${searchParams.phase ? `?phase=${searchParams.phase}` : ""}`}
          label="Todos"
        />
        <FilterChip
          active={searchParams.view === "aguardando"}
          href="/projetos?view=aguardando"
          label={`Aguardando você (${counters.aguardando})`}
        />
        <FilterChip
          active={searchParams.view === "atencao"}
          href="/projetos?view=atencao"
          label={`Em risco (${counters.atencao})`}
        />
        <div className="border-l border-border mx-1" />
        {Object.entries(TYPE_LABEL).map(([key, label]) => (
          <FilterChip
            key={key}
            active={searchParams.type === key}
            href={`/projetos?type=${key}`}
            label={label}
          />
        ))}
      </div>

      {/* Tabela transversal */}
      {filtered.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center">
          <p className="text-muted-foreground">Nenhuma frente nesse filtro.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b border-border">
                <tr className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  <th className="text-left px-5 py-3">Cliente</th>
                  <th className="text-left px-5 py-3">Frente</th>
                  <th className="text-left px-3 py-3">Tipo</th>
                  <th className="text-left px-3 py-3">Fase</th>
                  <th className="text-right px-3 py-3">Aprov.</th>
                  <th className="text-left px-3 py-3">Aguardando</th>
                  <th className="text-left px-3 py-3">Conexões</th>
                  <th className="text-left px-3 py-3">Última atividade</th>
                  <th className="px-3 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => {
                  const Icon = TYPE_ICON[e.type] || Briefcase;
                  const accent = e.accentColor || "#1D7070";
                  return (
                    <tr
                      key={e.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-semibold flex-shrink-0"
                            style={{ background: accent }}
                          >
                            {(e.client.name || "?").charAt(0).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">{e.client.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{e.client.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-medium text-foreground">{e.name}</span>
                      </td>
                      <td className="px-3 py-4">
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Icon size={13} />
                          {TYPE_LABEL[e.type]}
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        <span
                          className="text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap"
                          style={{ background: accent + "1A", color: accent }}
                        >
                          {e.currentPhase} · {PHASE_LABEL[e.currentPhase]}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-right tabular-nums">
                        <span className="font-semibold" style={{ color: accent }}>
                          {e.pct}%
                        </span>
                        <span className="text-xs text-muted-foreground block">
                          {e.approved}/{e.total}
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        {e.waiting > 0 ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: accent }}>
                            <Clock size={12} />
                            {e.waiting} {e.waiting === 1 ? "entrega" : "entregas"}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-2 text-xs">
                          {e.hasMeta && (
                            <span
                              title={e.metaIssue ? "Conexão Meta com problema" : "Meta OK"}
                              className="inline-flex items-center gap-1"
                              style={{ color: e.metaIssue ? "#B45309" : "#1D7070" }}
                            >
                              {e.metaIssue ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                              Meta
                            </span>
                          )}
                          {e.hasGoogle && (
                            <span
                              title={e.googleIssue ? "Conexão Google com problema" : "Google OK"}
                              className="inline-flex items-center gap-1"
                              style={{ color: e.googleIssue ? "#B45309" : "#1D7070" }}
                            >
                              {e.googleIssue ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                              Google
                            </span>
                          )}
                          {!e.hasMeta && !e.hasGoogle && <span className="text-muted-foreground">—</span>}
                        </div>
                      </td>
                      <td className="px-3 py-4 text-xs text-muted-foreground tabular-nums">
                        {e.lastActivity ? formatRelativeDate(e.lastActivity) : "—"}
                      </td>
                      <td className="px-3 py-4">
                        <Link
                          href={`/clientes/portal/${e.id}`}
                          className="inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:underline"
                        >
                          Abrir <ArrowRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  href,
  label,
}: {
  active: boolean;
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={
        "px-3 py-1.5 rounded-full text-xs font-medium border transition " +
        (active
          ? "bg-[var(--accent)] text-white border-[var(--accent)]"
          : "bg-card text-muted-foreground border-border hover:border-[var(--accent)]/50")
      }
    >
      {label}
    </Link>
  );
}

function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "hoje";
  if (diffDays === 1) return "ontem";
  if (diffDays < 7) return `${diffDays}d atrás`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}sem atrás`;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}
