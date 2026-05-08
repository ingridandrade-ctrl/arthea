"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import {
  PHASE_NAMES,
  STATUS_BG,
  STATUS_FG,
  STATUS_LABEL,
  type DeliverableStatus,
} from "./deliverable-status";

type Item = {
  id: string;
  title: string;
  description: string | null;
  phase: number;
  status: string;
};

const STATUS_FILTERS: { key: "ALL" | DeliverableStatus; label: string }[] = [
  { key: "ALL", label: "Todos" },
  { key: "WAITING_REVIEW", label: "Aguardando você" },
  { key: "IN_PROGRESS", label: "Em produção" },
  { key: "APPROVED", label: "Aprovados" },
  { key: "REVISION", label: "Em revisão" },
  { key: "PENDING", label: "Em preparação" },
];

export function DeliverablesView({ items }: { items: Item[] }) {
  const [activePhase, setActivePhase] = useState<number>(1);
  const [activeStatus, setActiveStatus] = useState<"ALL" | DeliverableStatus>("ALL");

  const counts = useMemo(() => {
    const c: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    for (const i of items) c[i.phase] = (c[i.phase] || 0) + 1;
    return c;
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter(
      (i) =>
        i.phase === activePhase && (activeStatus === "ALL" || i.status === activeStatus)
    );
  }, [items, activePhase, activeStatus]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }} className="portal-fade-in">
      <header>
        <p
          style={{
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--accent)",
            margin: 0,
          }}
        >
          Entregáveis
        </p>
        <h1
          style={{
            fontFamily: "Fraunces, Georgia, serif",
            fontSize: 36,
            fontWeight: 400,
            color: "#2A2A2A",
            margin: "8px 0 8px",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
          }}
        >
          Acompanhe cada etapa
        </h1>
        <p style={{ fontSize: 14, color: "#6B7280", margin: 0 }}>
          Cada fase agrupa os entregáveis correspondentes. Clique em um item para revisar e validar.
        </p>
      </header>

      {/* Phase tabs */}
      <div
        style={{
          display: "flex",
          gap: 8,
          borderBottom: "0.5px solid rgba(13,74,74,0.1)",
          paddingBottom: 0,
        }}
      >
        {[1, 2, 3, 4].map((phase) => {
          const active = activePhase === phase;
          return (
            <button
              key={phase}
              onClick={() => setActivePhase(phase)}
              style={{
                background: "transparent",
                border: "none",
                padding: "10px 4px",
                fontSize: 13,
                fontFamily: "inherit",
                color: active ? "var(--accent)" : "#6B7280",
                fontWeight: active ? 600 : 400,
                cursor: "pointer",
                borderBottom: active
                  ? "2px solid var(--accent)"
                  : "2px solid transparent",
                marginBottom: -1,
                transition: "all 0.15s ease",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>Fase {phase}</span>
              <span style={{ fontSize: 11, color: active ? "var(--accent)" : "#A0A0A0" }}>
                · {PHASE_NAMES[phase]}
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  background: active ? "var(--accent-soft)" : "rgba(0,0,0,0.06)",
                  color: active ? "var(--accent)" : "#6B7280",
                  padding: "1px 7px",
                  borderRadius: 999,
                }}
              >
                {counts[phase] || 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Status chips */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {STATUS_FILTERS.map((f) => {
          const active = activeStatus === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setActiveStatus(f.key)}
              style={{
                background: active ? "var(--accent)" : "white",
                color: active ? "white" : "#4A4A4A",
                border: active
                  ? "1px solid var(--accent)"
                  : "1px solid rgba(13,74,74,0.12)",
                padding: "6px 12px",
                borderRadius: 999,
                fontSize: 12,
                fontFamily: "inherit",
                cursor: "pointer",
                transition: "all 0.15s ease",
                fontWeight: active ? 500 : 400,
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Items */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#A0A0A0", fontSize: 14 }}>
          Nenhum entregável nesta combinação.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((d) => {
            const status = d.status as DeliverableStatus;
            return (
              <Link
                key={d.id}
                href={`/portal/entregaveis/${d.id}`}
                className="portal-card-hover"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "white",
                  border: "0.5px solid rgba(29,112,112,0.08)",
                  borderRadius: 14,
                  padding: "18px 22px",
                  textDecoration: "none",
                  color: "inherit",
                  boxShadow: "0 1px 2px rgba(13,74,74,0.03)",
                }}
              >
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14.5, fontWeight: 500, color: "#2A2A2A", margin: 0 }}>
                    {d.title}
                  </p>
                  {d.description && (
                    <p style={{ fontSize: 12.5, color: "#6B7280", margin: "4px 0 0" }}>
                      {d.description}
                    </p>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      background: STATUS_BG[status],
                      color: STATUS_FG[status],
                      padding: "4px 10px",
                      borderRadius: 999,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {STATUS_LABEL[status]}
                  </span>
                  <ArrowRight size={14} strokeWidth={1.6} color="#A0A0A0" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
