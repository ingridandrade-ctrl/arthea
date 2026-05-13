import Link from "next/link";
import {
  TrendingUp,
  MousePointerClick,
  Eye,
  DollarSign,
  Sparkles,
  AlertCircle,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  getAccountInsights,
  getCampaignInsightsForAccount,
  type MetaCampaignInsight,
} from "@/lib/meta/api";
import type { ClientEngagement, ClientDeliverable } from "@prisma/client";
import { phaseNamesFor, categoryLabelFor } from "../../../_components/deliverable-status";
import { PhaseTimeline } from "../../../_components/phase-timeline";
import { CircularProgress } from "../../../_components/circular-progress";

type Project = ClientEngagement & { deliverables: ClientDeliverable[] };

const DATE_PRESET = "last_30d";
const DATE_LABEL = "últimos 30 dias";

export async function PaidTrafficDashboard({
  project,
  userName,
}: {
  project: Project;
  userName: string;
}) {
  const firstName = (userName || "").split(" ")[0];

  const adAccounts = await prisma.metaAdAccount.findMany({
    where: { engagementId: project.id, hidden: false },
    include: { connection: { select: { accessToken: true, status: true } } },
    orderBy: { name: "asc" },
  });

  // Busca insights em paralelo, tolerante a erro por conta
  const results = await Promise.all(
    adAccounts.map(async (acc) => {
      if (acc.connection.status !== "ACTIVE") {
        return { acc, insights: null, campaigns: [] as MetaCampaignInsight[], error: "Conexão Meta expirada" };
      }
      try {
        const [insights, campaigns] = await Promise.all([
          getAccountInsights(acc.connection.accessToken, acc.accountId, DATE_PRESET),
          getCampaignInsightsForAccount(acc.connection.accessToken, acc.accountId, DATE_PRESET),
        ]);
        return { acc, insights, campaigns, error: null as null | string };
      } catch (err: any) {
        const meta = err?.response?.data?.error;
        return {
          acc,
          insights: null,
          campaigns: [] as MetaCampaignInsight[],
          error: meta?.message || err.message || "Erro Meta API",
        };
      }
    }),
  );

  let totalSpend = 0;
  let totalImpressions = 0;
  let totalClicks = 0;
  const allCampaigns: (MetaCampaignInsight & {
    currency: string | null;
    accountName: string;
  })[] = [];
  const accountErrors: { name: string; error: string }[] = [];

  for (const r of results) {
    if (r.error) accountErrors.push({ name: r.acc.name, error: r.error });
    totalSpend += Number(r.insights?.spend || 0);
    totalImpressions += Number(r.insights?.impressions || 0);
    totalClicks += Number(r.insights?.clicks || 0);
    for (const c of r.campaigns) {
      allCampaigns.push({ ...c, currency: r.acc.currency, accountName: r.acc.name });
    }
  }

  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const cpm = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;
  const primaryCurrency = adAccounts[0]?.currency || "BRL";

  const topCampaigns = [...allCampaigns]
    .sort((a, b) => Number(b.spend || 0) - Number(a.spend || 0))
    .slice(0, 5);

  // Entregáveis específicos de tráfego (criativos, relatórios, etc.) que precisam atenção
  const creatives = project.deliverables.filter((d) => d.category === "CREATIVE");
  const reports = project.deliverables.filter((d) => d.category === "REPORT");
  const waitingReview = project.deliverables.filter((d) => d.status === "WAITING_REVIEW");

  // Progresso ponderado (mesma fórmula do StrategyDashboard)
  const total = project.deliverables.length;
  const approved = project.deliverables.filter((d) => d.status === "APPROVED").length;
  const WEIGHT: Record<string, number> = {
    PENDING: 0,
    IN_PROGRESS: 0.4,
    REVISION: 0.5,
    WAITING_REVIEW: 0.85,
    APPROVED: 1,
  };
  const weightedSum = project.deliverables.reduce(
    (acc, d) => acc + (WEIGHT[d.status] ?? 0),
    0,
  );
  const agencyProgress = total > 0 ? weightedSum / total : 0;
  const approvedProgress = total > 0 ? approved / total : 0;

  // Stats por fase (até totalPhases do engagement)
  const perPhase = Array.from({ length: project.totalPhases }, (_, idx) => {
    const phase = idx + 1;
    const items = project.deliverables.filter((d) => d.phase === phase);
    return {
      total: items.length,
      approved: items.filter((d) => d.status === "APPROVED").length,
    };
  });

  const phaseNames = phaseNamesFor(project.type);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  })();

  const fmtMoney = (n: number) =>
    n.toLocaleString("pt-BR", {
      style: "currency",
      currency: primaryCurrency,
      maximumFractionDigits: 2,
    });
  const fmtNum = (n: number) => n.toLocaleString("pt-BR");

  return (
    <div className="portal-fade-in" style={{ display: "flex", flexDirection: "column", gap: 36 }}>
      {/* HERO */}
      <header style={{ padding: "8px 0 0" }}>
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--accent)",
            margin: 0,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ display: "inline-block", width: 24, height: 1, background: "var(--accent)" }} />
          {greeting}, {firstName}
        </p>
        <h1
          style={{
            fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
            fontSize: "clamp(36px, 5.5vw, 52px)",
            fontWeight: 700,
            color: "#1A1A1A",
            margin: "16px 0 12px",
            letterSpacing: "-0.025em",
            lineHeight: 1.05,
          }}
        >
          {project.name.split(" ").map((word, i, arr) => {
            const isLast = i === arr.length - 1 && arr.length > 1;
            return isLast ? (
              <em
                key={i}
                style={{
                  fontFamily: "Fraunces, Georgia, serif",
                  fontWeight: 400,
                  fontStyle: "italic",
                  color: "var(--accent)",
                }}
              >
                {word}
              </em>
            ) : (
              <span key={i}>
                {word}
                {i < arr.length - 1 ? " " : ""}
              </span>
            );
          })}
        </h1>
        <p style={{ fontSize: 15, color: "#4A4A4A", margin: 0, maxWidth: 580 }}>
          {project.description || `Painel de tráfego pago · ${DATE_LABEL}.`}
        </p>
      </header>

      {/* Phase timeline */}
      {total > 0 && (
        <section
          style={{
            background: "white",
            borderRadius: 24,
            padding: "32px 36px",
            boxShadow: "0 1px 2px rgba(13,74,74,0.04)",
            border: "0.5px solid rgba(29,112,112,0.08)",
          }}
        >
          <PhaseTimeline
            current={project.currentPhase}
            perPhase={perPhase}
            phaseNames={phaseNames}
          />
        </section>
      )}

      {/* Progresso geral */}
      {total > 0 && (
        <section
          style={{
            background: "white",
            borderRadius: 24,
            padding: "36px 40px",
            boxShadow: "0 1px 2px rgba(13,74,74,0.04), 0 16px 40px rgba(13,74,74,0.04)",
            border: "0.5px solid rgba(29,112,112,0.08)",
            display: "flex",
            alignItems: "center",
            gap: 32,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <CircularProgress
            pct={agencyProgress}
            caption="Andamento do projeto"
            size={160}
            stroke={12}
          />
          <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
            <Mini
              label="Aprovados"
              value={`${approved}/${total}`}
              sub={`${Math.round(approvedProgress * 100)}%`}
              tone="accent"
            />
            <Mini
              label="Aguardando você"
              value={String(waitingReview.length)}
              sub={waitingReview.length > 0 ? "Ação necessária" : "Nada pendente"}
              tone={waitingReview.length > 0 ? "warn" : "muted"}
            />
            <Mini
              label="Fase atual"
              value={String(project.currentPhase)}
              sub={phaseNames[project.currentPhase] || ""}
            />
          </div>
        </section>
      )}

      {/* Métricas */}
      {adAccounts.length > 0 && (
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 14,
          }}
        >
          <Metric
            icon={DollarSign}
            label="Investido"
            value={fmtMoney(totalSpend)}
            tag={DATE_LABEL}
            accent
          />
          <Metric icon={Eye} label="Impressões" value={fmtNum(totalImpressions)} tag={DATE_LABEL} />
          <Metric
            icon={MousePointerClick}
            label="Cliques"
            value={fmtNum(totalClicks)}
            tag={`CTR ${ctr.toFixed(2)}%`}
          />
          <Metric
            icon={TrendingUp}
            label="CPM"
            value={fmtMoney(cpm)}
            tag={`${adAccounts.length} ${adAccounts.length === 1 ? "conta" : "contas"}`}
          />
        </section>
      )}

      {/* Erros por conta */}
      {accountErrors.length > 0 && (
        <section
          style={{
            background: "#FEF7E5",
            border: "0.5px solid #F5D88A",
            borderRadius: 14,
            padding: "16px 20px",
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          <AlertCircle size={18} strokeWidth={1.7} color="#92400E" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1, fontSize: 13, color: "#78350F" }}>
            <p style={{ fontWeight: 600, margin: 0 }}>
              Algumas contas Meta tiveram problema ao carregar
            </p>
            <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
              {accountErrors.map((e, i) => (
                <li key={i} style={{ margin: "2px 0" }}>
                  <strong>{e.name}:</strong> {e.error}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Aguardando aprovação (criativos / relatórios) */}
      {waitingReview.length > 0 && (
        <section>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 16,
            }}
          >
            <Sparkles size={14} strokeWidth={2} color="var(--accent)" />
            <h2
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--accent)",
                margin: 0,
              }}
            >
              Aguardando sua aprovação
            </h2>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "white",
                background: "var(--accent)",
                padding: "2px 8px",
                borderRadius: 999,
              }}
            >
              {waitingReview.length}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {waitingReview.map((d) => (
              <Link
                key={d.id}
                href={`/portal/${project.slug}/entregaveis/${d.id}`}
                className="portal-card-hover"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  background: "white",
                  border: "0.5px solid var(--accent-border)",
                  borderLeft: "3px solid var(--accent)",
                  borderRadius: 14,
                  padding: "16px 20px",
                  textDecoration: "none",
                  color: "inherit",
                  boxShadow: "0 1px 2px rgba(13,74,74,0.03)",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 10.5,
                      fontWeight: 600,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "#A0A0A0",
                      margin: 0,
                    }}
                  >
                    {categoryLabelFor(d.category)}
                  </p>
                  <p style={{ fontSize: 14.5, fontWeight: 500, color: "#2A2A2A", margin: "4px 0 0" }}>
                    {d.title}
                  </p>
                </div>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--accent)",
                    background: "var(--accent-soft)",
                    padding: "6px 12px",
                    borderRadius: 999,
                    whiteSpace: "nowrap",
                  }}
                >
                  Revisar
                  <ArrowRight size={13} strokeWidth={2} />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Top campanhas */}
      {topCampaigns.length > 0 && (
        <section
          style={{
            background: "white",
            borderRadius: 18,
            padding: 0,
            border: "0.5px solid rgba(29,112,112,0.10)",
            overflow: "hidden",
            boxShadow: "0 1px 2px rgba(13,74,74,0.03)",
          }}
        >
          <header
            style={{
              padding: "22px 26px 16px",
              borderBottom: "0.5px solid rgba(13,74,74,0.05)",
            }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "#A0A0A0",
                margin: 0,
              }}
            >
              Top campanhas · {DATE_LABEL}
            </p>
            <h2
              style={{
                fontSize: 20,
                lineHeight: 1.2,
                fontWeight: 600,
                margin: "4px 0 0",
                letterSpacing: "-0.02em",
              }}
            >
              Onde está indo o investimento
            </h2>
          </header>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {topCampaigns.map((c, i) => {
              const fmtCamp = (n: any) =>
                Number(n || 0).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: c.currency || "BRL",
                });
              return (
                <li
                  key={`${c.campaign_id}-${i}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto auto",
                    gap: 18,
                    padding: "14px 26px",
                    borderTop: i === 0 ? "none" : "0.5px solid rgba(13,74,74,0.05)",
                    alignItems: "center",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        margin: 0,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {c.campaign_name}
                    </p>
                    <p style={{ fontSize: 12, color: "#8B867B", margin: "2px 0 0" }}>
                      {c.accountName}
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      color: "#6B7280",
                      fontFamily: "ui-monospace, 'JetBrains Mono', Menlo, monospace",
                    }}
                  >
                    {fmtNum(Number(c.clicks || 0))} cliques
                  </span>
                  <strong
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--accent-deep)",
                      fontFamily: "ui-monospace, 'JetBrains Mono', Menlo, monospace",
                    }}
                  >
                    {fmtCamp(c.spend)}
                  </strong>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Cards de contexto: criativos & relatórios */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 14,
        }}
      >
        <ContextCard
          title="Criativos"
          subtitle={creatives.length === 0 ? "Nenhum criativo ainda" : `${creatives.length} no total`}
          href={`/portal/${project.slug}/entregaveis`}
          metric={String(creatives.filter((c) => c.status === "APPROVED").length)}
          metricLabel="aprovados"
        />
        <ContextCard
          title="Relatórios"
          subtitle={reports.length === 0 ? "Nenhum relatório ainda" : `${reports.length} disponíveis`}
          href={`/portal/${project.slug}/entregaveis`}
          metric={String(reports.length)}
          metricLabel="disponíveis"
        />
      </section>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  tag,
  accent,
}: {
  icon: any;
  label: string;
  value: string;
  tag?: string;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        background: "white",
        border: "0.5px solid rgba(29,112,112,0.10)",
        borderRadius: 16,
        padding: "20px 22px",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        boxShadow: "0 1px 2px rgba(13,74,74,0.03)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          justifyContent: "space-between",
        }}
      >
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "#A0A0A0",
            margin: 0,
          }}
        >
          {label}
        </p>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: accent ? "var(--accent-soft)" : "rgba(13,74,74,0.05)",
            color: accent ? "var(--accent)" : "#8B867B",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={15} strokeWidth={1.7} />
        </div>
      </div>
      <div>
        <p
          style={{
            fontSize: 26,
            fontWeight: 500,
            letterSpacing: "-0.02em",
            color: accent ? "var(--accent-deep)" : "#1A1A1A",
            margin: 0,
            lineHeight: 1.1,
            fontFamily: "ui-monospace, 'JetBrains Mono', Menlo, monospace",
          }}
        >
          {value}
        </p>
        {tag && (
          <p style={{ fontSize: 11.5, color: "#8B867B", margin: "4px 0 0" }}>{tag}</p>
        )}
      </div>
    </div>
  );
}

function ContextCard({
  title,
  subtitle,
  href,
  metric,
  metricLabel,
}: {
  title: string;
  subtitle: string;
  href: string;
  metric: string;
  metricLabel: string;
}) {
  return (
    <Link
      href={href}
      className="portal-card-hover"
      style={{
        background: "white",
        border: "0.5px solid rgba(29,112,112,0.10)",
        borderRadius: 16,
        padding: "22px 24px",
        textDecoration: "none",
        color: "inherit",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        boxShadow: "0 1px 2px rgba(13,74,74,0.03)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div>
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#A0A0A0",
              margin: 0,
            }}
          >
            {title}
          </p>
          <p style={{ fontSize: 15, fontWeight: 500, color: "#1A1A1A", margin: "4px 0 0" }}>
            {subtitle}
          </p>
        </div>
        <ExternalLink size={14} strokeWidth={1.7} color="#A0A0A0" />
      </div>
      <div>
        <span
          style={{
            fontSize: 28,
            fontWeight: 500,
            letterSpacing: "-0.02em",
            color: "var(--accent-deep)",
            fontFamily: "ui-monospace, 'JetBrains Mono', Menlo, monospace",
            lineHeight: 1,
          }}
        >
          {metric}
        </span>
        <span style={{ fontSize: 12, color: "#8B867B", marginLeft: 6 }}>{metricLabel}</span>
      </div>
    </Link>
  );
}

function Mini({
  label,
  value,
  sub,
  tone = "muted",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "accent" | "warn" | "muted";
}) {
  const color =
    tone === "accent" ? "var(--accent)" : tone === "warn" ? "var(--accent)" : "#2A2A2A";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "#A0A0A0",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "Fraunces, Georgia, serif",
          fontSize: 22,
          fontWeight: 400,
          color,
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
        }}
      >
        {value}
      </span>
      {sub && (
        <span
          style={{
            fontSize: 11,
            color: tone === "muted" ? "#A0A0A0" : color,
            fontWeight: 500,
          }}
        >
          {sub}
        </span>
      )}
    </div>
  );
}
