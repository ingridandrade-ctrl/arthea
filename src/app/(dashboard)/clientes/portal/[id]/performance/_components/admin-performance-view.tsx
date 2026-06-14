"use client";

// Visão sênior de performance — design moderno, paleta Arthea, light/dark.
// O design language do hero (arc-card, sparklines, palette teal+mint) é
// aplicado consistentemente em toda a página, incluindo as tabelas de
// Google e Meta no detalhamento.

import { useEffect, useState, useMemo, createContext, useContext, useRef } from "react";
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
  Sun,
  Moon,
  ChevronDown,
  ChevronUp,
  Eye,
  Settings2,
  X,
  RotateCcw,
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
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
} from "recharts";
import type { GoogleData } from "@/app/(portal)/portal/[engagement]/dashboard/_components/google-section";
import type { MetaData } from "@/app/(portal)/portal/[engagement]/dashboard/_components/meta-section";

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
type Theme = "light" | "dark";

// ─── TOKENS ──────────────────────────────────────────────────────

type Tokens = {
  theme: Theme;
  // surfaces
  bg: string;
  bgSoft: string;
  surface: string;
  surfaceAlt: string;
  hover: string;
  // borders
  border: string;
  borderHi: string;
  divider: string;
  // text
  text: string;
  textDim: string;
  textMute: string;
  // brand
  teal: string;
  tealMid: string;
  mint: string;
  mintSoft: string;
  // semantic
  amber: string;
  amberSoft: string;
  red: string;
  redSoft: string;
  // platform brand (constant across themes for recognition)
  googleColor: string;
  metaColor: string;
  // effects
  shadow: string;
  shadowHi: string;
  // gradient for hero band
  heroBand: string;
};

const LIGHT: Tokens = {
  theme: "light",
  bg: "#FAF9F6",
  bgSoft: "#F4F1EA",
  surface: "#FFFFFF",
  surfaceAlt: "#FBF9F4",
  hover: "rgba(13,74,74,0.04)",
  border: "rgba(13,74,74,0.08)",
  borderHi: "rgba(13,74,74,0.16)",
  divider: "rgba(13,74,74,0.06)",
  text: "#1A1A1A",
  textDim: "#5B6573",
  textMute: "#8B867B",
  teal: "#0D4A4A",
  tealMid: "#1D7070",
  mint: "#7ED4D4",
  mintSoft: "#E0F2F1",
  amber: "#B45309",
  amberSoft: "#FEF3C7",
  red: "#B91C1C",
  redSoft: "#FEE2E2",
  googleColor: "#F59E0B",
  metaColor: "#2563EB",
  shadow: "0 1px 2px rgba(13,74,74,0.04), 0 8px 24px -12px rgba(13,74,74,0.08)",
  shadowHi: "0 2px 6px rgba(13,74,74,0.06), 0 16px 40px -20px rgba(13,74,74,0.12)",
  heroBand: "linear-gradient(180deg, #F4F1EA 0%, #FAF9F6 100%)",
};

const DARK: Tokens = {
  theme: "dark",
  bg: "#0A1419",
  bgSoft: "#0F1F25",
  surface: "#121E26",
  surfaceAlt: "#0E1A21",
  hover: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.07)",
  borderHi: "rgba(255,255,255,0.16)",
  divider: "rgba(255,255,255,0.05)",
  text: "#E8ECF1",
  textDim: "#9CA3AF",
  textMute: "#6B7280",
  teal: "#7ED4D4",         // mint becomes primary in dark for contrast
  tealMid: "#5BC4C4",
  mint: "#7ED4D4",
  mintSoft: "rgba(126,212,212,0.12)",
  amber: "#FBBF24",
  amberSoft: "rgba(251,191,36,0.12)",
  red: "#F87171",
  redSoft: "rgba(248,113,113,0.12)",
  googleColor: "#FBBF24",
  metaColor: "#60A5FA",
  shadow: "0 1px 2px rgba(0,0,0,0.4), 0 8px 24px -12px rgba(0,0,0,0.5)",
  shadowHi: "0 2px 6px rgba(0,0,0,0.5), 0 16px 40px -20px rgba(0,0,0,0.6)",
  heroBand: "linear-gradient(180deg, #0F1F25 0%, #0A1419 100%)",
};

const ThemeCtx = createContext<{ tokens: Tokens; theme: Theme; setTheme: (t: Theme) => void }>({
  tokens: LIGHT,
  theme: "light",
  setTheme: () => {},
});

const useTokens = () => useContext(ThemeCtx).tokens;

// ─── MAIN ────────────────────────────────────────────────────────

export function AdminPerformanceView({
  engagementId,
  clientName,
  engagementName,
}: {
  engagementId: string;
  clientName: string;
  engagementName: string;
}) {
  const [theme, setThemeState] = useState<Theme>("light");
  const tokens = theme === "light" ? LIGHT : DARK;
  const [tab, setTab] = useState<Tab>("google");
  const [period, setPeriod] = useState<Period>("LAST_30");
  const [googleData, setGoogleData] = useState<GoogleData | null>(null);
  const [metaData, setMetaData] = useState<MetaData | null>(null);
  const [loading, setLoading] = useState(true);

  // Configurador "Organizar" — quais métricas ficam visíveis (persistido
  // por engagement no localStorage).
  const [hiddenMetrics, setHiddenMetrics] = useState<Set<string>>(new Set());
  const [organizeOpen, setOrganizeOpen] = useState(false);

  // Read persisted theme + sync to localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("arthea-perf-theme");
      if (saved === "dark" || saved === "light") setThemeState(saved);
    } catch {}
  }, []);
  const setTheme = (t: Theme) => {
    setThemeState(t);
    try { localStorage.setItem("arthea-perf-theme", t); } catch {}
  };

  // Read/persist visibility por engagement
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`arthea-perf-hidden-${engagementId}`);
      if (saved) setHiddenMetrics(new Set(JSON.parse(saved)));
    } catch {}
  }, [engagementId]);
  const toggleMetric = (id: string) => {
    setHiddenMetrics((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(
          `arthea-perf-hidden-${engagementId}`,
          JSON.stringify(Array.from(next)),
        );
      } catch {}
      return next;
    });
  };
  const resetHidden = () => {
    setHiddenMetrics(new Set());
    try { localStorage.removeItem(`arthea-perf-hidden-${engagementId}`); } catch {}
  };

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
    <ThemeCtx.Provider value={{ tokens, theme, setTheme }}>
      <div
        style={{
          background: tokens.bg,
          minHeight: "100vh",
          margin: "-24px",
          padding: "0 0 80px",
          color: tokens.text,
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
          transition: "background 0.3s ease, color 0.3s ease",
        }}
      >
        <GlobalStyles tokens={tokens} />

        {/* Hero band with gradient backdrop */}
        <div
          style={{
            background: tokens.heroBand,
            borderBottom: `1px solid ${tokens.border}`,
            padding: "32px 0 36px",
            transition: "background 0.3s ease",
          }}
        >
          <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 40px" }}>
            {/* Top row — status + period + theme */}
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
              <LivePill />
              <div style={{ display: "inline-flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <PeriodPill period={period} setPeriod={setPeriod} />
                <OrganizeButton onClick={() => setOrganizeOpen(true)} hiddenCount={hiddenMetrics.size} />
                <ThemeToggle theme={theme} setTheme={setTheme} />
              </div>
            </div>

            {/* Hero */}
            <Hero clientName={clientName} engagementName={engagementName} />
          </div>
        </div>

        {/* Main */}
        <div style={{ maxWidth: 1320, margin: "0 auto", padding: "32px 40px 0" }}>
          {/* KPI grid */}
          <section
            className="fade-up"
            style={{
              animationDelay: "0.1s",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
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
              accentVar="teal"
              icon={<DollarSign size={13} />}
              loading={loading}
            />
            <KpiCard
              label="Resultados"
              value={loading ? "—" : agg.results.toLocaleString("pt-BR")}
              sub={agg.costPerResult > 0 ? `${fmtBRL(agg.costPerResult)} cada` : "leads + conversões"}
              spark={cumulativeSeries(dailySpend.map((d) => d.clicks))}
              accentVar="mint"
              icon={<Target size={13} />}
              highlight
              loading={loading}
            />
            <KpiCard
              label="Cliques"
              value={loading ? "—" : agg.clicks.toLocaleString("pt-BR")}
              sub={`CTR ${(agg.ctr * 100).toFixed(2)}%`}
              spark={dailySpend.map((d) => d.clicks)}
              accentVar="tealMid"
              icon={<MousePointerClick size={13} />}
              loading={loading}
            />
            <KpiCard
              label="Impressões"
              value={loading ? "—" : compact(agg.impressions)}
              sub={agg.impressions > 0 ? "alcance bruto" : "—"}
              spark={dailySpend.map((d) => d.impressions)}
              accentVar="teal"
              icon={<Activity size={13} />}
              loading={loading}
            />
            <PlatformDonut googleShare={agg.googleShare} metaShare={agg.metaShare} loading={loading} />
          </section>

          {/* Métricas Básicas (CTR, CPC, CPM, Frequência, Alcance, link clicks) */}
          <section className="fade-up" style={{ animationDelay: "0.12s", marginBottom: 40 }}>
            <SectionTitle eyebrow="Performance" title="CTR, CPC, CPM e alcance" />
            <BasicMetricsGrid
              googleData={googleData}
              metaData={metaData}
              loading={loading}
              hidden={hiddenMetrics}
            />
          </section>

          {/* Métricas de Conversão (Receita, ROAS, CPL, Ticket Médio etc) */}
          <section className="fade-up" style={{ animationDelay: "0.13s", marginBottom: 40 }}>
            <SectionTitle eyebrow="Conversão e Financeiro" title="Receita, ROAS e custo por resultado" />
            <ConversionMetricsGrid
              googleData={googleData}
              metaData={metaData}
              loading={loading}
              hidden={hiddenMetrics}
            />
          </section>

          {/* Engajamento e Tráfego (link clicks, landing page views, engagements) */}
          <section className="fade-up" style={{ animationDelay: "0.135s", marginBottom: 40 }}>
            <SectionTitle eyebrow="Engajamento" title="Cliques no link, visitas e interações" />
            <EngagementMetricsGrid
              googleData={googleData}
              metaData={metaData}
              loading={loading}
              hidden={hiddenMetrics}
            />
          </section>

          {/* Análise de Vídeo (Meta) — Hook Rate, Hold Rate, ThruPlay, curva de retenção */}
          <section className="fade-up" style={{ animationDelay: "0.14s", marginBottom: 40 }}>
            <SectionTitle eyebrow="Análise de Vídeo" title="Como seus criativos estão performando" />
            <VideoAnalysisBlock metaData={metaData} loading={loading} hidden={hiddenMetrics} />
          </section>

          {/* Insights */}
          <section className="fade-up" style={{ animationDelay: "0.15s", marginBottom: 48 }}>
            <SectionTitle eyebrow="Insights" title="O que está acontecendo agora" />
            {loading ? (
              <InsightsLoading />
            ) : insights.length === 0 ? (
              <EmptyState text="Sem dados suficientes pra gerar insights nesse período." />
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

          {/* Evolution chart spanning both platforms */}
          <section className="fade-up" style={{ animationDelay: "0.18s", marginBottom: 48 }}>
            <SectionTitle eyebrow="Evolução" title="Investimento e cliques por dia" />
            <EvolutionChart data={dailySpend} loading={loading} />
          </section>

          {/* Detalhamento */}
          <section className="fade-up" style={{ animationDelay: "0.22s" }}>
            <SectionTitle eyebrow="Detalhamento" title="Por plataforma" />
            <div
              role="tablist"
              style={{
                display: "inline-flex",
                background: tokens.surface,
                border: `1px solid ${tokens.border}`,
                borderRadius: 12,
                padding: 4,
                gap: 2,
                marginBottom: 24,
                boxShadow: tokens.shadow,
              }}
            >
              <PlatformTab active={tab === "google"} onClick={() => setTab("google")} label="Google Ads" dotColor={tokens.googleColor} />
              <PlatformTab active={tab === "meta"} onClick={() => setTab("meta")} label="Meta Ads" dotColor={tokens.metaColor} />
            </div>

            <div>
              {tab === "google" ? (
                <AdminGoogleDetail data={googleData} loading={loading} />
              ) : (
                <AdminMetaDetail data={metaData} loading={loading} />
              )}
            </div>
          </section>

          {/* AI banner */}
          <section className="fade-up" style={{ animationDelay: "0.28s", marginTop: 48 }}>
            <AiBanner />
          </section>
        </div>

        {/* Organize Modal */}
        {organizeOpen && (
          <OrganizeModal
            hidden={hiddenMetrics}
            onToggle={toggleMetric}
            onReset={resetHidden}
            onClose={() => setOrganizeOpen(false)}
          />
        )}
      </div>
    </ThemeCtx.Provider>
  );
}

// ─── Global animations ───────────────────────────────────────────

function GlobalStyles({ tokens }: { tokens: Tokens }) {
  return (
    <style>{`
      @keyframes pulse-dot {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.5); opacity: 0.5; }
      }
      @keyframes fade-up {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
      .live-dot { animation: pulse-dot 1.8s ease-in-out infinite; }
      .fade-up { animation: fade-up 0.45s cubic-bezier(0.16, 1, 0.3, 1) both; }
      .arc-card {
        background: ${tokens.surface};
        border: 1px solid ${tokens.border};
        border-radius: 20px;
        box-shadow: ${tokens.shadow};
        transition: box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease, background 0.3s ease;
      }
      .arc-card:hover {
        box-shadow: ${tokens.shadowHi};
        border-color: ${tokens.borderHi};
      }
      .arc-table-row {
        transition: background 0.15s ease;
      }
      .arc-table-row:hover {
        background: ${tokens.hover};
      }
      .tabular { font-variant-numeric: tabular-nums; }
      .skeleton {
        background: linear-gradient(90deg, ${tokens.surfaceAlt} 0%, ${tokens.border} 50%, ${tokens.surfaceAlt} 100%);
        background-size: 200% 100%;
        animation: shimmer 1.6s ease-in-out infinite;
        border-radius: 6px;
      }
      .focus-ring:focus-visible {
        outline: 2px solid ${tokens.tealMid};
        outline-offset: 2px;
      }
    `}</style>
  );
}

// ─── Hero pieces ─────────────────────────────────────────────────

function LivePill() {
  const t = useTokens();
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 14px 6px 10px",
        background: t.mintSoft,
        border: `1px solid ${t.mint}55`,
        borderRadius: 999,
      }}
    >
      <span
        className="live-dot"
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          background: t.tealMid,
          boxShadow: `0 0 0 4px ${t.tealMid}28`,
        }}
      />
      <span
        style={{
          fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
          fontSize: 10.5,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: t.teal,
          fontWeight: 600,
        }}
      >
        Ao vivo · atualiza a cada 1h
      </span>
    </div>
  );
}

function PeriodPill({ period, setPeriod }: { period: Period; setPeriod: (p: Period) => void }) {
  const t = useTokens();
  return (
    <div
      style={{
        display: "inline-flex",
        gap: 2,
        padding: 4,
        background: t.surface,
        border: `1px solid ${t.border}`,
        borderRadius: 999,
        boxShadow: t.shadow,
      }}
    >
      {PERIODS.map((p) => (
        <button
          key={p.value}
          onClick={() => setPeriod(p.value)}
          className="focus-ring"
          style={{
            padding: "7px 16px",
            borderRadius: 999,
            background: period === p.value ? t.teal : "transparent",
            color: period === p.value ? (t.teal === "#7ED4D4" ? "#0A1419" : "#FFFFFF") : t.textDim,
            border: "none",
            fontSize: 12.5,
            fontWeight: period === p.value ? 600 : 500,
            cursor: "pointer",
            fontFamily: "inherit",
            transition: "all 0.18s ease",
          }}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

function ThemeToggle({ theme, setTheme }: { theme: Theme; setTheme: (t: Theme) => void }) {
  const t = useTokens();
  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      title={theme === "light" ? "Modo escuro" : "Modo claro"}
      aria-label={theme === "light" ? "Ativar modo escuro" : "Ativar modo claro"}
      className="focus-ring"
      style={{
        width: 38,
        height: 38,
        borderRadius: 999,
        background: t.surface,
        border: `1px solid ${t.border}`,
        boxShadow: t.shadow,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        color: t.textDim,
        transition: "all 0.18s ease",
      }}
    >
      {theme === "light" ? <Moon size={15} strokeWidth={1.7} /> : <Sun size={16} strokeWidth={1.7} />}
    </button>
  );
}

function OrganizeButton({ onClick, hiddenCount }: { onClick: () => void; hiddenCount: number }) {
  const t = useTokens();
  return (
    <button
      onClick={onClick}
      title="Organizar métricas"
      aria-label="Organizar métricas exibidas"
      className="focus-ring"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 14px 8px 12px",
        borderRadius: 999,
        background: t.surface,
        border: `1px solid ${t.border}`,
        boxShadow: t.shadow,
        cursor: "pointer",
        color: t.textDim,
        fontSize: 12.5,
        fontWeight: 500,
        fontFamily: "inherit",
        transition: "all 0.18s ease",
      }}
    >
      <Settings2 size={14} strokeWidth={1.8} />
      Organizar
      {hiddenCount > 0 && (
        <span
          style={{
            marginLeft: 2,
            padding: "1px 7px",
            borderRadius: 999,
            background: t.tealMid,
            color: t.theme === "dark" ? "#0A1419" : "#FFFFFF",
            fontSize: 10,
            fontWeight: 700,
            fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
          }}
        >
          {hiddenCount}
        </span>
      )}
    </button>
  );
}

// ─── Organize Modal ─────────────────────────────────────────────

type OrganizeMetric = {
  id: string;
  label: string;
  category: "basic" | "engagement" | "conversion" | "video";
};

const ORGANIZE_METRICS: OrganizeMetric[] = [
  // Básicas (Performance)
  { id: "g_ctr", label: "CTR (Google)", category: "basic" },
  { id: "g_cpc", label: "CPC (Google)", category: "basic" },
  { id: "g_cpm", label: "CPM (Google)", category: "basic" },
  { id: "m_ctr", label: "CTR (Meta)", category: "basic" },
  { id: "m_cpc", label: "CPC (Meta)", category: "basic" },
  { id: "m_cpm", label: "CPM (Meta)", category: "basic" },
  { id: "m_reach", label: "Alcance (Meta)", category: "basic" },
  { id: "m_frequency", label: "Frequência (Meta)", category: "basic" },
  // Engajamento
  { id: "m_link_clicks", label: "Cliques no link (Meta)", category: "engagement" },
  { id: "m_lpv_eng", label: "Visitas ao site (Meta)", category: "engagement" },
  { id: "m_lpv_rate", label: "Taxa de carregamento", category: "engagement" },
  { id: "g_clicks", label: "Cliques (Google)", category: "engagement" },
  { id: "g_impressions", label: "Impressões (Google)", category: "engagement" },
  { id: "m_impressions", label: "Impressões (Meta)", category: "engagement" },
  // Conversão e Financeiro
  { id: "g_revenue", label: "Receita (Google)", category: "conversion" },
  { id: "g_roas", label: "ROAS (Google)", category: "conversion" },
  { id: "g_cpa", label: "CPA (Google)", category: "conversion" },
  { id: "m_purchase_value", label: "Vendas (Meta)", category: "conversion" },
  { id: "m_roas", label: "ROAS (Meta)", category: "conversion" },
  { id: "m_leads", label: "Leads (Meta)", category: "conversion" },
  { id: "m_purchases", label: "Compras (Meta)", category: "conversion" },
  { id: "m_conversations", label: "Conversas (Meta)", category: "conversion" },
  { id: "m_lpv", label: "Visitas ao site (Conversão)", category: "conversion" },
  // Vídeo
  { id: "v_hook", label: "Hook Rate", category: "video" },
  { id: "v_hold", label: "Hold Rate", category: "video" },
  { id: "v_thru", label: "ThruPlay Rate", category: "video" },
  { id: "v_avg_time", label: "Tempo Médio Assistido", category: "video" },
  { id: "v_cp_hook", label: "CP-Hook", category: "video" },
  { id: "v_cp_thru", label: "CP-ThruPlay", category: "video" },
];

const CATEGORY_LABEL: Record<OrganizeMetric["category"], string> = {
  basic: "Performance",
  engagement: "Engajamento",
  conversion: "Conversão e Financeiro",
  video: "Análise de Vídeo",
};

function OrganizeModal({
  hidden,
  onToggle,
  onReset,
  onClose,
}: {
  hidden: Set<string>;
  onToggle: (id: string) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const t = useTokens();
  const byCategory = ORGANIZE_METRICS.reduce<Record<string, OrganizeMetric[]>>((acc, m) => {
    acc[m.category] = acc[m.category] || [];
    acc[m.category].push(m);
    return acc;
  }, {});

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(4px)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: t.theme === "dark" ? "#0D1B2A" : "#FFFFFF",
          border: `1px solid ${t.borderHi}`,
          borderRadius: 24,
          boxShadow: t.shadowHi,
          width: "100%",
          maxWidth: 540,
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: `1px solid ${t.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
          }}
        >
          <div>
            <p
              style={{
                fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
                fontSize: 10.5,
                color: t.tealMid,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                fontWeight: 600,
                margin: 0,
              }}
            >
              Organizar
            </p>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: t.text, margin: "6px 0 0", letterSpacing: "-0.02em" }}>
              Escolha o que aparece no painel
            </h3>
            <p style={{ fontSize: 12.5, color: t.textDim, margin: "4px 0 0", lineHeight: 1.5 }}>
              Métricas desativadas ficam ocultas. Você pode reativar a qualquer momento.
            </p>
          </div>
          <button
            onClick={onClose}
            className="focus-ring"
            aria-label="Fechar"
            style={{
              width: 32, height: 32, borderRadius: 8,
              background: t.hover, color: t.textDim,
              border: "none", cursor: "pointer",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <X size={16} strokeWidth={1.8} />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflow: "auto", padding: "16px 24px", flex: 1 }}>
          {Object.entries(byCategory).map(([cat, items]) => (
            <div key={cat} style={{ marginBottom: 20 }}>
              <p
                style={{
                  fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
                  fontSize: 10,
                  color: t.textMute,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  margin: "0 0 10px",
                }}
              >
                {CATEGORY_LABEL[cat as OrganizeMetric["category"]]}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {items.map((m) => {
                  const isHidden = hidden.has(m.id);
                  return (
                    <label
                      key={m.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px 12px",
                        borderRadius: 10,
                        cursor: "pointer",
                        background: isHidden ? "transparent" : t.hover,
                        transition: "background 0.15s ease",
                      }}
                    >
                      {/* Toggle */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={!isHidden}
                        onClick={() => onToggle(m.id)}
                        className="focus-ring"
                        style={{
                          width: 36,
                          height: 20,
                          borderRadius: 999,
                          background: isHidden ? t.border : t.tealMid,
                          border: "none",
                          cursor: "pointer",
                          position: "relative",
                          transition: "background 0.18s ease",
                          flexShrink: 0,
                        }}
                      >
                        <span
                          style={{
                            position: "absolute",
                            top: 2,
                            left: isHidden ? 2 : 18,
                            width: 16,
                            height: 16,
                            borderRadius: 999,
                            background: "#FFFFFF",
                            transition: "left 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                          }}
                        />
                      </button>
                      <span
                        style={{
                          fontSize: 13.5,
                          color: isHidden ? t.textMute : t.text,
                          fontWeight: 500,
                          textDecoration: isHidden ? "line-through" : "none",
                          textDecorationColor: t.textMute,
                          flex: 1,
                        }}
                      >
                        {m.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: `1px solid ${t.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={onReset}
            className="focus-ring"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 10,
              background: "transparent",
              border: "none",
              color: t.textDim,
              fontSize: 12.5,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <RotateCcw size={13} />
            Mostrar tudo
          </button>
          <button
            onClick={onClose}
            className="focus-ring"
            style={{
              padding: "9px 22px",
              borderRadius: 10,
              background: t.teal,
              color: t.theme === "dark" ? "#0A1419" : "#FFFFFF",
              border: "none",
              fontSize: 13.5,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Pronto
          </button>
        </div>
      </div>
    </div>
  );
}

function Hero({ clientName, engagementName }: { clientName: string; engagementName: string }) {
  const t = useTokens();
  return (
    <div className="fade-up" style={{ animationDelay: "0.05s" }}>
      <p
        style={{
          fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
          fontSize: 11,
          color: t.tealMid,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          fontWeight: 600,
          margin: 0,
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span style={{ width: 22, height: 1, background: t.tealMid }} />
        {engagementName} · Performance
      </p>
      <h1
        style={{
          fontSize: "clamp(40px, 6vw, 68px)",
          fontWeight: 700,
          letterSpacing: "-0.035em",
          color: t.teal,
          margin: "14px 0 0",
          lineHeight: 1.0,
        }}
      >
        {clientName}
      </h1>
      <p
        style={{
          fontSize: 15,
          color: t.textDim,
          margin: "10px 0 0",
          maxWidth: 540,
          lineHeight: 1.55,
        }}
      >
        Visão consolidada Google + Meta. Atualizada a cada hora.
      </p>
    </div>
  );
}

// ─── Health Card ─────────────────────────────────────────────────

type Health = {
  score: number;
  tier: "excellent" | "stable" | "attention" | "critical" | "unknown";
  reasons: string[];
};

function HealthCard({ health, loading }: { health: Health; loading: boolean }) {
  const t = useTokens();
  const tierColor: Record<Health["tier"], string> = {
    excellent: t.tealMid,
    stable: t.tealMid,
    attention: t.amber,
    critical: t.red,
    unknown: t.textMute,
  };
  const color = tierColor[health.tier];
  const gaugeData = [{ name: "score", value: health.score, fill: color }];
  const bgTrack = t.theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(13,74,74,0.06)";

  return (
    <div className="arc-card" style={{ padding: "22px 22px 18px", minHeight: 230, position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <Eyebrow>Saúde da conta</Eyebrow>
          <p style={{ fontSize: 12, color, margin: "6px 0 0", fontWeight: 600 }}>
            {HEALTH_LABEL[health.tier]}
          </p>
        </div>
        <IconChip color={color} bg={`${color}1F`}>
          <Zap size={15} strokeWidth={2} />
        </IconChip>
      </div>

      <div style={{ position: "relative", height: 130, marginTop: 4 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart innerRadius="70%" outerRadius="98%" data={gaugeData} startAngle={210} endAngle={-30}>
            <RadialBar background={{ fill: bgTrack } as any} dataKey="value" cornerRadius={20} isAnimationActive />
          </RadialBarChart>
        </ResponsiveContainer>
        <div style={centerOverlay}>
          {loading ? (
            <span className="skeleton" style={{ width: 60, height: 38 }} />
          ) : (
            <>
              <span
                className="tabular"
                style={{
                  fontSize: 40,
                  fontWeight: 700,
                  color: t.teal,
                  letterSpacing: "-0.04em",
                  lineHeight: 1,
                }}
              >
                {health.score}
              </span>
              <span style={{ fontSize: 10, color: t.textMute, marginTop: 2, letterSpacing: "0.1em" }}>
                / 100
              </span>
            </>
          )}
        </div>
      </div>

      {!loading && health.reasons.length > 0 && (
        <p style={{ fontSize: 11.5, color: t.textDim, margin: "10px 0 0", lineHeight: 1.5 }}>
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

const centerOverlay: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  pointerEvents: "none",
};

// ─── KPI Card ────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  spark,
  accentVar,
  icon,
  highlight,
  loading,
}: {
  label: string;
  value: string;
  sub?: string;
  spark: number[];
  accentVar: "teal" | "tealMid" | "mint";
  icon?: React.ReactNode;
  highlight?: boolean;
  loading?: boolean;
}) {
  const t = useTokens();
  const color = t[accentVar];
  const sparkColor = accentVar === "mint" ? t.tealMid : t.mint;
  const sparkData = spark.length > 0 ? spark.map((v, i) => ({ i, v })) : [{ i: 0, v: 0 }];
  const gradId = useRef(`spark-${Math.random().toString(36).slice(2, 9)}`).current;

  return (
    <div
      className="arc-card"
      style={{
        padding: "20px 20px 0",
        minHeight: 230,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        background: highlight
          ? `linear-gradient(180deg, ${t.mintSoft} 0%, ${t.surface} 60%)`
          : t.surface,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Eyebrow>{label}</Eyebrow>
        {icon && (
          <IconChip color={color} bg={`${sparkColor}22`}>
            {icon}
          </IconChip>
        )}
      </div>
      {loading ? (
        <span className="skeleton" style={{ width: "60%", height: 32 }} />
      ) : (
        <span
          className="tabular"
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: t.teal,
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
          }}
        >
          {value}
        </span>
      )}
      {sub && !loading && (
        <p style={{ fontSize: 11.5, color: t.textMute, margin: 0, lineHeight: 1.4 }}>{sub}</p>
      )}
      <div style={{ height: 54, marginTop: "auto", marginLeft: -20, marginRight: -20 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sparkData}>
            <defs>
              <linearGradient id={gradId} x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor={sparkColor} stopOpacity={0.3} />
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
  const t = useTokens();
  const data = [
    { name: "Google", value: googleShare * 100, color: t.googleColor },
    { name: "Meta", value: metaShare * 100, color: t.metaColor },
  ];
  const lead = googleShare >= metaShare ? "Google" : "Meta";
  const leadShare = Math.max(googleShare, metaShare);

  return (
    <div className="arc-card" style={{ padding: "22px 20px 18px", minHeight: 230, position: "relative" }}>
      <Eyebrow>Distribuição</Eyebrow>
      <div style={{ position: "relative", height: 130, marginTop: 6 }}>
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
        <div style={centerOverlay}>
          {loading ? (
            <span className="skeleton" style={{ width: 48, height: 24 }} />
          ) : (
            <>
              <span className="tabular" style={{ fontSize: 26, fontWeight: 700, color: t.teal, lineHeight: 1, letterSpacing: "-0.02em" }}>
                {Math.round(leadShare * 100)}%
              </span>
              <span style={{ fontSize: 10, color: t.textMute, marginTop: 3 }}>{lead}</span>
            </>
          )}
        </div>
      </div>
      <div style={{ display: "flex", gap: 14, marginTop: 8, flexWrap: "wrap" }}>
        <Legend color={t.googleColor} label="Google" value={`${Math.round(googleShare * 100)}%`} />
        <Legend color={t.metaColor} label="Meta" value={`${Math.round(metaShare * 100)}%`} />
      </div>
    </div>
  );
}

function Legend({ color, label, value }: { color: string; label: string; value: string }) {
  const t = useTokens();
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
      <span style={{ fontSize: 11, color: t.textDim, fontWeight: 500 }}>{label}</span>
      <span className="tabular" style={{ fontSize: 11.5, color: t.teal, fontWeight: 600 }}>{value}</span>
    </div>
  );
}

// ─── Insights ────────────────────────────────────────────────────

type InsightTone = "good" | "neutral" | "warn" | "danger";
type Insight = { tone: InsightTone; title: string; body: string };

function InsightCard({ insight }: { insight: Insight }) {
  const t = useTokens();
  const palette: Record<InsightTone, { color: string; bg: string; border: string }> = {
    good: { color: t.tealMid, bg: t.mintSoft, border: `${t.mint}88` },
    neutral: { color: t.tealMid, bg: t.surface, border: t.border },
    warn: { color: t.amber, bg: t.amberSoft, border: `${t.amber}55` },
    danger: { color: t.red, bg: t.redSoft, border: `${t.red}55` },
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
      <IconChip color={p.color} bg={p.bg}>
        <Icon size={16} strokeWidth={2} />
      </IconChip>
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
        <p style={{ fontSize: 13.5, color: t.text, margin: "5px 0 0", lineHeight: 1.55 }}>
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
        <div key={i} className="arc-card" style={{ padding: "18px 20px", minHeight: 92, opacity: 0.5 }}>
          <span className="skeleton" style={{ display: "block", height: 12, width: "40%", marginBottom: 10 }} />
          <span className="skeleton" style={{ display: "block", height: 12, width: "85%", marginBottom: 6 }} />
          <span className="skeleton" style={{ display: "block", height: 12, width: "65%" }} />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  const t = useTokens();
  return (
    <div
      style={{
        background: t.surface,
        border: `1px dashed ${t.borderHi}`,
        borderRadius: 16,
        padding: "40px 32px",
        textAlign: "center",
        color: t.textMute,
        fontSize: 13.5,
      }}
    >
      {text}
    </div>
  );
}

// ─── Evolution Chart ─────────────────────────────────────────────

function EvolutionChart({
  data,
  loading,
}: {
  data: Array<{ date: string; spend: number; clicks: number }>;
  loading: boolean;
}) {
  const t = useTokens();
  if (loading) {
    return (
      <div className="arc-card" style={{ padding: 20, height: 320 }}>
        <span className="skeleton" style={{ display: "block", width: "100%", height: "100%", borderRadius: 14 }} />
      </div>
    );
  }
  if (!data || data.length === 0) {
    return <EmptyState text="Sem dados de evolução no período." />;
  }
  const fmtDate = (raw: string) => {
    const parts = raw.split("-");
    return `${parts[2]}/${parts[1]}`;
  };
  return (
    <div className="arc-card" style={{ padding: 20 }}>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <defs>
            <linearGradient id="spendArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={t.tealMid} stopOpacity={0.32} />
              <stop offset="100%" stopColor={t.tealMid} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={t.divider} vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={fmtDate}
            tick={{ fontSize: 11, fill: t.textMute }}
            stroke={t.border}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="clicks"
            orientation="left"
            tick={{ fontSize: 11, fill: t.textMute }}
            stroke={t.border}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => Number(v).toLocaleString("pt-BR")}
          />
          <YAxis
            yAxisId="spend"
            orientation="right"
            tick={{ fontSize: 11, fill: t.textMute }}
            stroke={t.border}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) =>
              Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
            }
          />
          <Tooltip
            contentStyle={{
              background: t.surface,
              border: `1px solid ${t.borderHi}`,
              borderRadius: 12,
              fontSize: 12.5,
              color: t.text,
              boxShadow: t.shadowHi,
            }}
            labelStyle={{ color: t.textMute, fontSize: 11, marginBottom: 4 }}
            labelFormatter={(raw) => fmtDate(String(raw ?? ""))}
            formatter={(value, name) => {
              const label = String(name ?? "");
              if (label === "Cliques") return [Number(value).toLocaleString("pt-BR"), label];
              if (label === "Investimento")
                return [
                  Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }),
                  label,
                ];
              return [String(value), label];
            }}
          />
          <Area
            yAxisId="spend"
            type="monotone"
            dataKey="spend"
            name="Investimento"
            fill="url(#spendArea)"
            stroke="none"
            isAnimationActive
          />
          <Line
            yAxisId="clicks"
            type="monotone"
            dataKey="clicks"
            name="Cliques"
            stroke={t.teal}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, fill: t.teal, stroke: t.surface, strokeWidth: 2 }}
            isAnimationActive
          />
          <Line
            yAxisId="spend"
            type="monotone"
            dataKey="spend"
            name="Investimento"
            stroke={t.tealMid}
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
            activeDot={{ r: 4 }}
            isAnimationActive
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── SectionTitle, Eyebrow, IconChip ─────────────────────────────

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  const t = useTokens();
  return (
    <div style={{ marginBottom: 18 }}>
      <p
        style={{
          fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
          fontSize: 10.5,
          color: t.tealMid,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          fontWeight: 600,
          margin: 0,
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span style={{ width: 18, height: 1, background: t.tealMid }} />
        {eyebrow}
      </p>
      <h2
        style={{
          fontSize: 24,
          fontWeight: 700,
          letterSpacing: "-0.025em",
          color: t.teal,
          margin: "6px 0 0",
          lineHeight: 1.2,
        }}
      >
        {title}
      </h2>
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  const t = useTokens();
  return (
    <p
      style={{
        fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
        fontSize: 10.5,
        color: t.textMute,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        fontWeight: 600,
        margin: 0,
      }}
    >
      {children}
    </p>
  );
}

function IconChip({ children, color, bg }: { children: React.ReactNode; color: string; bg: string }) {
  return (
    <span
      style={{
        width: 30,
        height: 30,
        borderRadius: 9,
        background: bg,
        color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {children}
    </span>
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
  const t = useTokens();
  return (
    <button
      onClick={onClick}
      className="focus-ring"
      style={{
        padding: "8px 18px 8px 14px",
        borderRadius: 9,
        background: active ? t.teal : "transparent",
        color: active ? (t.teal === "#7ED4D4" ? "#0A1419" : "#FFFFFF") : t.textDim,
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

// ─── Account Header Strip ────────────────────────────────────────

function AccountStrip({
  platform,
  accountName,
  currency,
  dotColor,
  mini,
}: {
  platform: string;
  accountName: string;
  currency: string;
  dotColor: string;
  mini: { label: string; value: string }[];
}) {
  const t = useTokens();
  return (
    <div
      className="arc-card"
      style={{
        padding: "20px 22px",
        marginBottom: 16,
        display: "flex",
        alignItems: "center",
        gap: 24,
        flexWrap: "wrap",
      }}
    >
      <div style={{ flex: "1 1 240px", minWidth: 240 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: dotColor }} />
          <span
            style={{
              fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
              fontSize: 10.5,
              color: t.textMute,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            {platform} · {currency}
          </span>
        </div>
        <p style={{ fontSize: 18, fontWeight: 700, color: t.teal, margin: "4px 0 0", letterSpacing: "-0.015em" }}>
          {accountName}
        </p>
      </div>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        {mini.map((m) => (
          <div key={m.label}>
            <p
              style={{
                fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
                fontSize: 9.5,
                color: t.textMute,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                fontWeight: 600,
                margin: 0,
              }}
            >
              {m.label}
            </p>
            <p className="tabular" style={{ fontSize: 18, fontWeight: 700, color: t.text, margin: "2px 0 0", letterSpacing: "-0.02em" }}>
              {m.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Modern Table ────────────────────────────────────────────────

function ArcTable({
  columns,
  rows,
  emptyText,
  loading,
}: {
  columns: Array<{ key: string; label: string; align?: "left" | "right" | "center"; width?: string }>;
  rows: Array<Array<React.ReactNode>>;
  emptyText: string;
  loading?: boolean;
}) {
  const t = useTokens();
  return (
    <div
      className="arc-card"
      style={{ padding: 0, overflow: "hidden" }}
    >
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead style={{ background: t.surfaceAlt }}>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  style={{
                    textAlign: c.align || "left",
                    padding: "14px 18px",
                    fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
                    fontSize: 10.5,
                    color: t.textMute,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    borderBottom: `1px solid ${t.divider}`,
                    whiteSpace: "nowrap",
                    width: c.width,
                  }}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [0, 1, 2].map((i) => (
                <tr key={i}>
                  {columns.map((c, j) => (
                    <td key={j} style={{ padding: "14px 18px", borderBottom: `1px solid ${t.divider}` }}>
                      <span className="skeleton" style={{ display: "block", height: 12, width: j === 0 ? "80%" : "50%" }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{ padding: "32px 16px", textAlign: "center", color: t.textMute, fontStyle: "italic" }}
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={i} className="arc-table-row" style={{ borderBottom: `1px solid ${t.divider}` }}>
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      style={{
                        padding: "14px 18px",
                        textAlign: columns[j].align || "left",
                        color: t.text,
                        fontFamily:
                          columns[j].align === "right"
                            ? "ui-monospace, 'JetBrains Mono', monospace"
                            : "inherit",
                        fontSize: columns[j].align === "right" ? 12.5 : 13,
                        whiteSpace: "nowrap",
                        verticalAlign: "middle",
                      }}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Pills ───────────────────────────────────────────────────────

function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "good" | "warn" | "danger" | "accent" }) {
  const t = useTokens();
  const palette = {
    neutral: { bg: t.hover, color: t.textDim },
    good: { bg: t.mintSoft, color: t.tealMid },
    warn: { bg: t.amberSoft, color: t.amber },
    danger: { bg: t.redSoft, color: t.red },
    accent: { bg: `${t.tealMid}1F`, color: t.tealMid },
  };
  const p = palette[tone];
  return (
    <span
      style={{
        fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
        fontSize: 9.5,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        padding: "3px 9px",
        borderRadius: 999,
        background: p.bg,
        color: p.color,
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
      }}
    >
      {children}
    </span>
  );
}

function QualityDot({ tier }: { tier: "good" | "warn" | "bad" | "unknown" }) {
  const t = useTokens();
  const color = tier === "good" ? t.tealMid : tier === "warn" ? t.amber : tier === "bad" ? t.red : t.textMute;
  const label = tier === "good" ? "Boa qualidade" : tier === "warn" ? "Atenção" : tier === "bad" ? "Precisa otimizar" : "Sem dados";
  return (
    <span
      title={label}
      aria-label={label}
      style={{
        display: "inline-block",
        width: 10,
        height: 10,
        borderRadius: 999,
        background: color,
        boxShadow: `0 0 0 3px ${color}22`,
      }}
    />
  );
}

// ─── Collapsible Header ──────────────────────────────────────────

function Collapsible({
  eyebrow,
  title,
  open,
  onToggle,
  disabled = false,
  children,
}: {
  eyebrow: string;
  title: string;
  open: boolean;
  onToggle: () => void;
  disabled?: boolean;
  children?: React.ReactNode;
}) {
  const t = useTokens();
  return (
    <div style={{ marginBottom: 16 }}>
      <button
        onClick={disabled ? undefined : onToggle}
        disabled={disabled}
        className="focus-ring"
        style={{
          width: "100%",
          padding: "16px 20px",
          background: t.surface,
          border: `1px solid ${t.border}`,
          borderRadius: open ? "16px 16px 0 0" : 16,
          textAlign: "left",
          cursor: disabled ? "default" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          opacity: disabled ? 0.6 : 1,
          marginBottom: open ? -1 : 0,
          fontFamily: "inherit",
          boxShadow: t.shadow,
          transition: "background 0.15s ease",
        }}
      >
        <div>
          <Eyebrow>{eyebrow}</Eyebrow>
          <span style={{ fontSize: 14, color: t.text, marginTop: 4, display: "block", fontWeight: 500 }}>
            {title}
          </span>
        </div>
        {!disabled && (open ? <ChevronUp size={16} color={t.textMute} /> : <ChevronDown size={16} color={t.textMute} />)}
      </button>
      {open && children}
    </div>
  );
}

// ─── ADMIN GOOGLE DETAIL ─────────────────────────────────────────

function AdminGoogleDetail({ data, loading }: { data: GoogleData | null; loading: boolean }) {
  const t = useTokens();
  const [showKeywords, setShowKeywords] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  if (loading && !data) return <DetailLoading />;
  if (!data) return null;
  if (data.note) return <EmptyState text={data.note} />;
  if (data.error) return <ErrorState text={data.error} />;
  if (!data.summary || !data.account) return <EmptyState text="Sem dados Google Ads no período." />;

  const currency = data.account.currencyCode;
  const money = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency, maximumFractionDigits: 2 });
  const moneyShort = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency, maximumFractionDigits: 0 });
  const num = (v: number) => v.toLocaleString("pt-BR");
  const pct = (v: number) => `${(v * 100).toFixed(2)}%`;
  const s = data.summary;

  const bestCtrId =
    data.campaigns.length > 0
      ? data.campaigns.reduce((a, b) => (b.ctr > a.ctr ? b : a)).campaignId
      : null;
  const mostConvId =
    data.campaigns.length > 0 && data.campaigns.some((c) => c.conversions > 0)
      ? data.campaigns.reduce((a, b) => (b.conversions > a.conversions ? b : a)).campaignId
      : null;

  return (
    <div>
      <AccountStrip
        platform="Google Ads"
        accountName={data.account.name}
        currency={data.account.currencyCode}
        dotColor={t.googleColor}
        mini={[
          { label: "Investimento", value: moneyShort(s.cost) },
          { label: "Cliques", value: num(s.clicks) },
          { label: "CTR", value: pct(s.ctr) },
          { label: "CPC médio", value: money(s.averageCpc) },
          { label: "Conversões", value: num(s.conversions) },
        ]}
      />

      {/* Campanhas */}
      <h3 style={{ fontSize: 14, fontWeight: 600, color: t.text, margin: "24px 0 12px", letterSpacing: "-0.01em" }}>
        Campanhas
      </h3>
      <ArcTable
        columns={[
          { key: "name", label: "Campanha" },
          { key: "imp", label: "Impressões", align: "right" },
          { key: "clk", label: "Cliques", align: "right" },
          { key: "ctr", label: "CTR", align: "right" },
          { key: "cpc", label: "CPC", align: "right" },
          { key: "conv", label: "Conv.", align: "right" },
          { key: "cost", label: "Custo", align: "right" },
        ]}
        rows={data.campaigns.map((c) => [
          <span key="n" style={{ display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ color: t.text }}>{c.campaignName}</span>
            {c.campaignId === bestCtrId && <Pill tone="good">Melhor CTR</Pill>}
            {c.campaignId === mostConvId && <Pill tone="accent">Top conversões</Pill>}
          </span>,
          num(c.impressions),
          num(c.clicks),
          pct(c.ctr),
          money(c.averageCpc),
          num(c.conversions),
          <strong key="cost" style={{ color: t.teal, fontWeight: 600 }}>{money(c.cost)}</strong>,
        ])}
        emptyText="Nenhuma campanha no período."
      />

      {/* Keywords colapsável */}
      <div style={{ marginTop: 24 }}>
        <Collapsible
          eyebrow="Palavras-chave"
          title={`Top ${data.keywords.length} por impressões`}
          open={showKeywords}
          onToggle={() => setShowKeywords((v) => !v)}
          disabled={data.keywords.length === 0}
        >
          <div style={{ borderRadius: "0 0 16px 16px", overflow: "hidden", border: `1px solid ${t.border}`, borderTop: "none" }}>
            <ArcTable
              columns={[
                { key: "kw", label: "Palavra-chave" },
                { key: "match", label: "Tipo" },
                { key: "camp", label: "Campanha" },
                { key: "imp", label: "Impressões", align: "right" },
                { key: "clk", label: "Cliques", align: "right" },
                { key: "ctr", label: "CTR", align: "right" },
                { key: "cpc", label: "CPC", align: "right" },
                { key: "q", label: "Qualidade", align: "center" },
              ]}
              rows={data.keywords.map((k) => [
                k.keywordText,
                <Pill key="m" tone="neutral">{k.matchType.toLowerCase()}</Pill>,
                k.campaignName,
                num(k.impressions),
                num(k.clicks),
                pct(k.ctr),
                money(k.averageCpc),
                <QualityDot key="q" tier={k.qualityTier || "unknown"} />,
              ])}
              emptyText="Sem palavras-chave no período."
            />
          </div>
        </Collapsible>
      </div>

      {/* Search terms colapsável */}
      <div>
        <Collapsible
          eyebrow="Termos de busca"
          title={
            data.searchTerms.length > 0
              ? `${data.searchTerms.length} termos que ativaram seus anúncios`
              : "Sem termos disponíveis no período"
          }
          open={showTerms}
          onToggle={() => setShowTerms((v) => !v)}
          disabled={data.searchTerms.length === 0}
        >
          <div style={{ borderRadius: "0 0 16px 16px", overflow: "hidden", border: `1px solid ${t.border}`, borderTop: "none" }}>
            <ArcTable
              columns={[
                { key: "t", label: "Termo buscado" },
                { key: "c", label: "Campanha" },
                { key: "clk", label: "Cliques", align: "right" },
                { key: "ctr", label: "CTR", align: "right" },
                { key: "cost", label: "Custo", align: "right" },
              ]}
              rows={data.searchTerms.map((tr) => [
                tr.searchTerm,
                tr.campaignName,
                num(tr.clicks),
                pct(tr.ctr),
                <strong key="cost" style={{ color: t.teal, fontWeight: 600 }}>{money(tr.cost)}</strong>,
              ])}
              emptyText="Sem termos no período."
            />
            <p style={{ fontSize: 11.5, color: t.textMute, padding: "12px 18px", margin: 0, lineHeight: 1.5, background: t.surfaceAlt }}>
              Termos com muitos cliques e poucas conversões viram negativas no próximo ajuste.
            </p>
          </div>
        </Collapsible>
      </div>
    </div>
  );
}

// ─── ADMIN META DETAIL ───────────────────────────────────────────

function AdminMetaDetail({ data, loading }: { data: MetaData | null; loading: boolean }) {
  const t = useTokens();

  if (loading && !data) return <DetailLoading />;
  if (!data) return null;
  if (data.note) return <EmptyState text={data.note} />;
  if (data.error) return <ErrorState text={data.error} />;
  if (!data.summary || !data.account) return <EmptyState text="Sem dados Meta Ads no período." />;

  const currency = data.account.currency || "BRL";
  const money = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency, maximumFractionDigits: 2 });
  const moneyShort = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency, maximumFractionDigits: 0 });
  const num = (v: number) => v.toLocaleString("pt-BR");
  const pct = (v: number) => `${(v * 100).toFixed(2)}%`;
  const decimal = (v: number, d = 1) => v.toLocaleString("pt-BR", { maximumFractionDigits: d, minimumFractionDigits: d });
  const s = data.summary;

  const freqTone: "good" | "warn" | "danger" = s.frequency >= 5 ? "danger" : s.frequency >= 3 ? "warn" : "good";
  const bestCtrId =
    data.campaigns.length > 0
      ? data.campaigns.reduce((a, b) => (b.ctr > a.ctr ? b : a)).campaignId
      : null;

  return (
    <div>
      <AccountStrip
        platform="Meta Ads"
        accountName={data.account.name}
        currency={data.account.currency}
        dotColor={t.metaColor}
        mini={[
          { label: "Investimento", value: moneyShort(s.spend) },
          { label: "Alcance", value: num(s.reach) },
          { label: "CTR", value: pct(s.ctr) },
          { label: "Frequência", value: `${decimal(s.frequency)}×` },
          { label: "Resultados", value: num(s.results) },
        ]}
      />

      {freqTone !== "good" && (
        <div
          style={{
            background: freqTone === "danger" ? t.redSoft : t.amberSoft,
            border: `1px solid ${freqTone === "danger" ? t.red : t.amber}55`,
            borderRadius: 14,
            padding: "14px 18px",
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
            marginBottom: 16,
          }}
        >
          <IconChip color={freqTone === "danger" ? t.red : t.amber} bg={freqTone === "danger" ? t.redSoft : t.amberSoft}>
            <AlertCircle size={16} />
          </IconChip>
          <p style={{ fontSize: 13.5, color: t.text, margin: 0, lineHeight: 1.5 }}>
            Frequência em <strong>{decimal(s.frequency)}×</strong>. Acima de 3 satura o público — refresh de criativo recomendado.
          </p>
        </div>
      )}

      <h3 style={{ fontSize: 14, fontWeight: 600, color: t.text, margin: "24px 0 12px", letterSpacing: "-0.01em" }}>
        Campanhas
      </h3>
      <ArcTable
        columns={[
          { key: "name", label: "Campanha" },
          { key: "imp", label: "Impressões", align: "right" },
          { key: "clk", label: "Cliques", align: "right" },
          { key: "ctr", label: "CTR", align: "right" },
          { key: "cpm", label: "CPM", align: "right" },
          { key: "cost", label: "Custo", align: "right" },
        ]}
        rows={data.campaigns.map((c) => [
          <span key="n" style={{ display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ color: t.text }}>{c.campaignName}</span>
            {c.campaignId === bestCtrId && c.clicks > 0 && <Pill tone="good">Melhor CTR</Pill>}
          </span>,
          num(c.impressions),
          num(c.clicks),
          pct(c.ctr),
          money(c.cpm),
          <strong key="cost" style={{ color: t.teal, fontWeight: 600 }}>{money(c.spend)}</strong>,
        ])}
        emptyText="Nenhuma campanha ativa no período."
      />

      <p style={{ fontSize: 11.5, color: t.textMute, marginTop: 12, lineHeight: 1.5 }}>
        Alcance por campanha não é fornecido pela Meta — só no nível da conta.
      </p>
    </div>
  );
}

function DetailLoading() {
  return (
    <div className="arc-card" style={{ padding: 28, minHeight: 200 }}>
      <span className="skeleton" style={{ display: "block", height: 14, width: "30%", marginBottom: 12 }} />
      <span className="skeleton" style={{ display: "block", height: 12, width: "60%", marginBottom: 8 }} />
      <span className="skeleton" style={{ display: "block", height: 12, width: "50%" }} />
    </div>
  );
}

function ErrorState({ text }: { text: string }) {
  const t = useTokens();
  return (
    <div
      style={{
        background: t.amberSoft,
        border: `1px solid ${t.amber}55`,
        borderRadius: 14,
        padding: "20px 24px",
        color: t.amber,
        fontSize: 13.5,
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
      }}
    >
      <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
      <span style={{ color: t.text }}>{text}</span>
    </div>
  );
}

// ─── AI Banner ───────────────────────────────────────────────────

function AiBanner() {
  const t = useTokens();
  return (
    <div
      className="arc-card"
      style={{
        padding: "26px 30px",
        display: "flex",
        alignItems: "center",
        gap: 22,
        flexWrap: "wrap",
        background: `linear-gradient(135deg, ${t.surface} 0%, ${t.mintSoft} 100%)`,
        borderColor: `${t.mint}88`,
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 16,
          background: `linear-gradient(135deg, ${t.teal} 0%, ${t.tealMid} 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          boxShadow: `0 4px 12px ${t.teal}40`,
        }}
      >
        <Sparkles size={22} color={t.theme === "dark" ? "#0A1419" : t.mint} strokeWidth={2.2} />
      </div>
      <div style={{ flex: 1, minWidth: 240 }}>
        <Eyebrow>Próxima etapa</Eyebrow>
        <p style={{ fontSize: 17, color: t.teal, margin: "6px 0 4px", fontWeight: 600, letterSpacing: "-0.01em" }}>
          Análise sênior gerada por IA
        </p>
        <p style={{ fontSize: 13.5, color: t.textDim, margin: 0, lineHeight: 1.55, maxWidth: 540 }}>
          Diagnóstico em prosa, recomendações priorizadas e rascunho de relatório semanal — direto desse painel.
        </p>
      </div>
      <button
        disabled
        style={{
          padding: "11px 20px",
          borderRadius: 12,
          background: t.surface,
          color: t.textMute,
          border: `1px solid ${t.border}`,
          fontSize: 13,
          fontWeight: 500,
          fontFamily: "inherit",
          cursor: "not-allowed",
        }}
      >
        Em breve
      </button>
    </div>
  );
}

// ─── Basic Metrics Grid (CTR, CPC, CPM, Frequência, Alcance) ────

function BasicMetricsGrid({
  googleData,
  metaData,
  loading,
  hidden = new Set<string>(),
}: {
  googleData: GoogleData | null;
  metaData: MetaData | null;
  loading: boolean;
  hidden?: Set<string>;
}) {
  const t = useTokens();
  const g = googleData?.summary as any;
  const m = metaData?.summary as any;
  const gCurr = googleData?.account?.currencyCode || "BRL";
  const mCurr = metaData?.account?.currency || "BRL";

  const tiles: Array<{
    id: string;
    label: string;
    value: string;
    sub?: string;
    tooltip: string;
    platformDot: string;
    accent?: string;
  }> = [];

  if (g && g.cost > 0) {
    tiles.push({
      id: "g_ctr",
      label: "CTR (Google)",
      value: `${((g.ctr || 0) * 100).toFixed(2)}%`,
      sub: g.ctr >= 0.03 ? "acima do esperado" : g.ctr >= 0.01 ? "ok" : "abaixo do mercado",
      tooltip: "Taxa de Cliques. Quantos cliques aconteceram a cada 100 impressões.",
      platformDot: t.googleColor,
      accent: g.ctr >= 0.03 ? t.tealMid : g.ctr >= 0.01 ? undefined : t.amber,
    });
    tiles.push({
      id: "g_cpc",
      label: "CPC (Google)",
      value: fmtCurrency(g.averageCpc || 0, gCurr),
      sub: "custo médio por clique",
      tooltip: "Quanto você paga em média por cada clique. Quanto menor, melhor.",
      platformDot: t.googleColor,
    });
    tiles.push({
      id: "g_cpm",
      label: "CPM (Google)",
      value: fmtCurrency(g.averageCpm || 0, gCurr),
      sub: "custo por mil impressões",
      tooltip: "Custo de cada 1.000 impressões. Indica inflação do leilão da plataforma.",
      platformDot: t.googleColor,
    });
  }

  if (m && m.spend > 0) {
    tiles.push({
      id: "m_ctr",
      label: "CTR (Meta)",
      value: `${((m.ctr || 0) * 100).toFixed(2)}%`,
      sub: m.ctr >= 0.02 ? "acima do esperado" : m.ctr >= 0.01 ? "ok" : "abaixo do mercado",
      tooltip: "Taxa de Cliques no Meta. Cliques ÷ impressões.",
      platformDot: t.metaColor,
      accent: m.ctr >= 0.02 ? t.tealMid : m.ctr >= 0.01 ? undefined : t.amber,
    });
    tiles.push({
      id: "m_cpc",
      label: "CPC (Meta)",
      value: fmtCurrency(m.cpc || 0, mCurr),
      sub: "custo médio por clique",
      tooltip: "Custo médio por clique no Meta.",
      platformDot: t.metaColor,
    });
    tiles.push({
      id: "m_cpm",
      label: "CPM (Meta)",
      value: fmtCurrency(m.cpm || 0, mCurr),
      sub: "custo por mil impressões",
      tooltip: "Custo de cada 1.000 impressões no Meta.",
      platformDot: t.metaColor,
    });
    tiles.push({
      id: "m_reach",
      label: "Alcance (Meta)",
      value: compact(m.reach || 0),
      sub: "pessoas únicas",
      tooltip: "Pessoas únicas que viram seus anúncios. Diferente de impressões (que conta repetições).",
      platformDot: t.metaColor,
    });
    if ((m.frequency || 0) > 0) {
      const freq = m.frequency;
      tiles.push({
        id: "m_frequency",
        label: "Frequência (Meta)",
        value: `${freq.toFixed(1)}×`,
        sub: freq >= 5 ? "crítica" : freq >= 3 ? "atenção" : "saudável",
        tooltip: "Em média, quantas vezes cada pessoa viu seus anúncios. >3× cansa, >5× é crítico.",
        platformDot: t.metaColor,
        accent: freq >= 5 ? t.red : freq >= 3 ? t.amber : t.tealMid,
      });
    }
  }

  const visible = tiles.filter((x) => !hidden.has(x.id));

  if (loading) return <KpiSkeletonGrid />;
  if (tiles.length === 0) {
    return <EmptyState text="Sem dados de performance no período." />;
  }
  if (visible.length === 0) {
    return <EmptyState text="Todas as métricas de Performance estão ocultas. Use 'Organizar' pra ativar." />;
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 14,
      }}
    >
      {visible.map((tile) => (
        <SmallKpiTile key={tile.id} {...tile} />
      ))}
    </div>
  );
}

// ─── Engagement Metrics Grid ────────────────────────────────────

function EngagementMetricsGrid({
  googleData,
  metaData,
  loading,
  hidden = new Set<string>(),
}: {
  googleData: GoogleData | null;
  metaData: MetaData | null;
  loading: boolean;
  hidden?: Set<string>;
}) {
  const t = useTokens();
  const g = googleData?.summary as any;
  const m = metaData?.summary as any;
  const gCurr = googleData?.account?.currencyCode || "BRL";
  const mCurr = metaData?.account?.currency || "BRL";

  const tiles: Array<{
    id: string;
    label: string;
    value: string;
    sub?: string;
    tooltip: string;
    platformDot: string;
    accent?: string;
  }> = [];

  if (m && m.spend > 0) {
    if ((m.linkClicks || 0) > 0) {
      tiles.push({
        id: "m_link_clicks",
        label: "Cliques no link (Meta)",
        value: (m.linkClicks || 0).toLocaleString("pt-BR"),
        sub: "que levaram ao site",
        tooltip: "Cliques que levaram ao seu site. Subset dos cliques totais.",
        platformDot: t.metaColor,
      });
    }
    if ((m.landingPageViews || 0) > 0) {
      tiles.push({
        id: "m_lpv_eng",
        label: "Visitas ao site (Meta)",
        value: (m.landingPageViews || 0).toLocaleString("pt-BR"),
        sub: `${fmtCurrency(m.costPerLandingPageView || 0, mCurr)} cada`,
        tooltip: "Pessoas que clicaram E carregaram o site (não bounce). Mede qualidade do tráfego.",
        platformDot: t.metaColor,
      });
    }
    // Bounce rate estimate (visits / link clicks)
    if ((m.linkClicks || 0) > 0 && (m.landingPageViews || 0) > 0) {
      const lpvRate = m.landingPageViews / m.linkClicks;
      tiles.push({
        id: "m_lpv_rate",
        label: "Taxa de carregamento",
        value: `${(lpvRate * 100).toFixed(1)}%`,
        sub: lpvRate >= 0.85 ? "site rápido" : lpvRate >= 0.6 ? "ok" : "site lento",
        tooltip: "Visitas ÷ cliques no link. Mede se quem clica realmente espera o site carregar.",
        platformDot: t.metaColor,
        accent: lpvRate >= 0.85 ? t.tealMid : lpvRate >= 0.6 ? undefined : t.amber,
      });
    }
  }

  if (g && g.cost > 0) {
    if ((g.clicks || 0) > 0) {
      tiles.push({
        id: "g_clicks",
        label: "Cliques (Google)",
        value: (g.clicks || 0).toLocaleString("pt-BR"),
        sub: "total de cliques",
        tooltip: "Cliques nos anúncios Google (qualquer tipo).",
        platformDot: t.googleColor,
      });
    }
    if ((g.impressions || 0) > 0) {
      tiles.push({
        id: "g_impressions",
        label: "Impressões (Google)",
        value: compact(g.impressions || 0),
        sub: "exibições do anúncio",
        tooltip: "Quantas vezes seus anúncios apareceram no Google.",
        platformDot: t.googleColor,
      });
    }
  }

  if (m && (m.impressions || 0) > 0) {
    tiles.push({
      id: "m_impressions",
      label: "Impressões (Meta)",
      value: compact(m.impressions || 0),
      sub: "exibições do anúncio",
      tooltip: "Quantas vezes seus anúncios apareceram no Meta.",
      platformDot: t.metaColor,
    });
  }

  const visible = tiles.filter((x) => !hidden.has(x.id));

  if (loading) return <KpiSkeletonGrid />;
  if (tiles.length === 0) {
    return <EmptyState text="Sem dados de engajamento no período." />;
  }
  if (visible.length === 0) {
    return <EmptyState text="Todas as métricas de Engajamento estão ocultas. Use 'Organizar' pra ativar." />;
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 14,
      }}
    >
      {visible.map((tile) => (
        <SmallKpiTile key={tile.id} {...tile} />
      ))}
    </div>
  );
}

// ─── Conversion Metrics Grid ────────────────────────────────────

function ConversionMetricsGrid({
  googleData,
  metaData,
  loading,
  hidden = new Set<string>(),
}: {
  googleData: GoogleData | null;
  metaData: MetaData | null;
  loading: boolean;
  hidden?: Set<string>;
}) {
  const t = useTokens();
  const g = googleData?.summary as any;
  const m = metaData?.summary as any;
  const gCurr = googleData?.account?.currencyCode || "BRL";
  const mCurr = metaData?.account?.currency || "BRL";

  // Lista de tiles: [id, label, value, sub, tooltip, platform]
  const tiles: Array<{
    id: string;
    label: string;
    value: string;
    sub?: string;
    tooltip: string;
    platformDot: string;
    accent?: string;
  }> = [];

  if (g && g.cost > 0) {
    tiles.push({
      id: "g_revenue",
      label: "Receita (Google)",
      value: fmtCurrency(g.conversionsValue || 0, gCurr),
      sub: "valor das conversões",
      tooltip: "Soma dos valores configurados no conversion tracking do Google Ads.",
      platformDot: t.googleColor,
    });
    tiles.push({
      id: "g_roas",
      label: "ROAS (Google)",
      value: (g.roas || 0).toFixed(2) + "×",
      sub: g.roas >= 2 ? "lucrativo" : g.roas >= 1 ? "borderline" : "abaixo do investido",
      tooltip: "Retorno sobre investimento em anúncios. ROAS 3× = R$ 3 de receita pra cada R$ 1 gasto.",
      platformDot: t.googleColor,
      accent: g.roas >= 2 ? t.tealMid : g.roas >= 1 ? t.amber : t.red,
    });
    tiles.push({
      id: "g_cpa",
      label: "CPA (Google)",
      value: fmtCurrency(g.costPerConversion || 0, gCurr),
      sub: `${(g.conversions || 0).toLocaleString("pt-BR")} conversões`,
      tooltip: "Custo médio por conversão. Quanto menor, mais eficiente.",
      platformDot: t.googleColor,
    });
  }

  if (m && m.spend > 0) {
    tiles.push({
      id: "m_purchase_value",
      label: "Vendas (Meta)",
      value: fmtCurrency(m.purchaseValue || 0, mCurr),
      sub: "valor das compras",
      tooltip: "Valor total das compras atribuídas às campanhas Meta (pixel + Conversion API).",
      platformDot: t.metaColor,
    });
    tiles.push({
      id: "m_roas",
      label: "ROAS (Meta)",
      value: (m.purchaseRoas || 0).toFixed(2) + "×",
      sub: m.purchaseRoas >= 2 ? "lucrativo" : m.purchaseRoas >= 1 ? "borderline" : "abaixo do investido",
      tooltip: "Vendas Meta ÷ Investimento. ROAS 2× ou mais é considerado lucrativo.",
      platformDot: t.metaColor,
      accent: m.purchaseRoas >= 2 ? t.tealMid : m.purchaseRoas >= 1 ? t.amber : t.red,
    });
    if (m.leads > 0) {
      tiles.push({
        id: "m_leads",
        label: "Leads (Meta)",
        value: (m.leads || 0).toLocaleString("pt-BR"),
        sub: `${fmtCurrency(m.costPerLead || 0, mCurr)} cada`,
        tooltip: "Leads gerados via formulário Meta ou pixel (lead event).",
        platformDot: t.metaColor,
      });
    }
    if (m.purchases > 0) {
      tiles.push({
        id: "m_purchases",
        label: "Compras (Meta)",
        value: (m.purchases || 0).toLocaleString("pt-BR"),
        sub: `${fmtCurrency(m.costPerPurchase || 0, mCurr)} cada · ticket ${fmtCurrency(m.ticketMedio || 0, mCurr)}`,
        tooltip: "Compras registradas pelo pixel ou Conversion API.",
        platformDot: t.metaColor,
      });
    }
    if (m.conversations > 0) {
      tiles.push({
        id: "m_conversations",
        label: "Conversas (Meta)",
        value: (m.conversations || 0).toLocaleString("pt-BR"),
        sub: `${fmtCurrency(m.costPerConversation || 0, mCurr)} cada`,
        tooltip: "Conversas iniciadas no WhatsApp/Messenger a partir do anúncio.",
        platformDot: t.metaColor,
      });
    }
    if (m.landingPageViews > 0) {
      tiles.push({
        id: "m_lpv",
        label: "Visitas ao site (Meta)",
        value: (m.landingPageViews || 0).toLocaleString("pt-BR"),
        sub: `${fmtCurrency(m.costPerLandingPageView || 0, mCurr)} cada`,
        tooltip: "Pessoas que clicaram E carregaram o site (não bounce). Mede qualidade do tráfego.",
        platformDot: t.metaColor,
      });
    }
  }

  const visible = tiles.filter((x) => !hidden.has(x.id));

  if (loading) return <KpiSkeletonGrid />;
  if (tiles.length === 0) {
    return (
      <EmptyState text="Sem dados de conversão no período. Configure conversion tracking no Google e pixel/CAPI no Meta." />
    );
  }
  if (visible.length === 0) {
    return (
      <EmptyState text="Todas as métricas de Conversão estão ocultas. Use 'Organizar' pra ativar." />
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 14,
      }}
    >
      {visible.map((tile) => (
        <SmallKpiTile key={tile.id} {...tile} />
      ))}
    </div>
  );
}

function SmallKpiTile({
  label,
  value,
  sub,
  tooltip,
  platformDot,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  tooltip: string;
  platformDot: string;
  accent?: string;
}) {
  const t = useTokens();
  return (
    <div
      className="arc-card"
      style={{
        padding: "16px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        minHeight: 120,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 7, height: 7, borderRadius: 999, background: platformDot, flexShrink: 0 }} />
          <span
            style={{
              fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
              fontSize: 9.5,
              color: t.textMute,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            {label}
          </span>
        </div>
        <InfoTooltip text={tooltip} />
      </div>
      <span
        className="tabular"
        style={{
          fontSize: 24,
          fontWeight: 700,
          color: accent || t.text,
          letterSpacing: "-0.025em",
          lineHeight: 1.1,
        }}
      >
        {value}
      </span>
      {sub && (
        <span style={{ fontSize: 11, color: t.textDim, lineHeight: 1.4 }}>{sub}</span>
      )}
    </div>
  );
}

function InfoTooltip({ text }: { text: string }) {
  const t = useTokens();
  return (
    <span
      title={text}
      style={{
        width: 16,
        height: 16,
        borderRadius: 999,
        background: t.hover,
        color: t.textMute,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 10,
        fontWeight: 700,
        fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
        cursor: "help",
        flexShrink: 0,
      }}
    >
      i
    </span>
  );
}

function KpiSkeletonGrid() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 14,
      }}
    >
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="arc-card" style={{ padding: "16px 18px", minHeight: 120 }}>
          <span className="skeleton" style={{ display: "block", height: 10, width: "50%", marginBottom: 12 }} />
          <span className="skeleton" style={{ display: "block", height: 24, width: "70%" }} />
        </div>
      ))}
    </div>
  );
}

function fmtCurrency(v: number, currency: string): string {
  return v.toLocaleString("pt-BR", {
    style: "currency",
    currency,
    maximumFractionDigits: v >= 1000 ? 0 : 2,
    minimumFractionDigits: v >= 1000 ? 0 : 2,
  });
}

// ─── Video Analysis Block ───────────────────────────────────────

function VideoAnalysisBlock({
  metaData,
  loading,
  hidden = new Set<string>(),
}: {
  metaData: MetaData | null;
  loading: boolean;
  hidden?: Set<string>;
}) {
  const t = useTokens();
  const m = metaData?.summary as any;
  const currency = metaData?.account?.currency || "BRL";

  if (loading) return <KpiSkeletonGrid />;
  if (!m || (m.video3SecWatched || 0) === 0) {
    return (
      <EmptyState text="Não há dados de vídeo no período (sem visualizações de 3 seg.). Esse bloco aparece quando há campanhas com criativo em vídeo no Meta." />
    );
  }

  const hookRate = m.hookRate || 0;
  const holdRate = m.holdRate || 0;
  const thruRate = m.thruPlayRate || 0;

  const hookTone = hookRate >= 0.30 ? t.tealMid : hookRate >= 0.20 ? t.amber : t.red;
  const holdTone = holdRate >= 0.60 ? t.tealMid : holdRate >= 0.40 ? t.amber : t.red;
  const thruTone = thruRate >= 0.15 ? t.tealMid : thruRate >= 0.05 ? t.amber : t.red;

  const tiles = [
    {
      id: "v_hook",
      label: "Hook Rate",
      value: `${(hookRate * 100).toFixed(2)}%`,
      sub: hookRate >= 0.30 ? "criativo segura o scroll" : hookRate >= 0.20 ? "atenção" : "criativo fraco",
      tooltip: "Taxa de Parada no Gancho. % das pessoas que pararam o scroll e viram 3 seg. Benchmark Reels: 25-35%.",
      platformDot: t.metaColor,
      accent: hookTone,
    },
    {
      id: "v_hold",
      label: "Hold Rate",
      value: `${(holdRate * 100).toFixed(2)}%`,
      sub: holdRate >= 0.60 ? "conteúdo retém" : holdRate >= 0.40 ? "atenção" : "perde rápido",
      tooltip: "Taxa de Retenção. % das pessoas que viram 3 seg e ficaram até 25%. Mede qualidade do conteúdo após o gancho. Bom: 50-70%.",
      platformDot: t.metaColor,
      accent: holdTone,
    },
    {
      id: "v_thru",
      label: "ThruPlay Rate",
      value: `${(thruRate * 100).toFixed(2)}%`,
      sub: "completaram a view qualificada",
      tooltip: "% das impressões que viraram ThruPlay (15s+ ou completo, o que vier primeiro).",
      platformDot: t.metaColor,
      accent: thruTone,
    },
    {
      id: "v_avg_time",
      label: "Tempo Médio",
      value:
        (m.videoAvgTimeWatched || 0) < 60
          ? `${(m.videoAvgTimeWatched || 0).toFixed(1)}s`
          : `${Math.floor(m.videoAvgTimeWatched / 60)}m ${Math.round(m.videoAvgTimeWatched - Math.floor(m.videoAvgTimeWatched / 60) * 60)}s`,
      sub: "assistido por impressão",
      tooltip: "Segundos médios assistidos por impressão (não só por quem deu play).",
      platformDot: t.metaColor,
    },
    {
      id: "v_cp_hook",
      label: "CP-Hook",
      value: fmtCurrency(m.costPer3SecView || 0, currency),
      sub: "custo de cada parada no scroll",
      tooltip: "Custo por gancho. Compara força relativa de criativos.",
      platformDot: t.metaColor,
    },
    {
      id: "v_cp_thru",
      label: "CP-ThruPlay",
      value: fmtCurrency(m.costPerThruPlay || 0, currency),
      sub: "custo de visualização qualificada",
      tooltip: "Custo por ThruPlay (view qualificada).",
      platformDot: t.metaColor,
    },
  ];

  const visibleTiles = tiles.filter((tile) => !hidden.has(tile.id));

  // Curva de retenção
  const views3s = m.video3SecWatched || 0;
  const retention = [
    { label: "3 seg.", value: 100, count: views3s },
    { label: "25%", value: views3s > 0 ? ((m.videoP25Watched || 0) / views3s) * 100 : 0, count: m.videoP25Watched || 0 },
    { label: "50%", value: views3s > 0 ? ((m.videoP50Watched || 0) / views3s) * 100 : 0, count: m.videoP50Watched || 0 },
    { label: "75%", value: views3s > 0 ? ((m.videoP75Watched || 0) / views3s) * 100 : 0, count: m.videoP75Watched || 0 },
    { label: "95%", value: views3s > 0 ? ((m.videoP95Watched || 0) / views3s) * 100 : 0, count: m.videoP95Watched || 0 },
    { label: "Final", value: views3s > 0 ? ((m.videoP100Watched || 0) / views3s) * 100 : 0, count: m.videoP100Watched || 0 },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 14,
        }}
      >
        {visibleTiles.map((tile) => (
          <SmallKpiTile key={tile.id} {...tile} />
        ))}
      </div>

      {/* Curva de retenção */}
      <div className="arc-card" style={{ padding: "22px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, gap: 16, flexWrap: "wrap" }}>
          <div>
            <Eyebrow>Curva de retenção</Eyebrow>
            <p style={{ fontSize: 13, color: t.textDim, margin: "6px 0 0", lineHeight: 1.5, maxWidth: 480 }}>
              De cada 100 pessoas que pararam no gancho (3 seg), quantas ficaram até cada etapa do vídeo. Queda forte cedo = problema de meio do vídeo.
            </p>
          </div>
          <InfoTooltip text="Baseado em video_p25/p50/p75/p95/p100_watched_actions do Meta. Numerador é os 3 segundos." />
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 160 }}>
          {retention.map((r, i) => {
            const heightPct = Math.max(r.value, 2); // mínimo 2% pra visualizar barra zero
            const isLow = r.value < 20;
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <span
                  className="tabular"
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: isLow ? t.red : t.text,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {r.value.toFixed(0)}%
                </span>
                <div
                  style={{
                    width: "100%",
                    background: t.hover,
                    borderRadius: 8,
                    overflow: "hidden",
                    height: "100%",
                    display: "flex",
                    alignItems: "flex-end",
                    border: `1px solid ${t.border}`,
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: `${heightPct}%`,
                      background: `linear-gradient(180deg, ${t.tealMid} 0%, ${t.mint} 100%)`,
                      borderRadius: 6,
                      transition: "height 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                  />
                </div>
                <span style={{ fontSize: 10.5, color: t.textMute, fontWeight: 500 }}>
                  {r.label}
                </span>
                <span className="tabular" style={{ fontSize: 10, color: t.textMute }}>
                  {(r.count || 0).toLocaleString("pt-BR")}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
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

