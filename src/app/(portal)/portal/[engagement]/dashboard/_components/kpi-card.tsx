"use client";

// Card reusável de KPI (Key Performance Indicator) pra dashboards.
// Layout editorial Arthea: número grande em Fraunces italic, label mono uppercase.
//
// `tone`:
//   - "default" — neutro
//   - "good"    — accent verde (destaque positivo)
//   - "warn"    — amarelo (atenção, ex: frequência alta)
//   - "danger"  — vermelho (problema sério, ex: frequência muito alta)

import type { ReactNode } from "react";

export type KpiTone = "default" | "good" | "warn" | "danger";

const TONE_STYLES: Record<
  KpiTone,
  { bg: string; border: string; valueColor: string; labelColor: string }
> = {
  default: {
    bg: "white",
    border: "rgba(13,74,74,0.10)",
    valueColor: "#1A1A1A",
    labelColor: "#8B867B",
  },
  good: {
    bg: "var(--accent-soft)",
    border: "var(--accent-border)",
    valueColor: "var(--accent-deep)",
    labelColor: "var(--accent)",
  },
  warn: {
    bg: "#FEF7E5",
    border: "#F5D88A",
    valueColor: "#92400E",
    labelColor: "#92400E",
  },
  danger: {
    bg: "#FEF2F2",
    border: "#FCA5A5",
    valueColor: "#991B1B",
    labelColor: "#991B1B",
  },
};

export function KpiCard({
  label,
  value,
  sub,
  tone = "default",
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: KpiTone;
  icon?: ReactNode;
}) {
  const t = TONE_STYLES[tone];
  return (
    <div
      style={{
        background: t.bg,
        border: `0.5px solid ${t.border}`,
        borderRadius: 16,
        padding: "20px 22px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        minHeight: 130,
        boxShadow: "0 1px 2px rgba(13,74,74,0.03)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <span
          style={{
            fontFamily: "ui-monospace, 'JetBrains Mono', Menlo, monospace",
            fontSize: 10.5,
            color: t.labelColor,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          {label}
        </span>
        {icon}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span
          style={{
            fontFamily: "Fraunces, Georgia, serif",
            fontSize: 30,
            fontWeight: 400,
            letterSpacing: "-0.025em",
            color: t.valueColor,
            lineHeight: 1.05,
          }}
        >
          {value}
        </span>
        {sub && (
          <span
            style={{
              fontSize: 12,
              color: t.labelColor,
              opacity: 0.75,
            }}
          >
            {sub}
          </span>
        )}
      </div>
    </div>
  );
}
