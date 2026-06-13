"use client";

// Visão sênior de performance — dark mode moderno.
// Inspiração: Linear, Vercel, Stripe dashboards.
// Big sans-serif tabular numbers, sparklines, radial gauge, donut, live pulse.

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
  DollarSign,
  MousePointerClick,
} from "lucide-react";
import {
  LineChart,
  Line,
  RadialBarChart,
  RadialBar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { GoogleSection, type GoogleData } from "@/app/(portal)/portal/[engagement]/dashboard/_components/google-section";
import { MetaSection, type MetaData } from "@/app/(portal)/portal/[engagement]/dashboard/_components/meta-section";

type Period = "LAST_7" | "LAST_14" | "LAST_30" | "THIS_MONTH" | "LAST_MONTH";

const PERIODS: { value: Period; label: string }[] = [
  { value: "LAST_7", label: "7 dias" },
  { value: "LAST_14", label: "14 dias" },
  { value: "LAST_30", label: "30 dias" },
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

const COLOR = {
  bg: "#0A0E1A",
  bgGrad: "radial-gradient(ellipse at top, #0D1B2A 0%, #06090F 60%)",
  surface: "rgba(255,255,255,0.03)",
  surfaceHi: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.08)",
  borderHi: "rgba(255,255,255,0.14)",
  text: "#E8ECF1",
  textDim: "#8B92A0",
  textMute: "#5C6373",
  accent: "#4ADE80", // green-400
  accentDeep: "#22C55E",
  accentSoft: "rgba(74,222,128,0.12)",
  blue: "#60A5FA",
  blueSoft: "rgba(96,165,250,0.12)",
  amber: "#FBBF24",
  amberSoft: "rgba(251,191,36,0.14)",
  red: "#F87171",
  redSoft: "rgba(248,113,113,0.14)",
  purple: "#A78BFA",
};

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
      .catch((e) => ({ error: e.message }));

    const fetchMeta = fetch(
      `/api/meta/engagement-dashboard?engagementId=${engagementId}&datePreset=${META_PRESET[period]}`,
    )
      .then((r) => r.json())
      .catch((e) => ({ error: e.message }));

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

  const agg = useMemo(() => computeAggregate(googleData, metaData), [googleData, metaData]);
  const health = useMemo(() => computeHealth(googleData, metaData), [googleData, metaData]);
  const insights = useMemo(
    () => computeInsights(googleData, metaData, agg),
    [googleData, metaData, agg],
  );
  const dailySpend = useMemo(() => mergeDaily(googleData, metaData), [googleData, metaData]);

  return (
    <div
      style={{
        background: COLOR.bg,
        backgroundImage: COLOR.bgGrad,
        minHeight: "100vh",
        margin: "-24px",
        padding: "24px 0 80px",
        color: COLOR.text,
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.6; }
        }
        .live-dot { animation: pulse-dot 1.6s ease-in-out infinite; }
        .glass-card {
          background: ${COLOR.surface};
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid ${COLOR.border};
          border-radius: 16px;
          transition: border-color 0.2s ease, background 0.2s ease;
        }
        .glass-card:hover { border-color: ${COLOR.borderHi}; background: ${COLOR.surfaceHi}; }
        .tabular { font-variant-numeric: tabular-nums; }
      `}</style>

      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 32px" }}>
        {/* Top strip — status pill + period */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 12px 6px 10px",
              background: COLOR.accentSoft,
              border: `1px solid rgba(74,222,128,0.25)`,
              borderRadius: 999,
            }}
          >
            <span
              className="live-dot"
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                background: COLOR.accent,
                boxShadow: `0 0 8px ${COLOR.accent}`,
              }}
            />
            <span
              style={{
                fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
                fontSize: 10.5,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: COLOR.accent,
                fontWeight: 600,
              }}
            >
              Ao vivo · atualiza a cada 1h
            </span>
          </div>

          <div style={{ display: "inline-flex", gap: 4, padding: 4, background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: 999 }}>
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 999,
                  background: period === p.value ? COLOR.text : "transparent",
                  color: period === p.value ? COLOR.bg : COLOR.textDim,
                  border: "none",
                  fontSize: 12.5,
                  fontWeight: period === p.value ? 600 : 500,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.15s ease",
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Hero — client name */}
        <header style={{ marginBottom: 32 }}>
          <p
            style={{
              fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
              fontSize: 11,
              color: COLOR.textMute,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              fontWeight: 600,
              margin: 0,
            }}
          >
            {engagementName} · Performance
          </p>
          <h1
            style={{
              fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
              fontSize: "clamp(36px, 5.5vw, 60px)",
              fontWeight: 700,
              letterSpacing: "-0.04em",
              color: COLOR.text,
              margin: "10px 0 0",
              lineHeight: 1.0,
              backgroundImage: `linear-gradient(135deg, ${COLOR.text} 0%, ${COLOR.accent} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {clientName}
          </h1>
        </header>

        {/* Main grid — health gauge + 4 KPIs + donut */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
            gap: 14,
            marginBottom: 24,
          }}
        >
          <HealthCard health={health} loading={loading} />
          <KpiCard
            label="Investimento"
            value={loading ? "—" : fmtBRL(agg.spend)}
            sub={`${agg.spend > 0 ? "BRL · total" : "sem gastos"}`}
            spark={dailySpend.map((d) => d.spend)}
            color={COLOR.accent}
            icon={<DollarSign size={13} />}
          />
          <KpiCard
            label="Resultados"
            value={loading ? "—" : agg.results.toLocaleString("pt-BR")}
            sub={agg.costPerResult > 0 ? `${fmtBRL(agg.costPerResult)} cada` : "leads + conversões"}
            spark={dailySpend.map((d, i) => dailySpend.slice(0, i + 1).reduce((s, x) => s + x.clicks, 0))}
            color={COLOR.blue}
            icon={<Target size={13} />}
            highlight
          />
          <KpiCard
            label="Cliques"
            value={loading ? "—" : agg.clicks.toLocaleString("pt-BR")}
            sub={`CTR ${(agg.ctr * 100).toFixed(2)}%`}
            spark={dailySpend.map((d) => d.clicks)}
            color={COLOR.purple}
            icon={<MousePointerClick size={13} />}
          />
          <KpiCard
            label="Impressões"
            value={loading ? "—" : compact(agg.impressions)}
            sub={agg.impressions > 0 ? "alcance bruto" : "—"}
            spark={dailySpend.map((d) => d.impressions)}
            color={COLOR.amber}
            icon={<Activity size={13} />}
          />
          <PlatformDonut googleShare={agg.googleShare} metaShare={agg.metaShare} loading={loading} />
        </section>

        {/* Insights */}
        <section style={{ marginBottom: 32 }}>
          <SectionTitle eyebrow="Insights" title="O que está acontecendo agora" />
          {loading ? (
            <InsightsLoading />
          ) : insights.length === 0 ? (
            <EmptyInsights />
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: 12,
              }}
            >
              {insights.map((ins, i) => (
                <InsightCard key={i} insight={ins} />
              ))}
            </div>
          )}
        </section>

        {/* Tabs + dark wrapper for detail */}
        <section>
          <SectionTitle eyebrow="Detalhamento" title="Por plataforma" />
          <div
            role="tablist"
            style={{
              display: "inline-flex",
              background: COLOR.surface,
              border: `1px solid ${COLOR.border}`,
              borderRadius: 12,
              padding: 4,
              gap: 2,
              marginBottom: 16,
            }}
          >
            <DarkTab active={tab === "google"} onClick={() => setTab("google")} label="Google Ads" dotColor="#FBBF24" />
            <DarkTab active={tab === "meta"} onClick={() => setTab("meta")} label="Meta Ads" dotColor="#60A5FA" />
          </div>

          {/* Light panel container for embedded sections */}
          <div
            style={{
              background: "#FAF9F6",
              borderRadius: 16,
              padding: 24,
              border: `1px solid ${COLOR.border}`,
            }}
          >
            {tab === "google" ? (
              <GoogleSection data={googleData} loading={loading} />
            ) : (
              <MetaSection data={metaData} loading={loading} />
            )}
          </div>
        </section>

        {/* AI Section preview */}
        <section style={{ marginTop: 32 }}>
          <div
            className="glass-card"
            style={{
              padding: "24px 28px",
              display: "flex",
              alignItems: "center",
              gap: 20,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: `linear-gradient(135deg, ${COLOR.accent}, ${COLOR.blue})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Sparkles size={20} color="#0A0E1A" strokeWidth={2.2} />
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <p
                style={{
                  fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
                  fontSize: 10.5,
                  color: COLOR.accent,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                Próxima etapa
              </p>
              <p style={{ fontSize: 16, color: COLOR.text, margin: "6px 0 4px", fontWeight: 600 }}>
                Análise sênior gerada por IA
              </p>
              <p style={{ fontSize: 13, color: COLOR.textDim, margin: 0, lineHeight: 1.55 }}>
                Diagnóstico em prosa, recomendações priorizadas e rascunho de relatório semanal — direto desse painel.
              </p>
            </div>
            <button
              disabled
              style={{
                padding: "10px 18px",
                borderRadius: 10,
                background: COLOR.surfaceHi,
                color: COLOR.textDim,
                border: `1px solid ${COLOR.border}`,
                fontSize: 13,
                fontWeight: 500,
                fontFamily: "inherit",
                cursor: "not-allowed",
              }}
            >
              Em breve
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

// ─── Health Card with radial gauge ───────────────────────────────

type Health = {
  score: number;
  tier: "excellent" | "stable" | "attention" | "critical" | "unknown";
  reasons: string[];
};

function HealthCard({ health, loading }: { health: Health; loading: boolean }) {
  const tierColor: Record<Health["tier"], string> = {
    excellent: COLOR.accent,
    stable: COLOR.blue,
    attention: COLOR.amber,
    critical: COLOR.red,
    unknown: COLOR.textMute,
  };
  const color = tierColor[health.tier];
  const gaugeData = [{ name: "score", value: health.score, fill: color }];

  return (
    <div
      className="glass-card"
      style={{
        padding: "20px 22px",
        position: "relative",
        overflow: "hidden",
        minHeight: 200,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p
            style={{
              fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
              fontSize: 10.5,
              color: COLOR.textDim,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              fontWeight: 600,
              margin: 0,
            }}
          >
            Saúde da conta
          </p>
          <p style={{ fontSize: 12, color, margin: "6px 0 0", fontWeight: 600 }}>
            {HEALTH_LABEL[health.tier]}
          </p>
        </div>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: `${color}22`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Zap size={14} color={color} strokeWidth={2} />
        </div>
      </div>

      <div style={{ position: "relative", height: 130, marginTop: 4 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="68%"
            outerRadius="96%"
            data={gaugeData}
            startAngle={210}
            endAngle={-30}
          >
            <RadialBar
              background={{ fill: "rgba(255,255,255,0.05)" } as any}
              dataKey="value"
              cornerRadius={20}
              isAnimationActive
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <span
            className="tabular"
            style={{
              fontSize: 38,
              fontWeight: 700,
              color: COLOR.text,
              letterSpacing: "-0.04em",
              lineHeight: 1,
            }}
          >
            {loading ? "—" : health.score}
          </span>
          <span style={{ fontSize: 10, color: COLOR.textMute, marginTop: 2, letterSpacing: "0.1em" }}>
            / 100
          </span>
        </div>
      </div>

      {!loading && health.reasons.length > 0 && (
        <p
          style={{
            fontSize: 11.5,
            color: COLOR.textDim,
            margin: "12px 0 0",
            lineHeight: 1.5,
          }}
        >
          {health.reasons[0]}
        </p>
      )}
    </div>
  );
}

const HEALTH_LABEL: Record<Health["tier"], string> = {
  excellent: "Ótima",
  stable: "Estável",
  attention: "Atenção",
  critical: "Crítica",
  unknown: "Sem dados",
};

// ─── KPI Card with inline sparkline ──────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  spark,
  color,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  spark: number[];
  color: string;
  icon?: React.ReactNode;
  highlight?: boolean;
}) {
  const sparkData = spark.length > 0 ? spark.map((v, i) => ({ i, v })) : [{ i: 0, v: 0 }];
  return (
    <div
      className="glass-card"
      style={{
        padding: "18px 18px 0",
        minHeight: 200,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        background: highlight
          ? `linear-gradient(180deg, rgba(96,165,250,0.06), ${COLOR.surface})`
          : undefined,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <p
          style={{
            fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
            fontSize: 10.5,
            color: COLOR.textDim,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            fontWeight: 600,
            margin: 0,
          }}
        >
          {label}
        </p>
        {icon && (
          <span
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              background: `${color}22`,
              color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {icon}
          </span>
        )}
      </div>
      <span
        className="tabular"
        style={{
          fontSize: 30,
          fontWeight: 700,
          color: COLOR.text,
          letterSpacing: "-0.03em",
          lineHeight: 1.05,
        }}
      >
        {value}
      </span>
      {sub && (
        <p style={{ fontSize: 11.5, color: COLOR.textMute, margin: 0, lineHeight: 1.4 }}>{sub}</p>
      )}
      <div style={{ height: 52, marginTop: "auto", marginLeft: -18, marginRight: -18 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sparkData}>
            <defs>
              <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                <stop offset="100%" stopColor={color} stopOpacity={1} />
              </linearGradient>
            </defs>
            <Line
              type="monotone"
              dataKey="v"
              stroke={`url(#spark-${color.replace("#", "")})`}
              strokeWidth={2}
              dot={false}
              isAnimationActive
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Platform Donut ──────────────────────────────────────────────

function PlatformDonut({
  googleShare,
  metaShare,
  loading,
}: {
  googleShare: number;
  metaShare: number;
  loading: boolean;
}) {
  const data = [
    { name: "Google", value: googleShare * 100, color: COLOR.amber },
    { name: "Meta", value: metaShare * 100, color: COLOR.blue },
  ];
  const lead = googleShare >= metaShare ? "Google" : "Meta";
  const leadShare = Math.max(googleShare, metaShare);

  return (
    <div className="glass-card" style={{ padding: "20px 18px", minHeight: 200, position: "relative" }}>
      <p
        style={{
          fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
          fontSize: 10.5,
          color: COLOR.textDim,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          fontWeight: 600,
          margin: 0,
        }}
      >
        Distribuição
      </p>
      <div style={{ position: "relative", height: 110, marginTop: 6 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius="65%"
              outerRadius="95%"
              startAngle={90}
              endAngle={-270}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <span className="tabular" style={{ fontSize: 22, fontWeight: 700, color: COLOR.text, lineHeight: 1 }}>
            {loading ? "—" : `${Math.round(leadShare * 100)}%`}
          </span>
          <span style={{ fontSize: 10, color: COLOR.textMute, marginTop: 2 }}>{lead}</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 6, flexWrap: "wrap" }}>
        <Legend color={COLOR.amber} label="Google" value={`${Math.round(googleShare * 100)}%`} />
        <Legend color={COLOR.blue} label="Meta" value={`${Math.round(metaShare * 100)}%`} />
      </div>
    </div>
  );
}

function Legend({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
      <span style={{ fontSize: 11, color: COLOR.textDim, fontWeight: 500 }}>{label}</span>
      <span className="tabular" style={{ fontSize: 11.5, color: COLOR.text, fontWeight: 600 }}>{value}</span>
    </div>
  );
}

// ─── Insights ────────────────────────────────────────────────────

type InsightTone = "good" | "neutral" | "warn" | "danger";
type Insight = { tone: InsightTone; title: string; body: string };

function InsightCard({ insight }: { insight: Insight }) {
  const palette: Record<InsightTone, { color: string; bg: string; border: string }> = {
    good: { color: COLOR.accent, bg: COLOR.accentSoft, border: "rgba(74,222,128,0.25)" },
    neutral: { color: COLOR.blue, bg: COLOR.blueSoft, border: "rgba(96,165,250,0.20)" },
    warn: { color: COLOR.amber, bg: COLOR.amberSoft, border: "rgba(251,191,36,0.25)" },
    danger: { color: COLOR.red, bg: COLOR.redSoft, border: "rgba(248,113,113,0.25)" },
  };
  const p = palette[insight.tone];
  const Icon = insight.tone === "good" ? TrendingUp
    : insight.tone === "danger" ? AlertCircle
    : insight.tone === "warn" ? TrendingDown
    : ArrowUpRight;

  return (
    <div
      className="glass-card"
      style={{
        padding: "16px 18px",
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        borderColor: p.border,
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          background: p.bg,
          color: p.color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={15} strokeWidth={2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
            fontSize: 9.5,
            color: p.color,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            fontWeight: 600,
            margin: 0,
          }}
        >
          {insight.title}
        </p>
        <p style={{ fontSize: 13, color: COLOR.text, margin: "5px 0 0", lineHeight: 1.5 }}>
          {insight.body}
        </p>
      </div>
    </div>
  );
}

function InsightsLoading() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: 12,
      }}
    >
      {[0, 1, 2].map((i) => (
        <div key={i} className="glass-card" style={{ padding: "16px 18px", minHeight: 86, opacity: 0.4 }} />
      ))}
    </div>
  );
}

function EmptyInsights() {
  return (
    <div
      className="glass-card"
      style={{
        padding: "32px",
        textAlign: "center",
        color: COLOR.textDim,
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
    <div style={{ marginBottom: 14 }}>
      <p
        style={{
          fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
          fontSize: 10.5,
          color: COLOR.accent,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          fontWeight: 600,
          margin: 0,
        }}
      >
        {eyebrow}
      </p>
      <h2
        style={{
          fontSize: 22,
          fontWeight: 600,
          letterSpacing: "-0.025em",
          color: COLOR.text,
          margin: "4px 0 0",
          lineHeight: 1.2,
        }}
      >
        {title}
      </h2>
    </div>
  );
}

function DarkTab({
  active,
  onClick,
  label,
  dotColor,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  dotColor: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "7px 16px 7px 14px",
        borderRadius: 8,
        background: active ? COLOR.text : "transparent",
        color: active ? COLOR.bg : COLOR.textDim,
        border: "none",
        fontSize: 13,
        fontWeight: active ? 600 : 500,
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "all 0.15s ease",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 999, background: dotColor }} />
      {label}
    </button>
  );
}

// ─── Computações ─────────────────────────────────────────────────

type Aggregate = {
  spend: number;
  clicks: number;
  impressions: number;
  results: number;
  ctr: number;
  costPerResult: number;
  googleShare: number;
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
  return { spend, clicks, impressions, results, ctr, costPerResult, googleShare, metaShare };
}

function mergeDaily(
  g: GoogleData | null,
  m: MetaData | null,
): Array<{ date: string; spend: number; clicks: number; impressions: number }> {
  const map = new Map<string, { spend: number; clicks: number; impressions: number }>();
  for (const d of g?.daily || []) {
    const prev = map.get(d.date) || { spend: 0, clicks: 0, impressions: 0 };
    map.set(d.date, {
      spend: prev.spend + d.cost,
      clicks: prev.clicks + d.clicks,
      impressions: prev.impressions + (d as any).impressions || prev.impressions,
    });
  }
  for (const d of m?.daily || []) {
    const prev = map.get(d.date) || { spend: 0, clicks: 0, impressions: 0 };
    map.set(d.date, {
      spend: prev.spend + d.cost,
      clicks: prev.clicks + d.clicks,
      impressions: prev.impressions,
    });
  }
  return Array.from(map.entries())
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date));
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
    else { s += 4; reasons.push(`CTR Google em ${(g.summary.ctr * 100).toFixed(2)}% — abaixo do esperado.`); }
    if (g.summary.conversions > 0) s += 20;
    else if (g.summary.cost > 0) reasons.push("Google rodando sem conversões registradas.");
    score += s;
  }

  if (m?.summary) {
    buckets++;
    let s = 0;
    if (m.summary.spend > 0) s += 10;
    if (m.summary.frequency >= 5) {
      reasons.push(`Frequência Meta em ${m.summary.frequency.toFixed(1)}× — público saturado.`);
    } else if (m.summary.frequency >= 3) {
      s += 8;
      reasons.push(`Frequência Meta em ${m.summary.frequency.toFixed(1)}× — próximo do limite.`);
    } else if (m.summary.frequency > 0) {
      s += 20;
    }
    if (m.summary.results > 0) s += 20;
    else if (m.summary.spend > 0) reasons.push("Meta rodando sem resultados registrados.");
    score += s;
  }

  if (buckets === 0) return { score: 0, tier: "unknown", reasons: [] };

  const max = buckets * 50;
  const normalized = Math.round((score / max) * 100);
  const tier: Health["tier"] =
    normalized >= 80 ? "excellent"
    : normalized >= 60 ? "stable"
    : normalized >= 40 ? "attention"
    : "critical";

  if (reasons.length === 0) reasons.push("Indicadores principais dentro do esperado.");
  return { score: normalized, tier, reasons };
}

function fmtBRL(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("pt-BR");
}

function computeInsights(
  g: GoogleData | null,
  m: MetaData | null,
  agg: Aggregate,
): Insight[] {
  const out: Insight[] = [];

  if (agg.spend > 0) {
    if (agg.googleShare >= 0.7) {
      out.push({
        tone: "neutral",
        title: "Distribuição concentrada",
        body: `${Math.round(agg.googleShare * 100)}% do investimento no Google. Testar mais Meta pode diversificar a entrada de leads.`,
      });
    } else if (agg.metaShare >= 0.7) {
      out.push({
        tone: "neutral",
        title: "Distribuição concentrada",
        body: `${Math.round(agg.metaShare * 100)}% do investimento no Meta. Buscas qualificadas no Google podem complementar.`,
      });
    } else {
      out.push({
        tone: "good",
        title: "Distribuição equilibrada",
        body: `${Math.round(agg.googleShare * 100)}% Google / ${Math.round(agg.metaShare * 100)}% Meta — diversificação saudável.`,
      });
    }
  }

  if (g?.campaigns && g.campaigns.length > 0) {
    const top = [...g.campaigns].sort((a, b) => b.cost - a.cost)[0];
    if (top && top.cost > 0) {
      const share = g.summary ? top.cost / g.summary.cost : 0;
      out.push({
        tone: share > 0.6 ? "warn" : "neutral",
        title: share > 0.6 ? "Concentração Google" : "Top performer Google",
        body:
          share > 0.6
            ? `"${top.campaignName}" concentra ${Math.round(share * 100)}% do gasto Google. Avaliar diversificação.`
            : `"${top.campaignName}" lidera com ${fmtBRL(top.cost)} (${Math.round(share * 100)}% do total).`,
      });
    }

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

  if (m?.summary && m.summary.frequency > 0) {
    if (m.summary.frequency >= 5) {
      out.push({
        tone: "danger",
        title: "Frequência crítica",
        body: `Frequência Meta em ${m.summary.frequency.toFixed(1)}× — refresh de criativo urgente.`,
      });
    } else if (m.summary.frequency >= 3) {
      out.push({
        tone: "warn",
        title: "Frequência alta",
        body: `Frequência Meta em ${m.summary.frequency.toFixed(1)}× — programar refresh de criativos.`,
      });
    }
  }

  if (agg.results > 0 && agg.costPerResult > 0) {
    out.push({
      tone: "good",
      title: "Resultado positivo",
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
