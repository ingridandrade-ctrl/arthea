"use client";

// Dashboard de performance do cliente. Holds 2 tabs (Google / Meta) e o
// seletor de período compartilhado. Busca ambos os endpoints em paralelo.

import { useEffect, useState } from "react";
import { Calendar, Sparkles } from "lucide-react";
import { GoogleSection, type GoogleData } from "./google-section";
import { MetaSection, type MetaData } from "./meta-section";

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

export function PerformanceDashboard({
  engagementId,
  engagementName,
}: {
  engagementId: string;
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

  return (
    <div style={{ padding: "32px 8px 64px", maxWidth: 1200, margin: "0 auto" }}>
      {/* Cabeçalho */}
      <header style={{ marginBottom: 28 }}>
        <p
          style={{
            fontFamily: "ui-monospace, 'JetBrains Mono', Menlo, monospace",
            fontSize: 11,
            color: "#8B867B",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            fontWeight: 600,
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Sparkles size={12} color="#1D7070" />
          {engagementName} · Performance
        </p>
        <h1
          style={{
            fontFamily: "Fraunces, Georgia, serif",
            fontSize: 36,
            fontWeight: 400,
            fontStyle: "italic",
            letterSpacing: "-0.025em",
            color: "#1A1A1A",
            margin: "8px 0 0",
            lineHeight: 1.1,
          }}
        >
          Dashboard
        </h1>
        <p style={{ fontSize: 14, color: "#6B7280", margin: "8px 0 0", maxWidth: 600, lineHeight: 1.55 }}>
          Acompanhe o desempenho das suas campanhas no Google e no Instagram/Facebook em tempo
          quase real. Atualizamos os dados a cada hora.
        </p>
      </header>

      {/* Toolbar — tabs + period */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        <div
          role="tablist"
          style={{
            display: "inline-flex",
            background: "white",
            border: "0.5px solid rgba(13,74,74,0.10)",
            borderRadius: 999,
            padding: 4,
            gap: 2,
          }}
        >
          <TabButton active={tab === "google"} onClick={() => setTab("google")}>
            Google Ads
          </TabButton>
          <TabButton active={tab === "meta"} onClick={() => setTab("meta")}>
            Meta Ads
          </TabButton>
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            background: "white",
            border: "0.5px solid rgba(13,74,74,0.10)",
            borderRadius: 999,
            padding: "6px 14px 6px 12px",
          }}
        >
          <Calendar size={14} color="#8B867B" strokeWidth={1.7} />
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            style={{
              border: "none",
              background: "transparent",
              fontSize: 13,
              color: "#1A1A1A",
              fontFamily: "inherit",
              cursor: "pointer",
              outline: "none",
              paddingRight: 4,
            }}
          >
            {PERIODS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Conteúdo da tab */}
      <div role="tabpanel">
        {tab === "google" ? (
          <GoogleSection data={googleData} loading={loading} />
        ) : (
          <MetaSection data={metaData} loading={loading} />
        )}
      </div>
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
        padding: "8px 18px",
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
