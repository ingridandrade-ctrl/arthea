"use client";

// Visão sênior de performance do cliente, dentro do admin Arthea.
// Não reusa a tela do cliente — design editorial com identidade própria:
// hero gigante, score de saúde da conta, insights computados, tabs Google/Meta.

import { useEffect, useState, useMemo } from "react";
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Sparkles,
  Activity,
  Target,
  ArrowUpRight,
  Zap,
} from "lucide-react";
import { GoogleSection, type GoogleData } from "@/app/(portal)/portal/[engagement]/dashboard/_components/google-section";
import { MetaSection, type MetaData } from "@/app/(portal)/portal/[engagement]/dashboard/_components/meta-section";

type Period = "LAST_7" | "LAST_14" | "LAST_30" | "THIS_MONTH" | "LAST_MONTH";

const PERIODS: { value: Period; label: string }[] = [
  { value: "LAST_7", label: "Últimos 7 dias" },
  { value: "LAST_14", label: "Últimos 14 dias" },
  { value: "LAST_30", label: "Últimos 30 dias" },
  { value: "THIS_MONTH", label: "Este mês" },
  { value: "LAST_MONTH", label: "Mês passado" },
];

const GOOGLE_RANGE: Record<Period, string> = {
  LAST_7: "LAST_7_DAYS",
  LAST_14: "LAST_14_DAYS",
  LAST_30: "LAST_30_DAYS",
  THIS_MONTH: "THIS_MONTH",
  LAST_MONTH: "LAST_MONTH",
};

const META_PRESET: Record<Period, string> = {
  LAST_7: "last_7d",
  LAST_14: "last_14d",
  LAST_30: "last_30d",
  THIS_MONTH: "this_month",
  LAST_MONTH: "last_month",
};

type Tab = "google" | "meta";

export function AdminPerformanceView({
  engagementId,
  clientName,
  engagementName,
}: {
  engagementId: string;
  clientName: string;
  engagementName: string;
}) {
  const [tab, setTab] = useState<Tab>("google");
  const [period, setPeriod] = useState<Period>("LAST_30");
  const [googleData, setGoogleData] = useState<GoogleData | null>(null);
  const [metaData, setMetaData] = useState<MetaData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const fetchGoogle = fetch(
      `/api/google-ads/dashboard?engagementId=${engagementId}&dateRange=${GOOGLE_RANGE[period]}`,
    )
      .then((r) => r.json())
      .catch((e) => ({ error: e.message || "Falha ao carregar Google Ads" }));

    const fetchMeta = fetch(
      `/api/meta/engagement-dashboard?engagementId=${engagementId}&datePreset=${META_PRESET[period]}`,
    )
      .then((r) => r.json())
      .catch((e) => ({ error: e.message || "Falha ao carregar Meta Ads" }));

    Promise.all([fetchGoogle, fetchMeta]).then(([g, m]) => {
      if (cancelled) return;
      setGoogleData(g);
      setMetaData(m);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [engagementId, period]);

  const aggregate = useMemo(
    () => computeAggregate(googleData, metaData),
    [googleData, metaData],
  );
  const health = useMemo(() => computeHealth(googleData, metaData), [googleData, metaData]);
  const insights = useMemo(
    () => computeInsights(googleData, metaData, aggregate),
    [googleData, metaData, aggregate],
  );

  const currentPeriodLabel = PERIODS.find((p) => p.value === period)?.label || "";

  return (
    <div style={{ background: "#FAF9F6", minHeight: "100vh", margin: "-24px", padding: "24px 0 64px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
        {/* HERO */}
        <header style={{ marginBottom: 40 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 16,
            }}
          >
            <span style={{ width: 28, height: 1, background: "#1D7070" }} />
            <span
              style={{
                fontFamily: "ui-monospace, 'JetBrains Mono', Menlo, monospace",
                fontSize: 11,
                color: "#1D7070",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              Performance · Visão Arthea
            </span>
          </div>

          <h1
            style={{
              fontFamily: "Fraunces, Georgia, serif",
              fontSize: "clamp(48px, 7vw, 84px)",
              fontWeight: 400,
              fontStyle: "italic",
              letterSpacing: "-0.035em",
              color: "#0D4A4A",
              margin: 0,
              lineHeight: 0.95,
            }}
          >
            {clientName}
          </h1>
          <p
            style={{
              fontSize: 17,
              color: "#6B7280",
              margin: "16px 0 0",
              fontStyle: "italic",
              fontFamily: "Fraunces, Georgia, serif",
              fontWeight: 400,
            }}
          >
            {engagementName} · Tráfego Pago
          </p>
        </header>

        {/* TOOLBAR */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            marginBottom: 32,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              background: "white",
              border: "0.5px solid rgba(13,74,74,0.12)",
              borderRadius: 999,
              padding: "8px 16px 8px 14px",
              boxShadow: "0 1px 2px rgba(13,74,74,0.04)",
            }}
          >
            <Calendar size={15} color="#1D7070" strokeWidth={1.7} />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as Period)}
              style={{
                border: "none",
                background: "transparent",
                fontSize: 14,
                color: "#0D4A4A",
                fontFamily: "inherit",
                cursor: "pointer",
                outline: "none",
                paddingRight: 4,
                fontWeight: 500,
              }}
            >
              {PERIODS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <button
            disabled
            title="Etapa 4 — em breve"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              borderRadius: 999,
              background: "linear-gradient(135deg, #0D4A4A 0%, #1D7070 100%)",
              color: "white",
              border: "none",
              fontSize: 13.5,
              fontWeight: 500,
              cursor: "not-allowed",
              opacity: 0.65,
              fontFamily: "inherit",
            }}
          >
            <Sparkles size={14} />
            Gerar análise IA <span style={{ opacity: 0.7, fontSize: 11 }}>(em breve)</span>
          </button>
        </div>

        {/* HEALTH + AGGREGATE STRIP */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
            marginBottom: 32,
          }}
        >
          <HealthCard health={health} loading={loading} />
          <MegaKpi
            label="Investimento total"
            value={loading ? "—" : aggregate.spend.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
            sub={`${currentPeriodLabel.toLowerCase()}`}
            accent="#0D4A4A"
          />
          <MegaKpi
            label="Resultados"
            value={loading ? "—" : aggregate.results.toLocaleString("pt-BR")}
            sub={
              aggregate.costPerResult > 0
                ? `${aggregate.costPerResult.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })} por resultado`
                : "leads + conversões"
            }
            accent="#1D7070"
            icon={<Target size={16} color="#1D7070" strokeWidth={1.7} />}
          />
          <MegaKpi
            label="Cliques"
            value={loading ? "—" : aggregate.clicks.toLocaleString("pt-BR")}
            sub={`CTR ${(aggregate.ctr * 100).toFixed(2)}%`}
            accent="#1D7070"
            icon={<Activity size={16} color="#1D7070" strokeWidth={1.7} />}
          />
        </section>

        {/* INSIGHTS */}
        <section style={{ marginBottom: 40 }}>
          <SectionTitle eyebrow="Insights" title="O que está acontecendo" />
          {loading ? (
            <InsightsLoading />
          ) : insights.length === 0 ? (
            <EmptyInsights />
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 14,
              }}
            >
              {insights.map((ins, i) => (
                <InsightCard key={i} insight={ins} />
              ))}
            </div>
          )}
        </section>

        {/* PLATFORM DETAIL TABS */}
        <section>
          <SectionTitle eyebrow="Detalhamento" title="Por plataforma" />
          <div
            role="tablist"
            style={{
              display: "inline-flex",
              background: "white",
              border: "0.5px solid rgba(13,74,74,0.12)",
              borderRadius: 999,
              padding: 4,
              gap: 2,
              marginBottom: 20,
            }}
          >
            <TabButton active={tab === "google"} onClick={() => setTab("google")}>
              Google Ads
            </TabButton>
            <TabButton active={tab === "meta"} onClick={() => setTab("meta")}>
              Meta Ads
            </TabButton>
          </div>
          <div role="tabpanel">
            {tab === "google" ? (
              <GoogleSection data={googleData} loading={loading} />
            ) : (
              <MetaSection data={metaData} loading={loading} />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

// ─── Health card ─────────────────────────────────────────────────

type Health = {
  score: number; // 0–100
  tier: "excellent" | "stable" | "attention" | "critical" | "unknown";
  reasons: string[];
};

function HealthCard({ health, loading }: { health: Health; loading: boolean }) {
  const palette = HEALTH_PALETTE[health.tier];
  return (
    <div
      style={{
        background: palette.bg,
        border: `0.5px solid ${palette.border}`,
        borderRadius: 18,
        padding: "20px 22px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        minHeight: 150,
        boxShadow: "0 1px 2px rgba(13,74,74,0.04)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span
          style={{
            fontFamily: "ui-monospace, 'JetBrains Mono', Menlo, monospace",
            fontSize: 10.5,
            color: palette.label,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          Saúde da conta
        </span>
        <Zap size={14} color={palette.label} strokeWidth={1.7} />
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span
          style={{
            fontFamily: "Fraunces, Georgia, serif",
            fontSize: 44,
            fontWeight: 400,
            fontStyle: "italic",
            color: palette.value,
            lineHeight: 1,
            letterSpacing: "-0.03em",
          }}
        >
          {loading ? "—" : health.score}
        </span>
        <span
          style={{
            fontFamily: "ui-monospace, 'JetBrains Mono', Menlo, monospace",
            fontSize: 11,
            color: palette.label,
            fontWeight: 500,
          }}
        >
          / 100
        </span>
      </div>
      <p
        style={{
          fontSize: 12.5,
          color: palette.value,
          margin: 0,
          fontWeight: 500,
        }}
      >
        {HEALTH_LABEL[health.tier]}
      </p>
      {!loading && health.reasons.length > 0 && (
        <p
          style={{
            fontSize: 11.5,
            color: palette.label,
            margin: "auto 0 0",
            lineHeight: 1.45,
            opacity: 0.9,
          }}
        >
          {health.reasons[0]}
        </p>
      )}
    </div>
  );
}

const HEALTH_PALETTE: Record<Health["tier"], { bg: string; border: string; value: string; label: string }> = {
  excellent: {
    bg: "linear-gradient(135deg, #E8F5F0 0%, #D4ECE0 100%)",
    border: "rgba(13,74,74,0.18)",
    value: "#0D4A4A",
    label: "#1D7070",
  },
  stable: {
    bg: "linear-gradient(135deg, #FAF9F6 0%, #F0EDE5 100%)",
    border: "rgba(13,74,74,0.12)",
    value: "#0D4A4A",
    label: "#8B867B",
  },
  attention: {
    bg: "linear-gradient(135deg, #FEF7E5 0%, #FCEFC9 100%)",
    border: "#F5D88A",
    value: "#92400E",
    label: "#A16207",
  },
  critical: {
    bg: "linear-gradient(135deg, #FEF2F2 0%, #FECACA 100%)",
    border: "#F87171",
    value: "#991B1B",
    label: "#B91C1C",
  },
  unknown: {
    bg: "white",
    border: "rgba(13,74,74,0.10)",
    value: "#6B7280",
    label: "#8B867B",
  },
};

const HEALTH_LABEL: Record<Health["tier"], string> = {
  excellent: "Ótima — manter o ritmo",
  stable: "Estável — alguns pontos pra revisar",
  attention: "Atenção — precisa de ajuste",
  critical: "Crítica — intervir agora",
  unknown: "Sem dados suficientes",
};

// ─── Mega KPI ────────────────────────────────────────────────────

function MegaKpi({
  label,
  value,
  sub,
  accent,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  accent: string;
  icon?: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "white",
        border: "0.5px solid rgba(13,74,74,0.12)",
        borderRadius: 18,
        padding: "20px 22px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        minHeight: 150,
        boxShadow: "0 1px 2px rgba(13,74,74,0.04)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span
          style={{
            fontFamily: "ui-monospace, 'JetBrains Mono', Menlo, monospace",
            fontSize: 10.5,
            color: "#8B867B",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          {label}
        </span>
        {icon}
      </div>
      <span
        style={{
          fontFamily: "Fraunces, Georgia, serif",
          fontSize: 38,
          fontWeight: 400,
          fontStyle: "italic",
          color: accent,
          lineHeight: 1.0,
          letterSpacing: "-0.03em",
        }}
      >
        {value}
      </span>
      {sub && (
        <p
          style={{
            fontSize: 12,
            color: "#8B867B",
            margin: "auto 0 0",
            lineHeight: 1.4,
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

// ─── Insights ────────────────────────────────────────────────────

type InsightTone = "good" | "neutral" | "warn" | "danger";
type Insight = { tone: InsightTone; title: string; body: string };

function InsightCard({ insight }: { insight: Insight }) {
  const palette = INSIGHT_PALETTE[insight.tone];
  const Icon = insight.tone === "good" ? TrendingUp
    : insight.tone === "danger" ? AlertCircle
    : insight.tone === "warn" ? TrendingDown
    : ArrowUpRight;
  return (
    <div
      style={{
        background: palette.bg,
        border: `0.5px solid ${palette.border}`,
        borderRadius: 14,
        padding: "18px 20px",
        display: "flex",
        gap: 14,
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          background: palette.iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={16} color={palette.iconColor} strokeWidth={1.8} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: "ui-monospace, 'JetBrains Mono', Menlo, monospace",
            fontSize: 10,
            color: palette.title,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            fontWeight: 600,
            margin: 0,
          }}
        >
          {insight.title}
        </p>
        <p
          style={{
            fontSize: 13.5,
            color: "#1A1A1A",
            margin: "6px 0 0",
            lineHeight: 1.55,
          }}
        >
          {insight.body}
        </p>
      </div>
    </div>
  );
}

const INSIGHT_PALETTE: Record<InsightTone, { bg: string; border: string; iconBg: string; iconColor: string; title: string }> = {
  good: { bg: "#F0F9F4", border: "rgba(13,74,74,0.10)", iconBg: "#D4ECE0", iconColor: "#0D4A4A", title: "#0D4A4A" },
  neutral: { bg: "white", border: "rgba(13,74,74,0.10)", iconBg: "rgba(13,74,74,0.06)", iconColor: "#1D7070", title: "#8B867B" },
  warn: { bg: "#FEF7E5", border: "#F5D88A", iconBg: "#FBE5A1", iconColor: "#92400E", title: "#92400E" },
  danger: { bg: "#FEF2F2", border: "#FCA5A5", iconBg: "#FECACA", iconColor: "#991B1B", title: "#991B1B" },
};

function InsightsLoading() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 14,
      }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            background: "white",
            border: "0.5px solid rgba(13,74,74,0.08)",
            borderRadius: 14,
            padding: "18px 20px",
            minHeight: 96,
            opacity: 0.5,
          }}
        />
      ))}
    </div>
  );
}

function EmptyInsights() {
  return (
    <div
      style={{
        background: "white",
        border: "0.5px dashed rgba(13,74,74,0.15)",
        borderRadius: 14,
        padding: "32px",
        textAlign: "center",
        color: "#8B867B",
        fontSize: 13.5,
      }}
    >
      Sem dados suficientes pra gerar insights nesse período.
    </div>
  );
}

// ─── SectionTitle ────────────────────────────────────────────────

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <p
        style={{
          fontFamily: "ui-monospace, 'JetBrains Mono', Menlo, monospace",
          fontSize: 10.5,
          color: "#1D7070",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          fontWeight: 600,
          margin: 0,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ width: 18, height: 1, background: "#1D7070" }} />
        {eyebrow}
      </p>
      <h2
        style={{
          fontFamily: "Fraunces, Georgia, serif",
          fontSize: 26,
          fontStyle: "italic",
          fontWeight: 400,
          letterSpacing: "-0.025em",
          color: "#0D4A4A",
          margin: "6px 0 0",
          lineHeight: 1.15,
        }}
      >
        {title}
      </h2>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      role="tab"
      aria-selected={active}
      style={{
        padding: "8px 20px",
        borderRadius: 999,
        background: active ? "var(--accent-soft)" : "transparent",
        color: active ? "var(--accent-deep)" : "#6B7280",
        border: "none",
        fontSize: 13.5,
        fontWeight: active ? 600 : 500,
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "all 0.15s ease",
      }}
    >
      {children}
    </button>
  );
}

// ─── Computações ─────────────────────────────────────────────────

type Aggregate = {
  spend: number;
  clicks: number;
  results: number;
  ctr: number;
  costPerResult: number;
  googleShare: number; // 0–1 do spend
  metaShare: number;
};

function computeAggregate(g: GoogleData | null, m: MetaData | null): Aggregate {
  const gSpend = g?.summary?.cost || 0;
  const gClicks = g?.summary?.clicks || 0;
  const gImpressions = g?.summary?.impressions || 0;
  const gConversions = g?.summary?.conversions || 0;
  const mSpend = m?.summary?.spend || 0;
  const mClicks = m?.summary?.clicks || 0;
  const mImpressions = m?.summary?.impressions || 0;
  const mResults = m?.summary?.results || 0;

  const spend = gSpend + mSpend;
  const clicks = gClicks + mClicks;
  const impressions = gImpressions + mImpressions;
  const results = gConversions + mResults;
  const ctr = impressions > 0 ? clicks / impressions : 0;
  const costPerResult = results > 0 ? spend / results : 0;
  const googleShare = spend > 0 ? gSpend / spend : 0;
  const metaShare = spend > 0 ? mSpend / spend : 0;
  return { spend, clicks, results, ctr, costPerResult, googleShare, metaShare };
}

function computeHealth(g: GoogleData | null, m: MetaData | null): Health {
  let score = 0;
  let buckets = 0;
  const reasons: string[] = [];

  if (g?.summary) {
    buckets++;
    let s = 0;
    if (g.summary.cost > 0) s += 10;
    if (g.summary.ctr >= 0.03) s += 20;
    else if (g.summary.ctr >= 0.01) s += 12;
    else { s += 4; reasons.push("CTR Google abaixo de 1% — copy ou keywords precisam revisão."); }
    if (g.summary.conversions > 0) s += 20;
    else if (g.summary.cost > 0) reasons.push("Google rodando sem conversões registradas.");
    score += s;
  }

  if (m?.summary) {
    buckets++;
    let s = 0;
    if (m.summary.spend > 0) s += 10;
    if (m.summary.frequency >= 5) {
      s += 0;
      reasons.push(`Frequência Meta em ${m.summary.frequency.toFixed(1)} — público saturado, criativos precisam refresh.`);
    } else if (m.summary.frequency >= 3) {
      s += 8;
      reasons.push(`Frequência Meta em ${m.summary.frequency.toFixed(1)} — próximo do limite.`);
    } else if (m.summary.frequency > 0) {
      s += 20;
    }
    if (m.summary.results > 0) s += 20;
    else if (m.summary.spend > 0) reasons.push("Meta rodando sem resultados registrados.");
    score += s;
  }

  if (buckets === 0) {
    return { score: 0, tier: "unknown", reasons: [] };
  }

  // Normaliza pra 0–100 (cada bucket vale até 50)
  const max = buckets * 50;
  const normalized = Math.round((score / max) * 100);
  const tier: Health["tier"] =
    normalized >= 80 ? "excellent"
    : normalized >= 60 ? "stable"
    : normalized >= 40 ? "attention"
    : "critical";

  if (reasons.length === 0) {
    reasons.push("Indicadores principais dentro do esperado.");
  }

  return { score: normalized, tier, reasons };
}

function fmtBRL(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function computeInsights(
  g: GoogleData | null,
  m: MetaData | null,
  agg: Aggregate,
): Insight[] {
  const out: Insight[] = [];

  // Split de plataformas
  if (agg.spend > 0) {
    if (agg.googleShare >= 0.7) {
      out.push({
        tone: "neutral",
        title: "Distribuição",
        body: `${Math.round(agg.googleShare * 100)}% do investimento no Google. Considere testar mais no Meta pra diversificar fonte de leads.`,
      });
    } else if (agg.metaShare >= 0.7) {
      out.push({
        tone: "neutral",
        title: "Distribuição",
        body: `${Math.round(agg.metaShare * 100)}% do investimento no Meta. Buscas qualificadas no Google podem complementar.`,
      });
    } else {
      out.push({
        tone: "good",
        title: "Distribuição",
        body: `Investimento equilibrado: ${Math.round(agg.googleShare * 100)}% Google / ${Math.round(agg.metaShare * 100)}% Meta.`,
      });
    }
  }

  // Top campanha Google
  if (g?.campaigns && g.campaigns.length > 0) {
    const top = [...g.campaigns].sort((a, b) => b.cost - a.cost)[0];
    if (top && top.cost > 0) {
      const share = g.summary ? top.cost / g.summary.cost : 0;
      out.push({
        tone: share > 0.6 ? "warn" : "neutral",
        title: "Concentração Google",
        body:
          share > 0.6
            ? `Campanha "${top.campaignName}" concentra ${Math.round(share * 100)}% do gasto Google. Avaliar diversificação.`
            : `Top campanha Google: "${top.campaignName}" — ${fmtBRL(top.cost)} (${Math.round(share * 100)}% do total).`,
      });
    }

    // Pior CTR
    const enabled = g.campaigns.filter((c) => c.impressions > 100);
    if (enabled.length >= 2) {
      const worst = [...enabled].sort((a, b) => a.ctr - b.ctr)[0];
      if (worst.ctr < 0.01) {
        out.push({
          tone: "warn",
          title: "CTR baixo",
          body: `"${worst.campaignName}" com CTR de ${(worst.ctr * 100).toFixed(2)}%. Revisar copy ou pausar.`,
        });
      }
    }
  }

  // Frequência Meta
  if (m?.summary && m.summary.frequency > 0) {
    if (m.summary.frequency >= 5) {
      out.push({
        tone: "danger",
        title: "Frequência crítica",
        body: `Frequência Meta em ${m.summary.frequency.toFixed(1)}× — público vendo o anúncio demais. Refresh de criativo urgente.`,
      });
    } else if (m.summary.frequency >= 3) {
      out.push({
        tone: "warn",
        title: "Frequência alta",
        body: `Frequência Meta em ${m.summary.frequency.toFixed(1)}× — começando a saturar. Programar refresh de criativos.`,
      });
    }
  }

  // Resultados positivos
  if (agg.results > 0 && agg.costPerResult > 0) {
    out.push({
      tone: "good",
      title: "Resultado",
      body: `${agg.results} resultado(s) no período a ${fmtBRL(agg.costPerResult)} cada.`,
    });
  } else if (agg.spend > 0) {
    out.push({
      tone: "warn",
      title: "Sem conversão",
      body: `${fmtBRL(agg.spend)} investidos sem resultado registrado. Verificar conversion tracking.`,
    });
  }

  return out.slice(0, 6);
}
