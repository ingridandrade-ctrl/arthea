"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Check, Sparkles, Clock, RotateCcw, FileText } from "lucide-react";
import {
  phaseNamesFor,
  STATUS_BG,
  STATUS_FG,
  STATUS_LABEL,
  statusLabelFor,
  type DeliverableStatus,
} from "./deliverable-status";

type Item = {
  id: string;
  title: string;
  description: string | null;
  phase: number;
  status: string;
  kind?: string | null;
};

const STATUS_FILTERS: { key: "ALL" | DeliverableStatus; label: string }[] = [
  { key: "ALL", label: "Todos" },
  { key: "WAITING_REVIEW", label: "Aguardando você" },
  { key: "IN_PROGRESS", label: "Em produção" },
  { key: "APPROVED", label: "Aprovados" },
  { key: "REVISION", label: "Em revisão" },
  { key: "PENDING", label: "Em preparação" },
];

const STATUS_ICON: Record<string, any> = {
  PENDING: Clock,
  IN_PROGRESS: Clock,
  WAITING_REVIEW: Sparkles,
  APPROVED: Check,
  REVISION: RotateCcw,
};

export function DeliverablesView({
  items,
  engagementSlug,
  engagementType,
}: {
  items: Item[];
  engagementSlug: string;
  engagementType?: string | null;
}) {
  const phaseNames = phaseNamesFor(engagementType);
  const [activeStatus, setActiveStatus] = useState<"ALL" | DeliverableStatus>("ALL");

  const counts = useMemo(() => {
    const c: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    for (const i of items) c[i.phase] = (c[i.phase] || 0) + 1;
    return c;
  }, [items]);

  const grouped = useMemo(() => {
    const filtered = items.filter(
      (i) => activeStatus === "ALL" || i.status === activeStatus
    );
    const g: Record<number, Item[]> = { 1: [], 2: [], 3: [], 4: [] };
    for (const it of filtered) g[it.phase].push(it);
    return g;
  }, [items, activeStatus]);

  return (
    <div
      className="portal-fade-in"
      style={{ display: "flex", flexDirection: "column", gap: 32 }}
    >
      <header>
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
          Entregáveis
        </p>
        <h1
          style={{
            fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
            fontSize: "clamp(32px, 4.5vw, 44px)",
            fontWeight: 700,
            color: "#1A1A1A",
            margin: "12px 0 10px",
            letterSpacing: "-0.025em",
            lineHeight: 1.1,
          }}
        >
          Acompanhe cada{" "}
          <em
            style={{
              fontFamily: "Fraunces, Georgia, serif",
              fontWeight: 400,
              fontStyle: "italic",
              color: "var(--accent)",
            }}
          >
            etapa
          </em>{" "}
          do seu projeto
        </h1>
        <p style={{ fontSize: 15, color: "#6B7280", margin: 0, maxWidth: 580 }}>
          Cada fase agrupa os entregáveis correspondentes. Clique em um item para revisar e validar.
        </p>
      </header>

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
                padding: "7px 14px",
                borderRadius: 999,
                fontSize: 12.5,
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

      {/* Timeline by phase */}
      <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
        {[1, 2, 3, 4].map((phase) => {
          const list = grouped[phase];
          const allCount = counts[phase] || 0;
          if (allCount === 0) return null; // hide phases with nothing

          return (
            <section key={phase} style={{ position: "relative" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 999,
                    background: "var(--accent-soft)",
                    color: "var(--accent)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "Fraunces, Georgia, serif",
                    fontSize: 15,
                    fontWeight: 500,
                  }}
                >
                  {phase}
                </span>
                <h2
                  style={{
                    fontSize: 17,
                    fontWeight: 500,
                    color: "#2A2A2A",
                    margin: 0,
                    fontFamily: "Fraunces, Georgia, serif",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {phaseNames[phase] || ""}
                </h2>
                <span
                  style={{
                    fontSize: 12,
                    color: "#A0A0A0",
                    fontWeight: 500,
                  }}
                >
                  {allCount} {allCount === 1 ? "entregável" : "entregáveis"}
                </span>
              </div>

              {list.length === 0 ? (
                <p
                  style={{
                    fontSize: 13,
                    color: "#A0A0A0",
                    fontStyle: "italic",
                    paddingLeft: 44,
                    margin: 0,
                  }}
                >
                  Sem entregáveis com esse filtro nesta fase.
                </p>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    position: "relative",
                    paddingLeft: 44,
                  }}
                >
                  {/* vertical track */}
                  <div
                    style={{
                      position: "absolute",
                      left: 15,
                      top: 0,
                      bottom: 0,
                      width: 2,
                      background:
                        "linear-gradient(to bottom, var(--accent-soft), transparent)",
                    }}
                  />

                  {list.map((d, idx) => {
                    const status = d.status as DeliverableStatus;
                    const Icon = STATUS_ICON[status] || FileText;
                    const isApproved = status === "APPROVED";
                    const isWaiting = status === "WAITING_REVIEW";

                    return (
                      <Link
                        key={d.id}
                        href={`/portal/${engagementSlug}/entregaveis/${d.id}`}
                        className="portal-card-hover portal-stagger"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 16,
                          background: isWaiting ? "var(--accent-soft)" : "white",
                          border: isWaiting
                            ? "0.5px solid var(--accent-border)"
                            : "0.5px solid rgba(29,112,112,0.08)",
                          borderRadius: 16,
                          padding: "16px 20px",
                          textDecoration: "none",
                          color: "inherit",
                          boxShadow: "0 1px 2px rgba(13,74,74,0.03)",
                          position: "relative",
                          animationDelay: `${idx * 60}ms`,
                        }}
                      >
                        {/* node bullet */}
                        <span
                          style={{
                            position: "absolute",
                            left: -36,
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: 16,
                            height: 16,
                            borderRadius: 999,
                            background: isApproved
                              ? "var(--accent)"
                              : isWaiting
                              ? "white"
                              : "white",
                            border: isApproved
                              ? "2px solid var(--accent)"
                              : isWaiting
                              ? "2px solid var(--accent)"
                              : "2px solid rgba(13,74,74,0.18)",
                            boxShadow: isWaiting ? "0 0 0 4px var(--accent-soft)" : "none",
                          }}
                        >
                          {isApproved && (
                            <Check
                              size={9}
                              strokeWidth={3.5}
                              color="white"
                              style={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                transform: "translate(-50%, -50%)",
                              }}
                            />
                          )}
                        </span>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p
                            style={{
                              fontSize: 14.5,
                              fontWeight: 500,
                              color: "#2A2A2A",
                              margin: 0,
                            }}
                          >
                            {d.title}
                          </p>
                          {d.description && (
                            <p
                              style={{
                                fontSize: 12.5,
                                color: "#6B7280",
                                margin: "4px 0 0",
                              }}
                            >
                              {d.description}
                            </p>
                          )}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 500,
                              background: STATUS_BG[status],
                              color: STATUS_FG[status],
                              padding: "4px 10px",
                              borderRadius: 999,
                              whiteSpace: "nowrap",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                            }}
                          >
                            <Icon size={11} strokeWidth={2} />
                            {statusLabelFor(status, d.kind)}
                          </span>
                          <ArrowRight size={14} strokeWidth={1.6} color="#A0A0A0" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}

        {Object.values(grouped).every((arr) => arr.length === 0) && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#A0A0A0", fontSize: 14 }}>
            Nenhum entregável com esse filtro.
          </div>
        )}
      </div>
    </div>
  );
}
