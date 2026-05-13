"use client";

import { Check } from "lucide-react";

export function PhaseTimeline({
  current,
  perPhase,
  phaseNames,
}: {
  current: number;
  perPhase: { total: number; approved: number }[]; // por fase
  phaseNames: string[]; // 1-indexed: índice 0 é vazio, fases começam em 1
}) {
  // Pega só os nomes a partir do índice 1 (pulando o "" inicial)
  const names = phaseNames.slice(1).filter(Boolean);
  const totalPhases = names.length;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${totalPhases}, 1fr)`,
        gap: 0,
        position: "relative",
      }}
    >
      {names.map((name, i) => {
        const phase = i + 1;
        const stats = perPhase[i] || { total: 0, approved: 0 };
        const pct = stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0;
        const completed = phase < current || (stats.total > 0 && pct === 100);
        const active = phase === current;
        const isLast = i === totalPhases - 1;

        return (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              position: "relative",
              padding: "0 6px",
            }}
          >
            {/* connector line */}
            {!isLast && (
              <div
                style={{
                  position: "absolute",
                  top: 17,
                  left: "calc(50% + 22px)",
                  right: "calc(-50% + 22px)",
                  height: 2,
                  background: completed ? "var(--accent)" : "rgba(13,74,74,0.12)",
                  zIndex: 0,
                  transition: "background 0.6s ease",
                }}
              />
            )}

            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 999,
                background: completed
                  ? "var(--accent)"
                  : active
                  ? "white"
                  : "white",
                border: completed
                  ? "2px solid var(--accent)"
                  : active
                  ? "2px solid var(--accent)"
                  : "2px solid rgba(13,74,74,0.15)",
                color: completed ? "white" : active ? "var(--accent)" : "#A0A0A0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 600,
                fontSize: 14,
                marginBottom: 12,
                position: "relative",
                zIndex: 1,
                boxShadow: active
                  ? "0 0 0 6px var(--accent-soft)"
                  : "none",
                transition: "all 0.3s ease",
              }}
            >
              {completed ? <Check size={16} strokeWidth={3} /> : phase}
            </div>

            <p
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: active ? "var(--accent)" : "#A0A0A0",
                margin: 0,
                textAlign: "center",
              }}
            >
              Fase {phase}
            </p>
            <p
              style={{
                fontSize: 12,
                fontWeight: active ? 600 : 400,
                color: active ? "#2A2A2A" : "#6B7280",
                textAlign: "center",
                margin: "4px 0 0",
                lineHeight: 1.3,
              }}
            >
              {name}
            </p>
            {stats.total > 0 && (
              <p
                style={{
                  fontSize: 10.5,
                  color: completed ? "var(--accent)" : "#A0A0A0",
                  margin: "6px 0 0",
                  fontWeight: 500,
                }}
              >
                {stats.approved}/{stats.total}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
