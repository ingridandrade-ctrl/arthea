"use client";

// Visão sênior de performance — moderno, claro, paleta Arthea preservada.
// Tudo flui no mesmo warm-white #FAF9F6: hero, KPIs, insights e detalhamento
// vivem na mesma "página" visual sem container quebrando o ritmo.

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

// Paleta Arthea
const C = {
  bg: "#FAF9F6",
  bgSoft: "#F4F1EA",
  surface: "#FFFFFF",
  border: "rgba(13,74,74,0.08)",
  borderHi: "rgba(13,74,74,0.16)",
  shadow: "0 1px 2px rgba(13,74,74,0.04), 0 8px 24px -12px rgba(13,74,74,0.08)",
  shadowHi: "0 2px 6px rgba(13,74,74,0.06), 0 16px 40px -20px rgba(13,74,74,0.12)",
  text: "#1A1A1A",
  textDim: "#6B7280",
  textMute: "#8B867B",
  teal: "#0D4A4A",
  tealMid: "#1D7070",
  mint: "#7ED4D4",
  mintSoft: "#E0F2F1",
  amber: "#D97706",
  amberSoft: "#FEF3C7",
  red: "#DC2626",
  redSoft: "#FEE2E2",
  blue: "#2563EB",
  blueSoft: "#DBEAFE",
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
        background: C.bg,
        minHeight: "100vh",
        margin: "-24px",
        padding: "0 0 80px",
        color: C.text,
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .live-dot { animation: pulse-dot 1.8s ease-in-out infinite; }
        .fade-up { animation: fade-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .arc-card {
          background: ${C.surface};
          border: 1px solid ${C.border};
          border-radius: 20px;
          box-shadow: ${C.shadow};
          transition: box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
        }
        .arc-card:hover {
          box-shadow: ${C.shadowHi};
          border-color: ${C.borderHi};
        }
        .tabular { font-variant-numeric: tabular-nums; }
      `}</style>

      {/* Hero band with subtle gradient backdrop */}
      <div
        style={{
          background: `linear-gradient(180deg, ${C.bgSoft} 0%, ${C.bg} 100%)`,
          borderBottom: `1px solid ${C.border}`,
          padding: "32px 0 36px",
        }}
      >
        <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 40px" }}>
          {/* Top row — status + period selector */}
          <div
            className="fade-up"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 28,
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 14px 6px 10px",
                background: C.mintSoft,
                border: `1px solid rgba(126,212,212,0.5)`,
                borderRadius: 999,
              }}
            >
              <span
                className="live-dot"
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: C.tealMid,
                  boxShadow: `0 0 0 4px rgba(29,112,112,0.18)`,
                }}
              />
              <span
                style={{
                  fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
                  fontSize: 10.5,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: C.teal,
                  fontWeight: 600,
                }}
              >
                Ao vivo · atualiza a cada 1h
              </span>
            </div>

            <div
              style={{
                display: "inline-flex",
                gap: 2,
                padding: 4,
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 999,
                boxShadow: C.shadow,
              }}
            >
              {PERIODS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  style={{
                    padding: "7px 16px",
                    borderRadius: 999,
                    background: period === p.value ? C.teal : "transparent",
                    color: period === p.value ? C.surface : C.textDim,
                    border: "none",
                    fontSize: 12.5,
                    fontWeight: period === p.value ? 600 : 500,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.18s ease",
                    letterSpacing: period === p.value ? "0" : "0",
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Hero */}
          <div className="fade-up" style={{ animationDelay: "0.05s" }}>
            <p
              style={{
                fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
                fontSize: 11,
                color: C.tealMid,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                fontWeight: 600,
                margin: 0,
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={{ width: 22, height: 1, background: C.tealMid }} />
              {engagementName} · Performance
            </p>
            <h1
              style={{
                fontSize: "clamp(40px, 6vw, 68px)",
                fontWeight: 700,
                letterSpacing: "-0.035em",
                color: C.teal,
                margin: "14px 0 0",
                lineHeight: 1.0,
              }}
            >
              {clientName}
            </h1>
            <p
              style={{
                fontSize: 15,
                color: C.textDim,
                margin: "10px 0 0",
                maxWidth: 540,
                lineHeight: 1.55,
              }}
            >
              Visão consolidada Google + Meta. Os números mudam em tempo real conforme as plataformas atualizam.
            </p>
          </div>
        </div>
      </div>

      {/* Main container — flows seamlessly on the warm white bg */}
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "32px 40px 0" }}>
        {/* KPI grid: health gauge + 4 KPIs + donut */}
        <section
          className="fade-up"
          style={{
            animationDelay: "0.1s",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(195px, 1fr))",
            gap: 14,
            marginBottom: 40,
          }}
        >
          <HealthCard health={health} loading={loading} />
          <KpiCard
            label="Investimento"
            value={loading ? "—" : fmtBRL(agg.spend)}
            sub={agg.spend > 0 ? "BRL · total" : "sem gastos"}
            spark={dailySpend.map((d) => d.spend)}
            color={C.teal}
            sparkColor={C.tealMid}
            icon={<DollarSign size={13} />}
          />
          <KpiCard
            label="Resultados"
            value={loading ? "—" : agg.results.toLocaleString("pt-BR")}
            sub={agg.costPerResult > 0 ? `${fmtBRL(agg.costPerResult)} cada` : "leads + conversões"}
            spark={cumulativeSeries(dailySpend.map((d) => d.clicks))}
            color={C.tealMid}
            sparkColor={C.mint}
            icon={<Target size={13} />}
            highlight
          />
          <KpiCard
            label="Cliques"
            value={loading ? "—" : agg.clicks.toLocaleString("pt-BR")}
            sub={`CTR ${(agg.ctr * 100).toFixed(2)}%`}
            spark={dailySpend.map((d) => d.clicks)}
            color={C.teal}
            sparkColor={C.tealMid}
            icon={<MousePointerClick size={13} />}
          />
          <KpiCard
            label="Impressões"
            value={loading ? "—" : compact(agg.impressions)}
            sub={agg.impressions > 0 ? "alcance bruto" : "—"}
            spark={dailySpend.map((d) => d.impressions)}
            color={C.teal}
            sparkColor={C.tealMid}
            icon={<Activity size={13} />}
          />
          <PlatformDonut googleShare={agg.googleShare} metaShare={agg.metaShare} loading={loading} />
        </section>

        {/* Insights */}
        <section className="fade-up" style={{ animationDelay: "0.15s", marginBottom: 48 }}>
          <SectionTitle eyebrow="Insights" title="O que está acontecendo agora" />
          {loading ? (
            <InsightsLoading />
          ) : insights.length === 0 ? (
            <EmptyInsights />
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: 14,
              }}
            >
              {insights.map((ins, i) => (
                <InsightCard key={i} insight={ins} />
              ))}
            </div>
          )}
        </section>

        {/* Detalhamento — flows naturally, no wrapping container */}
        <section className="fade-up" style={{ animationDelay: "0.2s" }}>
          <SectionTitle eyebrow="Detalhamento" title="Por plataforma" />
          <div
            role="tablist"
            style={{
              display: "inline-flex",
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: 4,
              gap: 2,
              marginBottom: 24,
              boxShadow: C.shadow,
            }}
          >
            <PlatformTab
              active={tab === "google"}
              onClick={() => setTab("google")}
              label="Google Ads"
              dotColor="#FBBF24"
            />
            <PlatformTab
              active={tab === "meta"}
              onClick={() => setTab("meta")}
              label="Meta Ads"
              dotColor="#2563EB"
            />
          </div>

          {/* sections live directly on the warm bg — no extra container */}
          <div>
            {tab === "google" ? (
              <GoogleSection data={googleData} loading={loading} />
            ) : (
              <MetaSection data={metaData} loading={loading} />
            )}
          </div>
        </section>

        {/* AI Section preview */}
        <section className="fade-up" style={{ animationDelay: "0.25s", marginTop: 48 }}>
          <div
            className="arc-card"
            style={{
              padding: "26px 30px",
              display: "flex",
              alignItems: "center",
              gap: 22,
              flexWrap: "wrap",
              background: `linear-gradient(135deg, ${C.surface} 0%, ${C.mintSoft} 100%)`,
              borderColor: "rgba(126,212,212,0.4)",
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                background: `linear-gradient(135deg, ${C.teal} 0%, ${C.tealMid} 100%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 4px 12px rgba(13,74,74,0.18)",
              }}
            >
              <Sparkles size={22} color={C.mint} strokeWidth={2.2} />
            </div>
            <div style={{ flex: 1, minWidth: 240 }}>
              <p
                style={{
                  fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
                  fontSize: 10.5,
                  color: C.tealMid,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                Próxima etapa
              </p>
              <p style={{ fontSize: 17, color: C.teal, margin: "6px 0 4px", fontWeight: 600, letterSpacing: "-0.01em" }}>
                Análise sênior gerada por IA
              </p>
              <p style={{ fontSize: 13.5, color: C.textDim, margin: 0, lineHeight: 1.55, maxWidth: 540 }}>
                Diagnóstico em prosa, recomendações priorizadas e rascunho de relatório semanal — direto desse painel.
              </p>
            </div>
            <button
              disabled
              style={{
                padding: "11px 20px",
                borderRadius: 12,
                background: C.surface,
                color: C.textMute,
                border: `1px solid ${C.border}`,
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
    excellent: C.tealMid,
    stable: C.tealMid,
    attention: C.amber,
    critical: C.red,
    unknown: C.textMute,
  };
  const color = tierColor[health.tier];
  const gaugeData = [{ name: "score", value: health.score, fill: color }];

  return (
    <div className="arc-card" style={{ padding: "22px 22px 18px", minHeight: 220, position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p
            style={{
              fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
              fontSize: 10.5,
              color: C.textMute,
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
            width: 30,
            height: 30,
            borderRadius: 9,
            background: `${color}18`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Zap size={15} color={color} strokeWidth={2} />
        </div>
      </div>

      <div style={{ position: "relative", height: 130, marginTop: 4 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="70%"
            outerRadius="98%"
            data={gaugeData}
            startAngle={210}
            endAngle={-30}
          >
            <RadialBar
              background={{ fill: "rgba(13,74,74,0.06)" } as any}
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
              color: C.teal,
              letterSpacing: "-0.04em",
              lineHeight: 1,
            }}
          >
            {loading ? "—" : health.score}
          </span>
          <span style={{ fontSize: 10, color: C.textMute, marginTop: 2, letterSpacing: "0.1em" }}>
            / 100
          </span>
        </div>
      </div>

      {!loading && health.reasons.length > 0 && (
        <p style={{ fontSize: 11.5, color: C.textDim, margin: "10px 0 0", lineHeight: 1.5 }}>
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
  sparkColor,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  spark: number[];
  color: string;
  sparkColor: string;
  icon?: React.ReactNode;
  highlight?: boolean;
}) {
  const sparkData = spark.length > 0 ? spark.map((v, i) => ({ i, v })) : [{ i: 0, v: 0 }];
  const gradId = `spark-${label.replace(/\W/g, "")}-${sparkColor.replace("#", "")}`;
  return (
    <div
      className="arc-card"
      style={{
        padding: "20px 20px 0",
        minHeight: 220,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        background: highlight
          ? `linear-gradient(180deg, ${C.mintSoft} 0%, ${C.surface} 55%)`
          : C.surface,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <p
          style={{
            fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
            fontSize: 10.5,
            color: C.textMute,
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
              width: 24,
              height: 24,
              borderRadius: 7,
              background: `${sparkColor}22`,
              color: color,
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
          fontSize: 32,
          fontWeight: 700,
          color: C.teal,
          letterSpacing: "-0.03em",
          lineHeight: 1.05,
        }}
      >
        {value}
      </span>
      {sub && (
        <p style={{ fontSize: 11.5, color: C.textMute, margin: 0, lineHeight: 1.4 }}>{sub}</p>
      )}
      <div style={{ height: 54, marginTop: "auto", marginLeft: -20, marginRight: -20 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sparkData}>
            <defs>
              <linearGradient id={gradId} x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor={sparkColor} stopOpacity={0.35} />
                <stop offset="100%" stopColor={sparkColor} stopOpacity={1} />
              </linearGradient>
            </defs>
            <Line
              type="monotone"
              dataKey="v"
              stroke={`url(#${gradId})`}
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
  const googleColor = "#FBBF24";
  const metaColor = "#2563EB";
  const data = [
    { name: "Google", value: googleShare * 100, color: googleColor },
    { name: "Meta", value: metaShare * 100, color: metaColor },
  ];
  const lead = googleShare >= metaShare ? "Google" : "Meta";
  const leadShare = Math.max(googleShare, metaShare);

  return (
    <div className="arc-card" style={{ padding: "22px 20px 18px", minHeight: 220, position: "relative" }}>
      <p
        style={{
          fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
          fontSize: 10.5,
          color: C.textMute,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          fontWeight: 600,
          margin: 0,
        }}
      >
        Distribuição
      </p>
      <div style={{ position: "relative", height: 120, marginTop: 6 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius="68%"
              outerRadius="96%"
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
          <span className="tabular" style={{ fontSize: 24, fontWeight: 700, color: C.teal, lineHeight: 1, letterSpacing: "-0.02em" }}>
            {loading ? "—" : `${Math.round(leadShare * 100)}%`}
          </span>
          <span style={{ fontSize: 10, color: C.textMute, marginTop: 3 }}>{lead}</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 14, marginTop: 8, flexWrap: "wrap" }}>
        <Legend color={googleColor} label="Google" value={`${Math.round(googleShare * 100)}%`} />
        <Legend color={metaColor} label="Meta" value={`${Math.round(metaShare * 100)}%`} />
      </div>
    </div>
  );
}

function Legend({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
      <span style={{ fontSize: 11, color: C.textDim, fontWeight: 500 }}>{label}</span>
      <span className="tabular" style={{ fontSize: 11.5, color: C.teal, fontWeight: 600 }}>{value}</span>
    </div>
  );
}

// ─── Insights ────────────────────────────────────────────────────

type InsightTone = "good" | "neutral" | "warn" | "danger";
type Insight = { tone: InsightTone; title: string; body: string };

function InsightCard({ insight }: { insight: Insight }) {
  const palette: Record<InsightTone, { color: string; bg: string; border: string }> = {
    good: { color: C.tealMid, bg: C.mintSoft, border: "rgba(126,212,212,0.5)" },
    neutral: { color: C.tealMid, bg: C.surface, border: C.border },
    warn: { color: C.amber, bg: C.amberSoft, border: "rgba(245,158,11,0.35)" },
    danger: { color: C.red, bg: C.redSoft, border: "rgba(220,38,38,0.30)" },
  };
  const p = palette[insight.tone];
  const Icon = insight.tone === "good" ? TrendingUp
    : insight.tone === "danger" ? AlertCircle
    : insight.tone === "warn" ? TrendingDown
    : ArrowUpRight;

  return (
    <div
      className="arc-card"
      style={{
        padding: "18px 20px",
        display: "flex",
        gap: 14,
        alignItems: "flex-start",
        borderColor: p.border,
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          background: p.bg,
          color: p.color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={16} strokeWidth={2} />
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
        <p style={{ fontSize: 13.5, color: C.text, margin: "5px 0 0", lineHeight: 1.55 }}>
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
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: 14,
      }}
    >
      {[0, 1, 2].map((i) => (
        <div key={i} className="arc-card" style={{ padding: "18px 20px", minHeight: 88, opacity: 0.4 }} />
      ))}
    </div>
  );
}

function EmptyInsights() {
  return (
    <div
      style={{
        background: C.surface,
        border: `1px dashed ${C.borderHi}`,
        borderRadius: 16,
        padding: "32px",
        textAlign: "center",
        color: C.textMute,
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
    <div style={{ marginBottom: 18 }}>
      <p
        style={{
          fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
          fontSize: 10.5,
          color: C.tealMid,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          fontWeight: 600,
          margin: 0,
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span style={{ width: 18, height: 1, background: C.tealMid }} />
        {eyebrow}
      </p>
      <h2
        style={{
          fontSize: 24,
          fontWeight: 700,
          letterSpacing: "-0.025em",
          color: C.teal,
          margin: "6px 0 0",
          lineHeight: 1.2,
        }}
      >
        {title}
      </h2>
    </div>
  );
}

function PlatformTab({
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
        padding: "8px 18px 8px 14px",
        borderRadius: 9,
        background: active ? C.teal : "transparent",
        color: active ? C.surface : C.textDim,
        border: "none",
        fontSize: 13,
        fontWeight: active ? 600 : 500,
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "all 0.18s ease",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <span style={{ width: 7, height: 7, borderRadius: 999, background: dotColor }} />
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
      impressions: prev.impressions + ((d as any).impressions || 0),
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

function cumulativeSeries(values: number[]): number[] {
  let acc = 0;
  return values.map((v) => (acc += v));
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
